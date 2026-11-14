// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { View, Text, Pressable, TextInput, Platform } from "react-native";
import ModalBase from "@/components/shared/ModalBase";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface SaveLocationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
}

export function SaveLocationModal({
  isVisible,
  onClose,
  onSave,
  defaultName = "Current Location",
}: SaveLocationModalProps) {
  const [locationName, setLocationName] = useState(defaultName);

  useEffect(() => {
    if (isVisible) {
      setLocationName(defaultName);
    }
  }, [isVisible, defaultName]);

  const handleSave = () => {
    if (!locationName.trim()) return;
    onSave(locationName.trim());
    onClose();
  };

  return (
    <ModalBase isVisible={isVisible} onClose={onClose}>
      <View className="p-4 space-y-4 bg-white rounded-lg">
        <View className="flex-row items-center space-x-3">
          <View className="bg-blue-50 rounded-full p-2">
            <Ionicons name="bookmark" size={24} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-dm-bold text-enaleia-black mb-1">
              Save Location
            </Text>
            <Text className="text-sm font-dm-regular text-gray-600">
              Enter a name for this location
            </Text>
          </View>
        </View>

        <View className="space-y-4">
          <TextInput
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Location name"
            className={`p-3 bg-gray-50 rounded-lg text-base font-dm-regular ${
              Platform.OS === "android" ? "pb-2" : ""
            }`}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
            blurOnSubmit={false}
          />

          <View className="flex-row space-x-2">
            <Pressable
              onPress={onClose}
              className="flex-1 p-3 rounded-full border border-gray-200"
            >
              <Text className="text-base font-dm-medium text-gray-600 text-center">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!locationName.trim()}
              className={`flex-1 p-3 rounded-full ${
                !locationName.trim() ? "bg-blue-300" : "bg-blue-ocean"
              }`}
            >
              <Text className="text-base font-dm-medium text-white text-center">
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ModalBase>
  );
}
