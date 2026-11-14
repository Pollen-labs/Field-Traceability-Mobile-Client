// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { QueueItem, QueueItemStatus, MAX_RETRIES } from "@/types/queue";

export const isProcessingItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.PROCESSING;

export const isPendingItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.OFFLINE ||
  item.status === QueueItemStatus.PENDING ||
  (item.status === QueueItemStatus.FAILED &&
    (item.retryCount || 0) < MAX_RETRIES);

export const isFailedItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.FAILED &&
  (item.retryCount || 0) >= MAX_RETRIES;

export const isCompletedItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.COMPLETED;

export const filterQueueItems = (items: QueueItem[]) => {
  return {
    processingItems: items.filter(isProcessingItem),
    pendingItems: items.filter(isPendingItem),
    failedItems: items.filter(isFailedItem),
    completedItems: items.filter(isCompletedItem),
  };
};

// Helper to check if an item needs attention (pending or failed)
export const needsAttention = (item: QueueItem): boolean =>
  isPendingItem(item) || isFailedItem(item);

// Helper to get total count of items needing attention
export const getAttentionCount = (items: QueueItem[]): number =>
  items.filter(needsAttention).length;
