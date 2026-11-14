// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { Text, View, Pressable } from "react-native";
import ModalBase from "@/components/shared/ModalBase";

interface ClearConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearConfirmationModal = ({
  isVisible,
  onClose,
  onConfirm,
}: ClearConfirmationModalProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose} closeButton={false}>
      <View className="p-4">
        <Text className="text-2xl font-dm-bold text-center text-enaleia-black mb-4">
          Clear Attestation
        </Text>
        <Text className="text-base text-center text-enaleia-black mb-6">
          Are you sure you want to clear this attestation from your device? This action cannot be undone.
        </Text>
        <View className="flex-row justify-center gap-2">
          <Pressable
            onPress={onClose}
            className="flex-1 p-3 rounded-full border border-grey-3"
          >
            <Text className="text-enaleia-black text-center font-dm-medium">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            className="flex-1 p-3 rounded-full bg-red-500"
          >
            <Text className="text-white text-center font-dm-medium">Clear</Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
}; 