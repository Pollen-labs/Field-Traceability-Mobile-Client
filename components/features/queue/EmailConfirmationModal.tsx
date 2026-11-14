// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View, Image } from "react-native";

interface EmailConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export const EmailConfirmationModal = ({
  isVisible,
  onClose,
  onProceed,
}: EmailConfirmationModalProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="px-4 pt-4 pb-4">
        <View className="flex-row justify-center items-center py-1">
          <Image
            source={require("@/assets/images/animals/CrabBubble.png")}
            className="w-40 h-40"
            accessibilityRole="image"
            accessibilityLabel="Important message illustration"
          />
        </View>
        <Text className="text-3xl font-dm-bold text-enaleia-black tracking-tighter mb-3 text-center">
          Important
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight text-center">
        After you’ve sent the data to Enaleia via email, return to this page and tap ‘Clear it from device’ to avoid duplicates.
        </Text>
        <View className="flex-row items-center gap-2 justify-center">
          <Pressable
            onPress={onClose}
            className="px-2 py-4 rounded-full border border-grey-3 flex-1"
          >
            <Text className="text-base font-dm-medium text-enaleia-black text-center">
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={onProceed}
            className="px-5 py-4 rounded-full bg-blue-ocean flex-1"
          >
            <Text className="text-base font-dm-medium text-white text-center">
              Create Email
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
}; 