// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { useEffect, useState } from "react";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationEducationalModal } from "./LocationEducationalModal";

const LOCATION_INTRO_KEY = "@location_intro_seen";
const LOCATION_SKIP_KEY = "@location_skip_state";

interface LocationPermissionHandlerProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export function LocationPermissionHandler({
  onPermissionGranted,
  onPermissionDenied,
}: LocationPermissionHandlerProps) {
  const {
    permissionStatus,
    requestPermission,
  } = useCurrentLocation();
  const [showEducationalModal, setShowEducationalModal] = useState(false);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    const [hasSeenIntro, hasSkipped] = await Promise.all([
      AsyncStorage.getItem(LOCATION_INTRO_KEY),
      AsyncStorage.getItem(LOCATION_SKIP_KEY)
    ]);

    // Show modal if:
    // 1. User hasn't seen intro AND hasn't skipped AND location is not granted
    // 2. User has skipped before (to remind them)
    if ((!hasSeenIntro && !hasSkipped && permissionStatus !== "granted") || hasSkipped) {
      setShowEducationalModal(true);
    }
  };

  const handleRequestPermission = async () => {
    const { status } = await requestPermission();
    if (status === "granted") {
      onPermissionGranted?.();
    } else {
      onPermissionDenied?.();
    }
  };

  return (
    <LocationEducationalModal
      isVisible={showEducationalModal}
      onClose={() => setShowEducationalModal(false)}
      onRequestLocation={handleRequestPermission}
      onSkip={() => {
        setShowEducationalModal(false);
        onPermissionDenied?.();
      }}
      permissionStatus={permissionStatus}
    />
  );
} 