// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { useBatchData } from "@/hooks/data/useBatchData";
import { EAS_CONSTANTS } from "@/services/eas";
import { Action } from "@/types/action";
import { QueueItem, QueueItemStatus, ServiceStatus, PROCESSING_TIMEOUT, LIST_RETRY_INTERVAL, MAX_RETRIES } from "@/types/queue";
import { isProcessingItem } from "@/utils/queue";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";
import QueueStatusIndicator from "./QueueStatusIndicator";
import { useEffect, useState } from "react";
import { useDevMode } from "@/contexts/DevModeContext";

interface QueueActionProps {
  item: QueueItem;
  isLastItem?: boolean;
  isProcessing?: boolean;
}

const QueueAction = ({ item, isLastItem = false, isProcessing = false }: QueueActionProps) => {
  const { actions } = useBatchData();
  const { showTimers } = useDevMode();
  const action = actions?.find((a: Action) => a.id === item.actionId);
  const timestamp = item.date;
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
  }).format(new Date(timestamp))
    .replace(/(\d+)(?=(,))/, (match) => {
      const num = parseInt(match);
      const suffix = ["th", "st", "nd", "rd"][(num % 10 > 3 || num % 100 - num % 10 == 10) ? 0 : num % 10];
      return num + suffix;
    });

  // Progress bar state
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (item.status === QueueItemStatus.PROCESSING && item.lastAttempt) {
      const startTime = new Date(item.lastAttempt).getTime();
      const updateProgress = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const newProgress = Math.min((elapsed / PROCESSING_TIMEOUT) * 100, 100);
        setProgress(newProgress);

        // Calculate time remaining
        const remaining = PROCESSING_TIMEOUT - elapsed;
        if (remaining > 0) {
          const seconds = Math.floor(remaining / 1000);
          setTimeRemaining(`${seconds}s`);
        } else {
          setTimeRemaining('0s');
        }
      };

      // Update immediately and then every second
      updateProgress();
      intervalId = setInterval(updateProgress, 1);
    } else if (item.status === QueueItemStatus.COMPLETED) {
      setProgress(100);
      setTimeRemaining('');
    } else {
      setProgress(0);
      setTimeRemaining('');
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [item.status, item.lastAttempt]);

  // const styles = StyleSheet.create({
  //   retryInfo: {
  //     marginTop: 8,
  //   },
  //   retryText: {
  //     fontSize: 12,
  //     color: "#666",
  //     marginBottom: 4,
  //   },
  //   progressContainer: {
  //     flexDirection: 'row',
  //     alignItems: 'center',
  //     gap: 8,
  //     marginTop: 4,
  //   },
  //   progressBar: {
  //     flex: 1,
  //     height: 4,
  //     backgroundColor: "#EEEAE7", // sand beige color
  //     borderRadius: 2,
  //     overflow: 'hidden',
  //   },
  //   progressFill: {
  //     height: '100%',
  //     backgroundColor: '#007AFF',
  //   },
  //   timerText: {
  //     fontSize: 12,
  //     color: '#666',
  //     minWidth: 40,
  //     textAlign: 'right',
  //   },
  // });

  if (!action) return null;

  return (
    <Pressable
      onPress={() => {
        console.log("Navigating to queue detail with id:", item.localId);
        router.push(`/queue/${item.localId}`);
      }}
      className={`relative ${!isLastItem ? 'border-b border-grey-3' : ''}`}
    >
      <View className="w-full bg-white">
        <View className="p-5 flex-col gap-0.5">
          {/* Title and Status Container */}
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-dm-bold text-enaleia-black" numberOfLines={1}>
              {action.name}
            </Text>
            <QueueStatusIndicator status={item.status} item={item} />
          </View>

          {/* Date and Retry Counter Container */}
          <View className="flex-row justify-between items-center pb-2">
            <Text className="text-sm font-dm-medium text-grey-8">
              {formattedTime}
            </Text>
            {showTimers && (
              <Text className="text-xs font-dm-medium text-grey-6">
                {item.totalRetryCount || 0}/{MAX_RETRIES} Retry
              </Text>
            )}
          </View>

          {/* Service Status Section */}
          <View className="flex-col">
            <View className="flex flex-row items-left">
              <ServiceStatusIndicator
                status={item.directus?.status || ServiceStatus.INCOMPLETE}
                type="directus"    
                extraClasses="mr-2"           
              />
              <ServiceStatusIndicator
                status={item.eas?.status || ServiceStatus.INCOMPLETE}
                type="eas"
                extraClasses="mr-2" 
              />
              <ServiceStatusIndicator
                status={item.linking?.status || ServiceStatus.INCOMPLETE}
                type="linking"
              />
            </View>

            {/* Progress bar and timer */}
            {item.status === QueueItemStatus.PROCESSING && (
              <View className="flex-row items-center gap-2 mt-1">
                <View className="flex-1 h-2 bg-sand-beige rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-ocean"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </View>
                {/* Only show processing time in dev mode */}
                {showTimers && (
                  <Text className="text-sm font-dm-medium text-gray-500">
                    {timeRemaining}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default QueueAction;
