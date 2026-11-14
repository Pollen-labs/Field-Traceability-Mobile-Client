// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View, Image } from "react-native";

interface IncompleteAttestationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmitAnyway: () => void;
}

export const IncompleteAttestationModal = ({
  isVisible,
  onClose,
  onSubmitAnyway,
}: IncompleteAttestationModalProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="px-4 pt-4 pb-4">
        <View className="flex-row justify-center items-center py-1">
        <Image
          source={require("@/assets/images/animals/Snail.png")}
          className="w-40 h-40"
          accessibilityRole="image"
          accessibilityLabel="Empty fields illustration"
        />
        </View>
        <Text className="text-3xl font-dm-bold text-enaleia-black tracking-tighter mb-3 text-center">
           Missing details?
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight text-center">
          Some fields are empty & might be required. If needed, fill them before proceeding.
        </Text>
        <Text className="text-sm font-dm-regular text-enaleia-black italic mb-6 text-center">
          <Text className="font-dm-bold">Important:</Text> Attestations cannot be modified once submitted.
        </Text>
        <View className="flex-row items-center gap-2 justify-center">
          <Pressable
            onPress={onClose}
            className="px-2 py-4 rounded-full border border-grey-3 flex-1"
          >
            <Text className="text-base font-dm-medium text-enaleia-black text-center">
              Review
            </Text>
          </Pressable>
          <Pressable
            onPress={onSubmitAnyway}
            className="px-5 py-4 rounded-full bg-blue-ocean flex-1"
          >
            <Text className="text-base font-dm-medium text-white text-center">
              Proceed
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
};
