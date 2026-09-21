import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  locationService,
  SavedLocation,
  LocationData,
} from "@/services/locationService";
import { Modal } from "@/components/shared/Modal";
import { useEffect, useState } from "react";

interface SavedLocationsSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  currentLocationId?: string;
}

export function SavedLocationsSelector({
  isVisible,
  onClose,
  onSelect,
  currentLocationId,
}: SavedLocationsSelectorProps) {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true);
      try {
        const locations = await locationService.getSavedLocations();
        setSavedLocations(locations);
      } catch (error) {
        console.error("Failed to load saved locations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isVisible) {
      loadLocations();
    }
  }, [isVisible]);

  const handleSelect = async (saved: SavedLocation) => {
    if (saved.id === currentLocationId) {
      Alert.alert(
        "Already Selected",
        "This location is already selected for this event.",
        [{ text: "OK", onPress: onClose }]
      );
      return;
    }

    const location: LocationData = {
      coords: saved.coords,
      timestamp: Date.now(),
      savedLocationId: saved.id,
    };

    onSelect(location);
    onClose();
  };

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <View className="flex-1 bg-white rounded-t-[32px] overflow-hidden">
        <View style={{
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 3,
          backgroundColor: '#DDDDDD',
          marginTop: 16,
          marginBottom: 4,
        }} />

        <View className="px-5 pt-2 pb-2 flex-row justify-center items-center">
          <Text className="text-3xl font-dm-bold text-enaleia-black text-center w-full">
            Saved Locations
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View className="flex-1 justify-center items-center py-8">
              <ActivityIndicator size="large" color="#0D0D0D" />
            </View>
          ) : savedLocations.length === 0 ? (
            <View className="flex-1 justify-center items-center py-8">
              <Text className="text-center text-grey-6 font-dm-regular">
                No saved locations found
              </Text>
            </View>
          ) : (
            savedLocations.map((location) => (
              <Pressable
                key={location.id}
                onPress={() => handleSelect(location)}
                className="bg-white w-full px-4 py-3 rounded-2xl flex flex-row items-center justify-between border-[1.5px] border-grey-3 mb-2"
                accessibilityRole="menuitem"
                accessibilityLabel={location.name}
                accessibilityState={{ selected: location.id === currentLocationId }}
              >
                <View className="flex-1 flex-row items-center">
                  <Ionicons name="location-outline" size={20} color="#0D0D0D" />
                  <View className="ml-3">
                    <Text className="text-base font-dm-bold text-enaleia-black tracking-tighter">
                      {location.name}
                    </Text>
                    <Text className="text-sm font-dm-regular text-grey-6 tracking-tighter">
                      {location.coords.latitude.toFixed(6)},{" "}
                      {location.coords.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
                {location.id === currentLocationId && (
                  <Ionicons name="checkmark-circle" size={20} color="#0D0D0D" />
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}