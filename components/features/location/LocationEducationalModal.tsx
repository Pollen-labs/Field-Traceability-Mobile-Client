// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { View, Text, Pressable } from "react-native";
import ModalBase from "@/components/shared/ModalBase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PermissionStatus } from "expo-modules-core";

const LOCATION_INTRO_KEY = "@location_intro_seen";
const LOCATION_SKIP_KEY = "@location_skip_state";

const LOCATION_POINTS = [
  // {
  //   icon: "bookmark",
  //   title: "Save Frequent Locations",
  //   description:
  //     "Quickly select from your saved locations for faster event creation",
  // },
  // {
  //   icon: "battery-charging",
  //   title: "Battery Friendly",
  //   description:
  //     "We only use location when needed and optimize for battery life",
  // },
  // {
  //   icon: "shield-checkmark",
  //   title: "Privacy First",
  //   description:
  //     "Your location data is only used for event verification and is never shared",
  // },
];

interface LocationEducationalModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRequestLocation: () => void;
  onSkip: () => void;
  permissionStatus: PermissionStatus | null;
}

export function LocationEducationalModal({
  isVisible,
  onClose,
  onRequestLocation,
  onSkip,
  permissionStatus,
}: LocationEducationalModalProps) {
  const handleEnableLocation = async () => {
    await AsyncStorage.setItem(LOCATION_INTRO_KEY, "true");
    await AsyncStorage.removeItem(LOCATION_SKIP_KEY);
    onRequestLocation();
    onClose();
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(LOCATION_SKIP_KEY, "true");
    onSkip();
    onClose();
  };

  return (
    <ModalBase isVisible={isVisible} onClose={onClose} canClose={false}>
      <View className="p-4 space-y-6">
        <View className="items-center">
          <View className="bg-blue-ocean rounded-full p-4 mb-4">
            <Ionicons name="location" size={36} color="#F6F4F2" />
          </View>
          <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1.5px] text-center mb-4 mt-4">
            Add location to your attestations
          </Text>
          <Text className="text-base font-dm-regular text-gray-600 text-center">
            When adding location to your attestations, you help the community
            understand where the actions took place for a greater environmental
            transparency and trust.
          </Text>
        </View>

        {/* <View className="space-y-4">
          {LOCATION_POINTS.map((point) => (
            <View className="flex-row items-start space-x-3" key={point.title}>
              <View className="bg-green-50 rounded-full p-2 mt-1">
                <Ionicons name={point.icon as any} size={20} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-dm-medium text-enaleia-black mb-1">
                  {point.title}
                </Text>
                <Text className="text-sm font-dm-regular text-gray-600">
                  {point.description}
                </Text>
              </View>
            </View>
          ))}
        </View> */}

        <View className="space-y-4 pt-2">
          <Pressable
            onPress={handleEnableLocation}
            className="bg-blue-ocean p-3 rounded-full"
          >
            <Text className="text-base font-dm-bold tracking-tight text-white text-center p-1">
              Continue
            </Text>
          </Pressable>

          {/* <Pressable
            onPress={onSkip}
            className="p-2 rounded-full bg-white border border-gray-600"
          >
            <Text className="text-base font-dm-regular text-gray-600 text-center p-1">
              Skip for Now
            </Text>
          </Pressable> */}
        </View>

        <Text className="text-sm font-dm-regular text-gray-500 text-center">
          You can always change your location sharing preferences later in the
          OS settings
        </Text>
      </View>
    </ModalBase>
  );
}
