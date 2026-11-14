// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueueItem, QueueItemStatus } from "@/types/queue";
import {
  getActiveQueueCacheKey,
  getCompletedQueueCacheKey,
} from "@/utils/storage";

interface CompletedQueueItem extends QueueItem {
  completedAt: string; // ISO string
}

const RESCUED_ITEMS_KEY = 'RESCUED_ITEMS';

export async function clearOldCache(): Promise<void> {
  const oldKey = process.env.EXPO_PUBLIC_QUEUE_CACHE_KEY;
  if (oldKey) {
    await AsyncStorage.removeItem(oldKey);
  }
}

export async function getActiveQueue(): Promise<QueueItem[]> {
  try {
    const queueData = await AsyncStorage.getItem(getActiveQueueCacheKey());
    if (!queueData) {
      return [];
    }
    const parsedData = JSON.parse(queueData);
    // Ensure we have a valid array of queue items
    if (!Array.isArray(parsedData)) {
      console.warn('Invalid queue data format, resetting to empty array');
      await AsyncStorage.setItem(getActiveQueueCacheKey(), JSON.stringify([]));
      return [];
    }
    // Filter out any invalid items
    return parsedData.filter((item): item is QueueItem => 
      item && 
      typeof item === 'object' && 
      typeof item.localId === 'string' &&
      typeof item.status === 'string'
    );
  } catch (error) {
    console.error('Error getting active queue:', error);
    return [];
  }
}

export async function getCompletedQueue(): Promise<QueueItem[]> {
  try {
    const queueData = await AsyncStorage.getItem(getCompletedQueueCacheKey());
    if (!queueData) {
      return [];
    }
    const parsedData = JSON.parse(queueData);
    // Ensure we have a valid array of queue items
    if (!Array.isArray(parsedData)) {
      console.warn('Invalid completed queue data format, resetting to empty array');
      await AsyncStorage.setItem(getCompletedQueueCacheKey(), JSON.stringify([]));
      return [];
    }
    // Filter out any invalid items and sort by date in descending order
    return parsedData
      .filter((item): item is QueueItem => 
        item && 
        typeof item === 'object' && 
        typeof item.localId === 'string' &&
        typeof item.status === 'string'
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting completed queue:', error);
    return [];
  }
}

export async function updateActiveQueue(items: QueueItem[]): Promise<void> {
  const key = getActiveQueueCacheKey();
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function addToCompletedQueue(item: QueueItem): Promise<void> {
  const key = getCompletedQueueCacheKey();
  const completed = await getCompletedQueue();
  const completedItem: CompletedQueueItem = {
    ...item,
    completedAt: new Date().toISOString(),
  };

  completed.push(completedItem);
  await AsyncStorage.setItem(key, JSON.stringify(completed));
}

export async function removeFromActiveQueue(localId: string): Promise<void> {
  const active = await getActiveQueue();
  const filtered = active.filter((item) => item.localId !== localId);
  await updateActiveQueue(filtered);
}

export async function removeFromAllQueues(localId: string): Promise<void> {
  // Remove from active queue
  const active = await getActiveQueue();
  const filteredActive = active.filter((item) => item.localId !== localId);
  await updateActiveQueue(filteredActive);

  // Remove from completed queue
  const completed = await getCompletedQueue();
  const filteredCompleted = completed.filter((item) => item.localId !== localId);
  await AsyncStorage.setItem(getCompletedQueueCacheKey(), JSON.stringify(filteredCompleted));
}

export async function markItemAsRescued(localId: string): Promise<void> {
  try {
    const rescuedItems = await getRescuedItems();
    if (!rescuedItems.includes(localId)) {
      rescuedItems.push(localId);
      await AsyncStorage.setItem(RESCUED_ITEMS_KEY, JSON.stringify(rescuedItems));
    }
  } catch (error) {
    console.error('Error marking item as rescued:', error);
  }
}

export async function getRescuedItems(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(RESCUED_ITEMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting rescued items:', error);
    return [];
  }
}

export async function removeFromRescuedItems(localId: string): Promise<void> {
  try {
    const rescuedItems = await getRescuedItems();
    const updatedItems = rescuedItems.filter(id => id !== localId);
    await AsyncStorage.setItem(RESCUED_ITEMS_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error('Error removing from rescued items:', error);
  }
}

export type { CompletedQueueItem };
