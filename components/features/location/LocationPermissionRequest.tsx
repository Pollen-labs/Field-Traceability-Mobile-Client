// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationEducationalModal } from "./LocationEducationalModal";
import { SavedLocationsSelector } from "./SavedLocationsSelector";
import { SaveLocationModal } from "./SaveLocationModal";
import { locationService, LocationData } from "@/services/locationService";
import * as Location from "expo-location";

const LOCATION_INTRO_KEY = "@location_intro_seen";

interface LocationPermissionRequestProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  onLocationSelected?: (location: LocationData) => void;
  currentLocation?: LocationData;
}

export function LocationPermissionRequest({
  onPermissionGranted,
  onPermissionDenied,
  onLocationSelected,
  currentLocation,
}: LocationPermissionRequestProps) {
  const {
    permissionStatus,
    requestPermission,
    data: currentLocationData,
  } = useCurrentLocation();
  const [isRequesting, setIsRequesting] = useState(false);
  const [showEducationalModal, setShowEducationalModal] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  const [showSaveLocationModal, setShowSaveLocationModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    const hasSeenIntro = await AsyncStorage.getItem(LOCATION_INTRO_KEY);
    if (!hasSeenIntro && permissionStatus !== "granted") {
      setShowEducationalModal(true);
    }
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      // First check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings to use this feature.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setIsRequesting(false),
            },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }

      const { status, isNew } = await requestPermission();
      console.log("Permission request result:", { status, isNew });

      if (status === "granted") {
        onPermissionGranted?.();
      } else if (isNew && status === "denied") {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      onPermissionDenied?.();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSaveCurrentLocation = async () => {
    if (!currentLocationData) return;

    setIsSaving(true);
    try {
      // Check for nearby locations first
      const savedLocations = await locationService.getSavedLocations();
      const nearbyLocation = savedLocations.find((saved) => {
        const distance = locationService.calculateDistance(
          saved.coords,
          currentLocationData.coords
        );
        return distance < 0.1; // Within 100 meters
      });

      if (nearbyLocation) {
        Alert.alert(
          "Location Already Saved",
          `You already have a saved location "${nearbyLocation.name}" near this point. Would you like to update it instead?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setIsSaving(false),
            },
            {
              text: "Update",
              onPress: () => {
                setShowSaveLocationModal(true);
              },
            },
          ]
        );
      } else {
        setShowSaveLocationModal(true);
      }
    } catch (error) {
      console.error("Error checking for nearby locations:", error);
      Alert.alert("Error", "Failed to check for nearby locations");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLocation = async (name: string) => {
    if (!currentLocationData || !name) return;

    setIsSaving(true);
    try {
      const saved = await locationService.saveLocation(
        name,
        currentLocationData
      );
      console.log("Location saved:", saved);
      Alert.alert("Success", "Location saved successfully");
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to save location");
    } finally {
      setIsSaving(false);
    }
  };

  if (permissionStatus === "granted") {
    return (
      <View
        className="rounded-2xl p-3 border border-grey-3"
        accessibilityRole="none"
        accessibilityLabel="Location status"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2">
            <Ionicons name="location" size={20} color="enaleia-black" />
            <Text
              className="text-sm font-dm-medium text-gray-700"
              accessibilityRole="text"
            >
              Location Enabled
            </Text>
          </View>
          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => setShowSavedLocations(true)}
              className="bg-gray-50 p-2 rounded-full"
              accessibilityRole="button"
              accessibilityLabel="View saved locations"
              accessibilityHint="Double tap to view and select from saved locations"
            >
              <Ionicons name="bookmark-outline" size={20} color="#4B5563" />
            </Pressable>
            <Pressable
              onPress={handleSaveCurrentLocation}
              disabled={isSaving}
              className="bg-gray-50 p-2 rounded-full"
              accessibilityRole="button"
              accessibilityLabel="Save current location"
              accessibilityHint="Double tap to save your current location"
              accessibilityState={{ disabled: isSaving }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#4B5563" />
              ) : (
                <Ionicons name="add" size={20} color="#4B5563" />
              )}
            </Pressable>
          </View>
        </View>

        <LocationEducationalModal
          isVisible={showEducationalModal}
          onClose={() => setShowEducationalModal(false)}
          onRequestLocation={handleRequestPermission}
          onSkip={() => setShowEducationalModal(false)}
          permissionStatus={permissionStatus}
        />

        <SavedLocationsSelector
          isVisible={showSavedLocations}
          onClose={() => setShowSavedLocations(false)}
          onSelect={(location) => {
            onLocationSelected?.(location);
            setShowSavedLocations(false);
          }}
          currentLocationId={currentLocation?.savedLocationId}
        />
      </View>
    );
  }

  return (
    <>
      <View
        className="bg-transparent rounded-2xl p-4 shadow-sm space-y-4 border border-grey-3"
        accessibilityRole="none"
        accessibilityLabel="Location permission request"
      >
        <View className="flex-row items-center space-x-3">
          <View className="bg-blue-50 rounded-full p-2">
            <Ionicons name="location-outline" size={24} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text
              className="text-lg font-dm-bold text-enaleia-black tracking-tight"
              accessibilityRole="header"
            >
              Add location to the event
            </Text>
            <Text className="text-sm font-dm-regular text-gray-600">
              Help us to verify where this event took place
            </Text>
          </View>
        </View>

        <View className="space-y-3">
          <View
            className="flex-row items-center space-x-2"
            accessibilityRole="text"
          >
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text className="text-sm font-dm-regular text-gray-700">
              Verify event location accuracy
            </Text>
          </View>
          <View
            className="flex-row items-center space-x-2"
            accessibilityRole="text"
          >
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text className="text-sm font-dm-regular text-gray-700">
              Works offline with location caching
            </Text>
          </View>
          <View
            className="flex-row items-center space-x-2"
            accessibilityRole="text"
          >
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text className="text-sm font-dm-regular text-gray-700">
              Battery efficient location updates
            </Text>
          </View>
        </View>

        <View className="flex-row space-x-2">
          <Pressable
            onPress={handleRequestPermission}
            disabled={isRequesting}
            className={`flex-1 flex-row items-center justify-center p-2 rounded-full bg-white-sand border border-sand-beige ${
              isRequesting ? "opacity-50" : ""
            }`}
            accessibilityRole="button"
            accessibilityLabel="Enable location"
            accessibilityHint="Double tap to enable location services"
            accessibilityState={{ disabled: isRequesting }}
          >
            {isRequesting ? (
              <ActivityIndicator color="enaleia-black" className="mr-2" />
            ) : (
              <Ionicons
                name="location"
                size={16}
                color="enaleia-black"
                style={{ marginRight: 6 }}
              />
            )}
            <Text className="text-sm font-dm-medium text-enaleia-black tracking-tight">
              {isRequesting ? "Requesting..." : "Enable Location"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowSavedLocations(true)}
            className="bg-white-sand border border-sand-beige p-2 rounded-full aspect-square items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="View saved locations"
            accessibilityHint="Double tap to view and select from saved locations"
          >
            <Ionicons name="bookmark-outline" size={20} color="#4B5563" />
          </Pressable>
        </View>
      </View>

      <LocationEducationalModal
        isVisible={showEducationalModal}
        onClose={() => setShowEducationalModal(false)}
        onRequestLocation={handleRequestPermission}
        onSkip={() => setShowEducationalModal(false)}
        permissionStatus={permissionStatus}
      />

      <SavedLocationsSelector
        isVisible={showSavedLocations}
        onClose={() => setShowSavedLocations(false)}
        onSelect={(location) => {
          onLocationSelected?.(location);
          setShowSavedLocations(false);
        }}
        currentLocationId={currentLocation?.savedLocationId}
      />

      <SaveLocationModal
        isVisible={showSaveLocationModal}
        onClose={() => setShowSaveLocationModal(false)}
        onSave={handleSaveLocation}
      />
    </>
  );
}
