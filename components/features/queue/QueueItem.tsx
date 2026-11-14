// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React, { TouchableOpacity, Text, View } from 'react';
import { styles } from './styles';
import { QueueItemStatus } from './types';

const QueueItem = ({ item, retryItem, isDevMode, deleteItem }) => {
  return (
    <View>
      {/* Retry Button - Always visible for failed items */}
      {item.status === QueueItemStatus.FAILED && (
        <TouchableOpacity
          onPress={() => retryItem(item.localId)}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}

      {/* Dev Mode Controls */}
      {isDevMode && (
        <View style={styles.devControls}>
          <TouchableOpacity
            onPress={() => retryItem(item.localId)}
            style={styles.devButton}
          >
            <Text style={styles.devButtonText}>Retry (Dev)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteItem(item.localId)}
            style={[styles.devButton, styles.deleteButton]}
          >
            <Text style={styles.devButtonText}>Delete (Dev)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default QueueItem; 