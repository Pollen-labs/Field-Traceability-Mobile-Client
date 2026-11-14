// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";

const LOCATION_CACHE_KEY = "@location_cache";
const LOCATION_PERMISSION_KEY = "@location_permission_status";
const SAVED_LOCATIONS_KEY = "@saved_locations";
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

export const SavedLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  coords: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  usageCount: z.number(),
  lastUsed: z.number(),
});

export const LocationSchema = z.object({
  coords: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    altitude: z.number().optional(),
    heading: z.number().optional(),
    speed: z.number().optional(),
  }),
  timestamp: z.number(),
  cached: z.boolean().optional(),
  savedLocationId: z.string().optional(),
});

export type LocationData = z.infer<typeof LocationSchema>;
export type SavedLocation = z.infer<typeof SavedLocationSchema>;

interface CachedLocation extends LocationData {
  timestamp: number;
}

export const locationService = {
  async requestPermission() {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      console.log("Existing permission status:", existingStatus);

      if (existingStatus === "granted") {
        return { status: existingStatus, isNew: false };
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("New permission status:", status);
      
      await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, status);
      return { status, isNew: true };
    } catch (error) {
      console.error("Error requesting location permission:", error);
      throw error;
    }
  },

  async getCurrentLocation(
    options?: Location.LocationOptions
  ): Promise<LocationData> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        ...options,
      });

      const validatedLocation = LocationSchema.parse({
        ...location,
        cached: false,
      });

      // Cache the location
      await this.cacheLocation(validatedLocation);

      return validatedLocation;
    } catch (error) {
      console.error("Error getting current location:", error);

      // Try to get cached location if available
      const cachedLocation = await this.getCachedLocation();
      if (cachedLocation) {
        return { ...cachedLocation, cached: true };
      }

      throw error;
    }
  },

  async cacheLocation(location: LocationData) {
    try {
      const cacheData: CachedLocation = {
        ...location,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error caching location:", error);
    }
  },

  async getCachedLocation(): Promise<LocationData | null> {
    try {
      const cachedData = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (!cachedData) return null;

      const location: CachedLocation = JSON.parse(cachedData);

      // Check if cache is expired
      if (Date.now() - location.timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
        return null;
      }

      return {
        ...location,
        cached: true,
      };
    } catch (error) {
      console.error("Error getting cached location:", error);
      return null;
    }
  },

  async getPermissionStatus(): Promise<Location.PermissionStatus> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status;
    } catch (error) {
      console.error("Error getting permission status:", error);
      throw error;
    }
  },

  async clearCache() {
    try {
      await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
    } catch (error) {
      console.error("Error clearing location cache:", error);
    }
  },

  async getSavedLocations(): Promise<SavedLocation[]> {
    try {
      const data = await AsyncStorage.getItem(SAVED_LOCATIONS_KEY);
      if (!data) return [];

      const locations = JSON.parse(data);
      return locations.sort(
        (a: SavedLocation, b: SavedLocation) =>
          b.usageCount - a.usageCount || b.lastUsed - a.lastUsed
      );
    } catch (error) {
      console.error("Error getting saved locations:", error);
      return [];
    }
  },

  async saveLocation(
    name: string,
    location: LocationData
  ): Promise<SavedLocation> {
    try {
      const locations = await this.getSavedLocations();

      // Check if location already exists within 100m radius
      const existingLocation = locations.find((saved) => {
        const distance = this.calculateDistance(saved.coords, location.coords);
        return distance < 0.1; // 100 meters
      });

      if (existingLocation) {
        existingLocation.usageCount++;
        existingLocation.lastUsed = Date.now();
        await this.updateSavedLocations(locations);
        return existingLocation;
      }

      const newLocation: SavedLocation = {
        id: Math.random().toString(36).substring(7),
        name,
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        usageCount: 1,
        lastUsed: Date.now(),
      };

      await this.updateSavedLocations([...locations, newLocation]);
      return newLocation;
    } catch (error) {
      console.error("Error saving location:", error);
      throw error;
    }
  },

  async updateSavedLocations(locations: SavedLocation[]) {
    try {
      await AsyncStorage.setItem(
        SAVED_LOCATIONS_KEY,
        JSON.stringify(locations)
      );
    } catch (error) {
      console.error("Error updating saved locations:", error);
      throw error;
    }
  },

  async removeSavedLocation(id: string) {
    try {
      const locations = await this.getSavedLocations();
      const updatedLocations = locations.filter((loc) => loc.id !== id);
      await this.updateSavedLocations(updatedLocations);
    } catch (error) {
      console.error("Error removing saved location:", error);
      throw error;
    }
  },

  // Haversine formula, baby
  calculateDistance(
    coords1: { latitude: number; longitude: number },
    coords2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in km 🤯
    const dLat = this.toRad(coords2.latitude - coords1.latitude);
    const dLon = this.toRad(coords2.longitude - coords1.longitude);
    const lat1 = this.toRad(coords1.latitude);
    const lat2 = this.toRad(coords2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRad(value: number): number {
    return (value * Math.PI) / 180;
  },
};
