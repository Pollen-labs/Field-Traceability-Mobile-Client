// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetwork } from "@/contexts/NetworkContext";

const NetworkStatus = () => {
  const { isConnected, connectionType, isInternetReachable } = useNetwork();
  const isOnline = isConnected && isInternetReachable;

  return (
    <View className="flex-row items-center justify-center px-3 py-1 space-x-1 border-[1px] border-#222222 rounded-full w-fit max-w-[140px]">
      <Ionicons
        name={connectionType === "wifi" ? "wifi" : "cellular"}
        size={16}
        color={isOnline ? "#000000" : "#ef4444"}
      />
      <Text className="text-xs font-dm-medium text-enaleia-black">
        {isOnline ? `${connectionType} On` : "Off"}
      </Text>
    </View>
  );
};

export default NetworkStatus;
