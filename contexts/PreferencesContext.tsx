// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferencesContextType {
  autoScanQR: boolean;
  autoJumpToWeight: boolean;
  setAutoScanQR: (value: boolean) => Promise<void>;
  setAutoJumpToWeight: (value: boolean) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const AUTO_SCAN_QR_KEY = '@auto_scan_qr';
const AUTO_JUMP_TO_WEIGHT_KEY = '@auto_jump_to_weight';

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autoScanQR, setAutoScanQRState] = useState(true);
  const [autoJumpToWeight, setAutoJumpToWeightState] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [scanQRValue, jumpToWeightValue] = await Promise.all([
        AsyncStorage.getItem(AUTO_SCAN_QR_KEY),
        AsyncStorage.getItem(AUTO_JUMP_TO_WEIGHT_KEY)
      ]);

      setAutoScanQRState(scanQRValue !== 'false');
      setAutoJumpToWeightState(jumpToWeightValue !== 'false');
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const setAutoScanQR = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(AUTO_SCAN_QR_KEY, value.toString());
      setAutoScanQRState(value);
    } catch (error) {
      console.error('Error saving auto scan QR preference:', error);
    }
  };

  const setAutoJumpToWeight = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(AUTO_JUMP_TO_WEIGHT_KEY, value.toString());
      setAutoJumpToWeightState(value);
    } catch (error) {
      console.error('Error saving auto jump to weight preference:', error);
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        autoScanQR,
        autoJumpToWeight,
        setAutoScanQR,
        setAutoJumpToWeight,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}; 