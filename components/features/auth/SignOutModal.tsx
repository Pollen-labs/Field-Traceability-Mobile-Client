// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React from "react";
import { View, Text, Modal, Pressable, Image } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

interface SignOutModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function SignOutModal({
  isVisible,
  onClose,
}: SignOutModalProps) {
  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-3xl w-[90%] max-w-[320px]">
          <View className="items-center mb-4">
            <Image 
              source={require("@/assets/images/animals/JellyFish.png")}
              className="w-40 h-40 mb-4"
              resizeMode="contain"
            />
            <Text className="text-3xl font-dm-bold text-center">Are you sure you want to sign out?</Text>
          </View>
          <Text className="text-base font-dm-light mb-6 text-center">
            An internet connection will be required when you sign back in.
          </Text>
          <View className="flex-row gap-2 w-full justify-center">
            <Pressable onPress={onClose} className="py-4 px-7 rounded-full bg-white border border-grey-3">
              <Text className="text-enaleia-black font-dm-medium">Never mind</Text>
            </Pressable>
            <Pressable
              onPress={handleSignOut}
              className="bg-blue-ocean py-4 px-9 rounded-full"
            >
              <Text className="text-white font-dm-medium">Sign out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
