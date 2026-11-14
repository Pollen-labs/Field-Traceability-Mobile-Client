// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MAX_RETRIES, QueueItem, QueueItemStatus, ServiceStatus, getOverallStatus, shouldProcessItem, determineItemStatus } from "@/types/queue";
import { processQueueItems as processQueueItemsService } from "@/services/queueProcessor";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { useNetwork } from "./NetworkContext";
import { AppState } from "react-native";
import * as SecureStore from "expo-secure-store";
import { directus } from "@/utils/directus";
import {
  getActiveQueue,
  getCompletedQueue,
  updateActiveQueue,
  addToCompletedQueue,
  removeFromActiveQueue,
  CompletedQueueItem,
} from "@/utils/queueStorage";
import { useWallet } from "@/contexts/WalletContext";
import { getBatchData } from "@/utils/batchStorage";
import { getEvent } from "@/services/directus";
import NetInfo from "@react-native-community/netinfo";
import { updateItemInCache } from "@/services/queueProcessor";
import { QueueDebugMonitor } from "@/services/queueDebugMonitor";

const queueDebugMonitor = QueueDebugMonitor.getInstance();

export interface QueueContextType {
  queueItems: QueueItem[];
  completedCount: number;
  loadQueueItems: () => Promise<void>;
  updateQueueItem: (itemId: string, updates: Partial<QueueItem>) => Promise<void>;
  updateQueueItems: (items: QueueItem[]) => Promise<void>;
  retryItem: (itemId: string) => Promise<void>;
  retryItems: (items: QueueItem[]) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  processQueueItems: (items?: QueueItem[]) => Promise<void>;
  isProcessing: boolean;
  refreshQueueStatus: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | null>(null);

const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const COMPLETED_COUNT_KEY = "@queue/completed_count";

interface RetryResult {
  success: boolean;
  localId: string;
  error?: string;
}

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const network = useNetwork();
  const isOnline = network.isConnected && network.isInternetReachable;
  const { wallet } = useWallet();
  const isProcessingRef = useRef<boolean>(false);

  // Load queue items
  const loadQueueItems = useCallback(async () => {
    try {
      const [active, completed] = await Promise.all([
        getActiveQueue(),
        getCompletedQueue()
      ]);

      // Ensure unique items by localId
      const uniqueActive = active.reduce((acc, item) => {
        if (!acc.find(i => i.localId === item.localId)) {
          acc.push(item);
        }
        return acc;
      }, [] as QueueItem[]);

      setQueueItems(uniqueActive);
      setCompletedCount(completed.length);
    } catch (error) {
      console.error("Error loading queue items:", error);
    }
  }, []);

  // Process queue items
  const processQueueItems = useCallback(async (itemsToTrigger?: QueueItem[]) => {
    // Check if offline or already processing using a ref
    if (!isOnline || isProcessingRef.current) {
      return;
    }

    let processedItemIds = new Set<string>(); // Keep track of processed item IDs

    try {
      isProcessingRef.current = true;
      setIsProcessing(true); // Update state for UI

      // Determine items to process: either the triggered subset or all pending/failed
      const allActiveItems = await getActiveQueue(); 
      const itemsToConsider = itemsToTrigger || allActiveItems;
      
      // Filter for items that actually need processing (Pending/Failed & not max retries)
      const itemsNeedingProcessing = itemsToConsider.filter(item => 
        (item.status === QueueItemStatus.PENDING || item.status === QueueItemStatus.FAILED) &&
        item.totalRetryCount < MAX_RETRIES &&
        !item.deleted
      );

      if (!itemsNeedingProcessing.length) {
        return; // Exit early if nothing to do
      }
      
      // Store the IDs of the items being processed in this batch
      processedItemIds = new Set(itemsNeedingProcessing.map(item => item.localId));

      // Call the main service function ONCE with the filtered list
      await processQueueItemsService(itemsNeedingProcessing, wallet);
      
      // Reload queue items once after the entire batch finishes (might be slightly early)
      await loadQueueItems(); 

    } catch (error) {
      // Log errors using console as a fallback
      console.error("[QueueContext] Error during batch processing trigger:", error); 
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false); // Update state for UI

      // Check if new items were added during processing
      const currentActiveQueue = await getActiveQueue();
      const newlyEligibleItems = currentActiveQueue.filter(item => 
        (item.status === QueueItemStatus.PENDING || item.status === QueueItemStatus.FAILED) &&
        item.totalRetryCount < MAX_RETRIES &&
        !item.deleted &&
        !processedItemIds.has(item.localId) // Check if it wasn't in the processed batch
      );

      if (newlyEligibleItems.length > 0) {
        console.log(`[QueueContext] ${newlyEligibleItems.length} new eligible item(s) detected after batch, re-triggering processing.`);
        // Use setTimeout to avoid potential deep recursion / stack issues
        // and allow the current function context to fully unwind.
        setTimeout(() => processQueueItems(), 0); 
      }
    }
  }, [isOnline, wallet, loadQueueItems]);

  // Initialize queue state
  const initializeQueue = useCallback(async () => {
    try {
      queueDebugMonitor.logQueueMetrics([]);  // Initialize metrics
      queueDebugMonitor.logNetworkStatus(
        network.isConnected ?? false,
        network.isInternetReachable ?? false
      );
      
      const activeQueue = await getActiveQueue();
      
      // Check for any items in PROCESSING state at launch
      const processingItems = activeQueue.filter(item => item.status === QueueItemStatus.PROCESSING);
      
      if (processingItems.length > 0) {
        queueDebugMonitor.logQueueMetrics(processingItems);
        
        for (const item of processingItems) {
          const allServicesCompleted = 
            item.directus?.status === ServiceStatus.COMPLETED &&
            item.eas?.status === ServiceStatus.COMPLETED &&
            item.linking?.status === ServiceStatus.COMPLETED;

          if (allServicesCompleted) {
            queueDebugMonitor.logProcessingComplete(item, true);
            // First update the item's status to COMPLETED
            await updateItemInCache(item.localId, {
              status: QueueItemStatus.COMPLETED
            });
            // Then move it to completed queue
            await addToCompletedQueue(item);
            await removeFromActiveQueue(item.localId);
          } else {
            queueDebugMonitor.logStuckItem(item);
            await updateItemInCache(item.localId, {
              status: QueueItemStatus.PENDING,
              lastError: "Reset at launch - incomplete services",
              lastAttempt: undefined,
              // Reset service states while preserving completed ones
              directus: item.directus?.status === ServiceStatus.COMPLETED ? 
                item.directus : 
                { ...item.directus, status: ServiceStatus.INCOMPLETE, error: undefined },
              eas: item.eas?.status === ServiceStatus.COMPLETED ? 
                item.eas : 
                { ...item.eas, status: ServiceStatus.INCOMPLETE, error: undefined },
              linking: item.linking?.status === ServiceStatus.COMPLETED ? 
                item.linking : 
                { ...item.linking, status: ServiceStatus.INCOMPLETE, error: undefined }
            });
            queueDebugMonitor.logItemStateChange(item, { status: QueueItemStatus.PENDING });
          }
        }
      }

      // Load the queue after initialization
      await loadQueueItems();
      setIsInitialized(true);
      queueDebugMonitor.logQueueMetrics(await getActiveQueue());

      // Process pending items if online
      if (isOnline) {
        const pendingItems = activeQueue.filter(item => 
          item.status === QueueItemStatus.PENDING || 
          item.status === QueueItemStatus.FAILED
        );
        
        if (pendingItems.length > 0) {
          queueDebugMonitor.logQueueMetrics(pendingItems);
          await processQueueItems(pendingItems);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        queueDebugMonitor.logProcessingComplete({ localId: 'init' } as QueueItem, false, error.message);
      }
      // Still mark as initialized to prevent infinite retries
      setIsInitialized(true);
    }
  }, [loadQueueItems, isOnline, network.isInternetReachable, processQueueItems]);

  // Run initialization at app launch
  useEffect(() => {
    if (!isInitialized) {
      initializeQueue();
    }
  }, [initializeQueue, isInitialized]);

  // Update queue item
  const updateQueueItem = useCallback(async (itemId: string, updates: Partial<QueueItem>) => {
    try {
      await updateItemInCache(itemId, updates);
      // Force a queue refresh to update UI
      queueEventEmitter.emit(QueueEvents.UPDATED);
      await loadQueueItems();
          } catch (error) {
      console.error("Error updating queue item:", error);
    }
  }, [loadQueueItems]);

  // Add batch update function
  const updateQueueItems = useCallback(async (items: QueueItem[]) => {
    if (!items.length) return;

    try {
      // Get existing items
      const existingItems = await getActiveQueue();
      
      // Update or add each item
      for (const item of items) {
        const existingItem = existingItems.find(i => i.localId === item.localId);
        if (existingItem) {
          // Update existing item
          await updateQueueItem(item.localId, item);
        } else {
          // Add new item to the beginning of the queue (most recent first)
          const updatedItems = [item, ...existingItems];
          // Sort by date, most recent first
          updatedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          await updateActiveQueue(updatedItems);
        }
      }

      // Reload queue items to get updated state
      await loadQueueItems();

      // Emit UPDATED event after potentially adding new items
      queueEventEmitter.emit(QueueEvents.UPDATED);

      // REMOVED: Explicit trigger after adding items - rely on event listener instead
      // if (isOnline && !isProcessing) {
      //   await processQueueItems(items);
      // }
    } catch (error) {
      console.error("Error updating queue items:", error);
      throw error;
    }
  }, [isOnline, updateQueueItem, loadQueueItems, processQueueItems]);

  // Retry item
  const retryItem = useCallback(async (itemId: string) => {
    const item = queueItems.find(i => i.localId === itemId);
    if (!item) return;

    try {
      await updateQueueItem(itemId, {
            status: QueueItemStatus.PENDING,
            lastError: undefined,
            lastAttempt: undefined,
        // Only reset incomplete services
        directus: item.directus?.status === ServiceStatus.INCOMPLETE ? {
          ...item.directus,
          error: undefined
        } : item.directus,
        eas: item.eas?.status === ServiceStatus.INCOMPLETE ? {
          ...item.eas,
          error: undefined
        } : item.eas,
        linking: item.linking?.status === ServiceStatus.INCOMPLETE ? {
          ...item.linking,
          error: undefined
        } : item.linking
      });
        } catch (error) {
      console.error("Error retrying item:", error);
    }
  }, [queueItems, updateQueueItem]);

  // Delete item
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      await updateQueueItem(itemId, { deleted: true });
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }, [updateQueueItem]);

  // Listen for queue updates
  useEffect(() => {
    const handleQueueUpdate = async () => {
      if (isInitialized) {
        await loadQueueItems();
        // If the queue is idle after an update, check if processing is needed
        if (isOnline && !isProcessingRef.current) {
          // Use setTimeout to avoid potential race conditions / deep calls
          setTimeout(() => processQueueItems(), 0);
        }
      }
    };

    queueEventEmitter.addListener(QueueEvents.UPDATED, handleQueueUpdate);
    return () => {
      queueEventEmitter.removeListener(QueueEvents.UPDATED, handleQueueUpdate);
    };
  }, [loadQueueItems, isInitialized, isOnline, processQueueItems]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // When app becomes active, refresh network state and queue
        try {
          const netInfo = await NetInfo.fetch();
          if (netInfo.isConnected && netInfo.isInternetReachable) {
            await loadQueueItems();
            // Process any pending items
            const activeQueue = await getActiveQueue();
            const pendingItems = activeQueue.filter(item => 
              item.status === QueueItemStatus.PENDING || 
              item.status === QueueItemStatus.FAILED
            );
            if (pendingItems.length > 0) {
              await processQueueItems(pendingItems);
            }
          }
        } catch (error) {
          console.error('Error handling app state change:', error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadQueueItems, processQueueItems]);

  // Add network state change listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && state.isInternetReachable) {
        // Network is back online, process pending items
        try {
          const activeQueue = await getActiveQueue();
          const pendingItems = activeQueue.filter(item => 
            item.status === QueueItemStatus.PENDING || 
            item.status === QueueItemStatus.FAILED
          );
          if (pendingItems.length > 0) {
            await processQueueItems(pendingItems);
          }
        } catch (error) {
          console.error('Error handling network state change:', error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [processQueueItems]);

  // Initial load
  useEffect(() => {
    if (isInitialized) {
      loadQueueItems();
    }
  }, [loadQueueItems, isInitialized]);

  // Retry multiple items
  const retryItems = useCallback(async (items: QueueItem[]) => {
    try {
      // Process the items directly without resetting their status
      await processQueueItems(items);
    } catch (error) {
      console.error("Error retrying items:", error);
    }
  }, [processQueueItems]);

  // Refresh queue status
  const refreshQueueStatus = useCallback(async () => {
    try {
      await loadQueueItems();
    } catch (error) {
      console.error("Error refreshing queue status:", error);
    }
  }, [loadQueueItems]);

  const value = useMemo(() => ({
    queueItems,
    completedCount,
    loadQueueItems,
    updateQueueItem,
    updateQueueItems,
    retryItem,
    retryItems,
    deleteItem,
    processQueueItems,
    isProcessing,
    refreshQueueStatus
  }), [queueItems, completedCount, loadQueueItems, updateQueueItem, updateQueueItems, retryItem, retryItems, deleteItem, processQueueItems, isProcessing, refreshQueueStatus]);

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
};
