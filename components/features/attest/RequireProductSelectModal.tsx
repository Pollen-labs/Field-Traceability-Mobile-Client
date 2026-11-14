// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View } from "react-native";

interface RequireProductSelectModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const RequireProductSelectModal = ({
                                        isVisible,
                                        onClose,
                                      }: RequireProductSelectModalProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="px-4 pt-3 pb-4">
        <Text
          className="text-3xl font-dm-bold text-enaleia-black tracking-[-0.5px] mb-3 text-center"
          accessibilityRole="header"
        >
          Product selection is required
        </Text>
        <Text
          className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight text-center"
          accessibilityRole="text"
        >
          Please select the product you are producing. If your product is not listed, please contact Enaleia.
        </Text>
        <View className="flex-row items-center">
          <Pressable
            onPress={onClose}
            className="px-4 py-3 rounded-full bg-blue-ocean flex-1"
            accessibilityRole="button"
            accessibilityLabel="Keep editing"
            accessibilityHint="Double tap to continue editing"
          >
            <Text className="text-base font-dm-medium text-white text-center">
              OK
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
};
