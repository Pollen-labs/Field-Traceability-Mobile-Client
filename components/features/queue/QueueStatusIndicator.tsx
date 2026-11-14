// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { QueueItem } from "@/types/queue";
import { QueueItemStatus, MAX_RETRIES } from "@/types/queue";
import { Text } from "react-native";

interface QueueStatusIndicatorProps {
  status: QueueItemStatus;
  item?: any; // Add item prop to check if completely failed
  className?: string;
}

export default function QueueStatusIndicator({ status, item, className = "" }: QueueStatusIndicatorProps) {
  const getStatusConfig = () => {
    // If item has exceeded max retries, always show as failed
    if (item && item.totalRetryCount >= MAX_RETRIES) {
      return {
        icon: "alert-circle",
        color: "#ef4444",
        text: "Failed",
      };
    }

    switch (status) {
      case QueueItemStatus.PENDING:
        return {
          icon: "time",
          color: "#2985D0",
          text: "Pending",
        };
      case QueueItemStatus.PROCESSING:
        return {
          icon: "sync-outline",
          color: "#3b82f6",
          text: "Processing",
        };
      case QueueItemStatus.FAILED:
        return {
          icon: "alert-circle",
          color: "#ef4444",
          text: "Retry",
        };
      case QueueItemStatus.COMPLETED:
        return {
          icon: "checkmark-circle",
          color: "#059669",
          text: "Completed",
        };
      default:
        return {
          icon: "help-circle",
          color: "#6b7280",
          text: "Unknown",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View className={`flex-row items-center gap-1 ${className}`}>
      <Text className="text-sm font-dm-regular text-grey-8">
        {config.text}
      </Text>
      {status === QueueItemStatus.PROCESSING ? (
        <ActivityIndicator size="small" color="#2985D0" />
      ) : (
        <Ionicons 
          name={config.icon as any} 
          size={28} 
          color={config.color}
        />
      )}
    </View>
  );
} 