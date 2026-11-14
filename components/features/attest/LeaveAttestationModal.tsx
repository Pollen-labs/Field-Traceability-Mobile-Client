// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View, Image } from "react-native";

interface LeaveAttestationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirmLeave: () => void;
}

export const LeaveAttestationModal = ({
  isVisible,
  onClose,
  onConfirmLeave,
}: LeaveAttestationModalProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="px-4 pt-3 pb-4">
      <View className="flex-row justify-center items-center py-1">
        <Image
          source={require("@/assets/images/animals/FishFin.png")}
          className="w-40 h-40"
          accessibilityRole="image"
          accessibilityLabel="leave form illustration"
        />
        </View>
        <Text
          className="text-3xl font-dm-bold text-enaleia-black tracking-[-0.5px] mb-3 text-center"
          accessibilityRole="header"
        >
          Leaving?
        </Text>
        <Text
          className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight text-center"
          accessibilityRole="text"
        >
          You have unsaved changes. Leaving this page will discard all the information you’ve entered so far.
        </Text>
        <View className="flex-row items-center gap-2">     
          <Pressable
            onPress={onConfirmLeave}
            className="px-4 py-3 rounded-full border-[1.5px] border-grey-3 bg-white flex-1"
            accessibilityRole="button"
            accessibilityLabel="Leave without saving"
            accessibilityHint="Double tap to discard changes and leave"
          >
            <Text className="text-base font-dm-medium text-enaleia-black text-center">Leave</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            className="px-4 py-3 rounded-full bg-blue-ocean flex-1"
            accessibilityRole="button"
            accessibilityLabel="Keep editing"
            accessibilityHint="Double tap to continue editing"
          >
            <Text className="text-base font-dm-medium text-white text-center">
              Keep editing
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
};
