// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { View, Text, Pressable } from "react-native";
import React from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const SettingsScreen = () => {
  return (
    <SafeAreaContent>
      <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-6">
        Settings
      </Text>

      <View className="space-y-4">
        <Pressable
          onPress={() => router.push("/settings/wallet")}
          className="bg-white rounded-2xl p-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center space-x-3">
            <Ionicons name="wallet-outline" size={24} color="#0D0D0D" />
            <Text className="text-base font-dm-medium text-enaleia-black">Wallet</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#0D0D0D" />
        </Pressable>
      </View>
    </SafeAreaContent>
  );
};

export default SettingsScreen; 