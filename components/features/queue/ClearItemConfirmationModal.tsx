// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View, Image } from "react-native";

interface ClearItemConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearItemConfirmationModal = ({
  isVisible,
  onClose,
  onConfirm,
}: ClearItemConfirmationModalProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="px-4 pt-4 pb-4">
        <View className="flex-row justify-center items-center py-1">
          <Image
            source={require("@/assets/images/animals/Snail.png")}
            className="w-40 h-40"
            accessibilityRole="image"
            accessibilityLabel="Clear item confirmation illustration"
          />
        </View>
        <Text className="text-3xl font-dm-bold text-enaleia-black tracking-tighter mb-3 text-center">
          Clear Item?
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight text-center">
          Make sure the item has completed or you have rescued the data before clearing the item. This action cannot be undone.
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
            onPress={onConfirm}
            className="px-5 py-4 rounded-full bg-red-500 flex-1"
          >
            <Text className="text-base font-dm-medium text-white text-center">
              Clear
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
}; 