// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { QueueItem, ServiceStatus, MAX_RETRIES, LIST_RETRY_INTERVAL, QueueItemStatus } from "@/types/queue";
import { View, Text, Pressable, ActivityIndicator, Platform } from "react-native";
import QueueAction from "@/components/features/queue/QueueAction";
import { useState, useMemo, useEffect } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { checkServicesHealth } from "@/services/healthCheck";
import { useDevMode } from "@/contexts/DevModeContext";

interface QueueSectionProps {
  title: string;
  items: QueueItem[];
  onRetry: (items: QueueItem[]) => Promise<void>;
  onClearAll?: () => Promise<void>;
  alwaysShow?: boolean;
}

interface HealthCheckResult {
  directus: boolean;
  eas: boolean;
  allHealthy: boolean;
}

const QueueSection = ({
  title,
  items,
  onRetry,
  onClearAll,
  alwaysShow = false,
}: QueueSectionProps) => {
  const { isConnected } = useNetwork();
  const { showTimers } = useDevMode();
  const [showClearOptions, setShowClearOptions] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<{ time: number; result: HealthCheckResult } | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(true);
  const [consecutiveFailures, setConsecutiveFailures] = useState<{ directus: number; eas: number }>({ directus: 0, eas: 0 });

  // Sort items by most recent first
  const sortedItemsMemo = useMemo(() => 
    [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [items]
  );

  // Check if any items are currently processing
  const hasProcessingItems = useMemo(() => 
    items.some(item => item.status === QueueItemStatus.PROCESSING),
    [items]
  );

  // Debounce retry button visibility
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    if (hasProcessingItems) {
      // When items start processing, hide the button immediately
      setShowRetryButton(false);
    } else {
      // When no items are processing, wait 500ms before showing the button
      timeoutId = setTimeout(() => {
        setShowRetryButton(true);
      }, 1500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [hasProcessingItems]);

  // Separate health check effect
  useEffect(() => {
    let healthCheckInterval: ReturnType<typeof setInterval>;
    let isMounted = true;

    const performHealthCheck = async () => {
      try {
        const healthResult = await checkServicesHealth();
        if (isMounted) {
          setLastHealthCheck({ time: Date.now(), result: healthResult });

          // Update consecutive failure counters
          setConsecutiveFailures(prev => ({
            directus: healthResult.directus ? 0 : prev.directus + 1,
            eas: healthResult.eas ? 0 : prev.eas + 1
          }));
        }
      } catch (error) {
        console.error('Health check failed:', error);
        // Update state to show service as unhealthy
        if (isMounted) {
          setLastHealthCheck(prev => prev ? {
            ...prev,
            result: {
              ...prev.result,
              directus: false,
              eas: false,
              allHealthy: false
            }
          } : {
            time: Date.now(),
            result: {
              directus: false,
              eas: false,
              allHealthy: false
            }
          });

          // Increment failure counters on exception
          setConsecutiveFailures(prev => ({
            directus: prev.directus + 1,
            eas: prev.eas + 1
          }));
        }
      }
    };

    // Initial health check
    performHealthCheck();

    // Set up interval for health checks
    healthCheckInterval = setInterval(performHealthCheck, 30000); // 30 seconds

    return () => {
      isMounted = false;
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
    };
  }, []); // Empty dependency array since we want this to run independently

  // Sync health check with queue processing
  useEffect(() => {
    if (items.some(item => item.directus?.status === ServiceStatus.COMPLETED)) {
      setLastHealthCheck(prev => prev ? {
        ...prev,
        result: { ...prev.result, directus: true }
      } : null);
    }
  }, [items]);

  // Countdown timer effect
  useEffect(() => {
    let countdownInterval: ReturnType<typeof setInterval>;
    let isMounted = true;

    const updateCountdown = async () => {
      if (title.toLowerCase() !== 'active' || !items.length) {
        setRetryCountdown(null);
        return;
      }

      try {
        const lastBatchAttempt = await AsyncStorage.getItem('QUEUE_LAST_BATCH_ATTEMPT');
        const lastAttemptTime = lastBatchAttempt ? new Date(lastBatchAttempt).getTime() : 0;
        const now = Date.now();
        const elapsed = now - lastAttemptTime;
        const remaining = LIST_RETRY_INTERVAL - elapsed;

        if (remaining <= 0) {
          // Time to retry
          if (isMounted) {
            // Start countdown immediately
            setRetryCountdown(LIST_RETRY_INTERVAL / 1000);
          }

          // Use existing health check result for retry
          if (lastHealthCheck?.result.allHealthy) {
            onRetry(sortedItemsMemo);
          } else {
            const modifiedItems = sortedItemsMemo.map(item => ({
              ...item,
              skipRetryIncrement: true
            }));
            onRetry(modifiedItems);
          }

          // Reset the timer
          await AsyncStorage.setItem('QUEUE_LAST_BATCH_ATTEMPT', new Date().toISOString());
        } else {
          if (isMounted) {
            setRetryCountdown(Math.ceil(remaining / 1000));
          }
        }
      } catch (error) {
        console.error('Error updating countdown:', error);
        if (isMounted) {
          setRetryCountdown(null);
        }
      }
    };

    // Initial update
    updateCountdown();

    // Set up interval for countdown updates
    countdownInterval = setInterval(updateCountdown, 1000);

    return () => {
      isMounted = false;
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [title, items.length, sortedItemsMemo, onRetry, lastHealthCheck]);

  // Deduplicate items based on localId
  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.localId)) {
        return false;
      }
      seen.add(item.localId);
      return true;
    });
  }, [items]);

  const showBadge = uniqueItems.length > 0;
  const hasItems = uniqueItems.length > 0;
  
  const getBadgeColor = (title: string) => {
    switch (title.toLowerCase()) {
      case "active":
        return "bg-blue-ocean";
      case "failed":
        return "bg-red-500";
      case "completed":
        return "bg-emerald-600";
      default:
        return "bg-grey-3";
    }
  };

  const handleRetryPress = async () => {
    try {
      onRetry(sortedItemsMemo);
    } catch (error) {
      console.error('Error during retry:', error);
    }
  };

  const shouldShowServiceError = (service: 'directus' | 'eas') => {
    // Only show error if:
    // 1. There are active items in the queue
    // 2. Service has failed at least 2 consecutive times (grace period)
    // 3. Health check indicates service is down
    const FAILURE_THRESHOLD = 2;
    return (
      items.length > 0 &&
      consecutiveFailures[service] >= FAILURE_THRESHOLD &&
      !lastHealthCheck?.result[service]
    );
  };

  if (!hasItems && !alwaysShow) return null;

  return (
    <View className="flex-1">
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          {/* Left: Title and badge */}
          <View className="flex-row items-center">
            <Text className="text-lg font-dm-bold text-grey-9">{title}</Text>
            {showBadge && (
              <View
                style={{
                  backgroundColor: Platform.select({
                    ios: title.toLowerCase() === "active" ? "#2985D0" : // blue-ocean
                          title.toLowerCase() === "failed" ? "#ef4444" : // red-500
                          title.toLowerCase() === "completed" ? "#059669" : // emerald-600
                          "#6B7280", // grey-3
                    android: title.toLowerCase() === "active" ? "#2985D0" : // blue-ocean
                            title.toLowerCase() === "failed" ? "#ef4444" : // red-500
                            title.toLowerCase() === "completed" ? "#059669" : // emerald-600
                            "#6B7280", // grey-3
                  }),
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  marginLeft: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: '600',
                }}>
                  {uniqueItems.length}
                </Text>
              </View>
            )}
          </View>

          {/* Center and Right: Countdown and Retry button */}
          {title.toLowerCase() === 'active' && items.length > 0 && (
            <View className="flex-row items-center gap-2">
              {/* Only show countdown timer in dev mode */}
              {retryCountdown && showTimers && (
                <View className="py-2 rounded-full flex-row items-center">
                  <Ionicons name="time" size={16} color="#6C9EC6" style={{ marginRight: 4 }} />
                  <Text className="text-med-ocean text-sm font-dm-medium">
                    {retryCountdown >= 60 
                      ? `${Math.floor(retryCountdown / 60)}m ${retryCountdown % 60}s`
                      : `${retryCountdown}s`}
                  </Text>
                </View>
              )}
              {/* Show retry button based on showRetryButton state AND network connection */}
              {items.length > 0 && showRetryButton && isConnected && (
                <Pressable
                  onPress={handleRetryPress}
                  className="px-3 py-1.5 rounded-full bg-blue-ocean flex-row items-center active:bg-[#6C9EC6]"
                >
                  <Text className="text-white text-sm font-dm-medium mr-1">
                    Retry 
                  </Text>
                  <Ionicons name="refresh" size={16} color="white"/>

                </Pressable>
              )}
            </View>
          )}

          {/* Clear button (only shown for completed section) */}
          {title.toLowerCase() === 'completed' && (
            <View className="flex-row gap-2">
              {showClearOptions ? (
                <View className="flex-row items-center gap-1.5">
                  <Pressable
                    onPress={() => setShowClearOptions(false)}
                    className="px-3 py-1.5 rounded-full bg-white flex-row items-center border border-gray-300"
                  >
                    <Text className="text-sm font-dm-light text-enaleia-black mr-1">Cancel</Text>
                    <View className="w-4 h-4">
                      <Ionicons name="close" size={16} color="#0D0D0D" />
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      if (onClearAll) {
                        await onClearAll();
                        setShowClearOptions(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-red-500 flex-row items-center"
                  >
                    <Text className="text-sm font-dm-light text-white mr-1 px-1">Clear</Text>
                    <View className="w-4 h-4">
                      <Ionicons name="trash-outline" size={16} color="white" />
                    </View>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowClearOptions(true)}
                  className="h-10 w-10 rounded-full flex-row items-center justify-center"
                >
                  <View className="w-5 h-5">
                    <Ionicons name="trash-outline" size={20} color="#8E8E93" />
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Info Messages Stack */}
        {title.toLowerCase() === 'active' && (
          <View className="space-y-2 mb-2">
            {/* Network Status Message */}
            {!isConnected && (
              <View className="py-2 px-4 rounded-2xl bg-sand-beige border border-grey-3">
                <View className="flex-row">
                  <View className="flex-col justify-start mr-1">
                    <View className="items-center justify-center">
                      <Ionicons 
                        name="cloud-offline" 
                        size={20} 
                        color="#2985D0"
                      />
                    </View>
                  </View>
                  <Text className="text-sm font-dm-regular text-grey-7 flex-1 flex-wrap">
                    {`Network: Unavailable. Processing will resume once connected.`.split('**').map((part, index) => 
                      index % 2 === 1 ? (
                        <Text key={index} className="font-dm-bold">{part}</Text>
                      ) : (
                        part
                      )
                    )}
                  </Text>
                </View>
              </View>
            )}

            {/* Database Status Message */}
            {lastHealthCheck && shouldShowServiceError('directus') && (
              <View className="py-2 px-4 rounded-2xl bg-sand-beige border border-grey-3">
                <View className="flex-row">
                  <View className="flex-col justify-start mr-1">
                    <View className="items-center justify-center">
                      <Ionicons 
                        name="server" 
                        size={20} 
                        color="#2985D0"
                      />
                    </View>
                  </View>
                  <Text className="text-sm font-dm-regular text-grey-7 flex-1 flex-wrap">
                    {`Database: Unreachable`.split('**').map((part, index) => 
                      index % 2 === 1 ? (
                        <Text key={index} className="font-dm-bold">{part}</Text>
                      ) : (
                        part
                      )
                    )}
                  </Text>
                </View>
              </View>
            )}

            {/* Blockchain Status Message */}
            {lastHealthCheck && shouldShowServiceError('eas') && (
              <View className="py-2 px-4 rounded-2xl bg-sand-beige border border-grey-3">
                <View className="flex-row">
                  <View className="flex-col justify-start mr-1">
                    <View className="items-center justify-center">
                      <Ionicons 
                        name="cube" 
                        size={20} 
                        color="#2985D0"
                      />
                    </View>
                  </View>
                  <Text className="text-sm font-dm-regular text-grey-7 flex-1">
                    {`Blockchain: Unreachable`.split('**').map((part, index) => 
                      index % 2 === 1 ? (
                        <Text key={index} className="font-dm-bold">{part}</Text>
                      ) : (
                        part
                      )
                    )}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Failed Section Message */}
        {title.toLowerCase() === 'failed' && items.length > 0 && (
          <View className="mb-2 py-2 px-4 rounded-2xl bg-sand-beige border border-grey-3">
            <View className="flex-row">
              <View className="flex-col justify-start mr-1">
                <View className="items-center justify-center">
                  <Ionicons 
                    name="help-buoy" 
                    size={20} 
                    color="#ef4444"
                  />
                </View>
              </View>
              <Text className="text-sm font-dm-regular text-grey-7 flex-1">
                Failed items require your attention to be rescued. Tap the item and email your data to Enaleia.
              </Text>
            </View>
          </View>
        )}

        <View className="rounded-2xl overflow-hidden border border-grey-3 mt-1">
          {hasItems ? (
            uniqueItems.map((item, index) => (
              <QueueAction 
                key={`${item.localId}-${item.date}-${index}`} 
                item={item}
                isLastItem={index === uniqueItems.length - 1}
                isProcessing={hasProcessingItems}
              />
            ))
          ) : (
            <View className="p-4 bg-white">
              <Text className="text-sm text-grey-9">
                {title === "Active"
                  ? "No active items"
                  : title === "Completed"
                  ? "No completed items"
                  : "No items"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default QueueSection;
