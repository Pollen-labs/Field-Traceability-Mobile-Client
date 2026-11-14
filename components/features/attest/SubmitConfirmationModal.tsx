// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import ModalBase from "@/components/shared/ModalBase";
import { Pressable, Text, View, Image, ActivityIndicator } from "react-native";

interface SubmitConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onProceed: () => void;
  isSubmitting?: boolean;
}

export const SubmitConfirmationModal = ({
  isVisible,
  onClose,
  onProceed,
  isSubmitting = false,
}: SubmitConfirmationModalProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="px-4 pt-4 pb-4">
        <View className="flex-row justify-center items-center py-1">
          <Image
            source={require("@/assets/images/animals/SeaHorse.png")}
            className="w-40 h-40"
            accessibilityRole="image"
            accessibilityLabel="ready to attest illustration"
          />
        </View>
        <Text className="text-3xl font-dm-bold text-enaleia-black tracking-tighter mb-3 text-center">
          Ready to attest?
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black mb-6 tracking-tight text-center">
          Attestations are permanent and cannot be changed once submitted. Please review all details carefully before proceeding.
        </Text>
        <View className="flex-row items-center gap-2 justify-center">
          <Pressable
            onPress={onClose}
            disabled={isSubmitting}
            className={`px-4 py-4 rounded-full border border-grey-3 flex-1 ${isSubmitting ? 'opacity-50' : ''}`}
          >
            <Text className="text-base font-dm-medium text-enaleia-black text-center">
              Review
            </Text>
          </Pressable>
          <Pressable
            onPress={onProceed}
            disabled={isSubmitting}
            className={`px-4 py-4 rounded-full bg-blue-ocean flex-1 ${isSubmitting ? 'opacity-50' : ''}`}
          >
            {isSubmitting ? (
              <View className="flex-row items-center justify-center space-x-2">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-base font-dm-medium text-white text-center">
                  Submitting...
                </Text>
              </View>
            ) : (
              <Text className="text-base font-dm-medium text-white text-center">
                Submit
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </ModalBase>
  );
}; 