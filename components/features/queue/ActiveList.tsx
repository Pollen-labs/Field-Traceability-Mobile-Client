// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQueue } from '@/contexts/QueueContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { QueueItem } from '@/types/queue';
import { QueueItemCard } from '../QueueItemCard';

export const ActiveList: React.FC = () => {
  const { queueItems, isProcessing } = useQueue();
  const network = useNetwork();
  const isOnline = network.isConnected && network.isInternetReachable;

  // Filter active items (not deleted)
  const activeItems = queueItems.filter(item => !item.deleted);

  if (!isOnline) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>You are currently offline. Queue processing will resume when you're back online.</Text>
      </View>
    );
  }

  if (!activeItems.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No items in queue</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isProcessing && (
        <Text style={styles.processingMessage}>Processing queue items...</Text>
      )}
      {activeItems.map((item: QueueItem) => (
        <QueueItemCard key={item.localId} item={item} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  processingMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
}); 