// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { locationService, LocationData } from "@/services/locationService";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

interface LocationState {
  data: LocationData | null;
  permissionStatus: Location.PermissionStatus | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCurrentLocation(options?: { enableHighAccuracy?: boolean }) {
  const [state, setState] = useState<LocationState>({
    data: null,
    permissionStatus: null,
    isLoading: true,
    error: null,
  });

  const checkPermission = useCallback(async () => {
    const status = await locationService.getPermissionStatus();
    setState((prev) => ({ ...prev, permissionStatus: status }));
    return status;
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const fetchLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const status = await checkPermission();

      if (status !== "granted") {
        throw new Error("Location permission not granted");
      }

      const location = await locationService.getCurrentLocation({
        accuracy: options?.enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      setState((prev) => ({ ...prev, data: location, isLoading: false }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to get location");
      setState((prev) => ({
        ...prev,
        error,
        isLoading: false,
      }));
    }
  }, [checkPermission, options?.enableHighAccuracy]);

  // Initial fetch
  useEffect(() => {
    fetchLocation();
    // Set up periodic refresh
    const interval = setInterval(fetchLocation, 1000 * 60 * 5); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchLocation]);

  const requestPermission = useCallback(async () => {
    const { status, isNew } = await locationService.requestPermission();
    setState((prev) => ({ ...prev, permissionStatus: status }));
    if (status === "granted") {
      fetchLocation();
    }
    return { status, isNew };
  }, [fetchLocation]);

  return {
    ...state,
    refetch: fetchLocation,
    requestPermission,
  };
}
