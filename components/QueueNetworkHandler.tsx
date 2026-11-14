// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useWallet } from "@/contexts/WalletContext";
import { useQueue } from "@/contexts/QueueContext";
import { getActiveQueue } from "@/utils/queueStorage";
import { QueueItemStatus } from "@/types/queue";

export const QueueNetworkHandler = () => {
  const { wallet } = useWallet();
  const { loadQueueItems, processQueueItems } = useQueue();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const isOnline = !!state.isConnected && !!state.isInternetReachable;

      if (isOnline) {
        try {
          // Load queue items first
          await loadQueueItems();
          
          // Then check for pending items to process
          const activeQueue = await getActiveQueue();
          const pendingItems = activeQueue.filter(item => 
            item.status === QueueItemStatus.PENDING || 
            item.status === QueueItemStatus.FAILED
          );
          
          if (pendingItems.length > 0) {
            await processQueueItems(pendingItems);
          }
        } catch (error) {
          console.error("Failed to handle network state change:", error);
        }
      }
    });

    // Initial network state check
    NetInfo.fetch().then(async (state) => {
      const isOnline = !!state.isConnected && !!state.isInternetReachable;
      if (isOnline) {
        try {
          await loadQueueItems();
        } catch (error) {
          console.error("Failed to perform initial network state check:", error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [wallet, loadQueueItems, processQueueItems]);

  return null;
}; 