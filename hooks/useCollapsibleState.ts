// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = '@action_categories_collapse_state';

export const useCollapsibleState = () => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load saved state on mount
    const loadSavedState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          setCollapsedSections(JSON.parse(savedState));
        }
      } catch (error) {
        console.error('Error loading collapse state:', error);
      }
    };
    loadSavedState();
  }, []);

  const toggleSection = async (category: string) => {
    const newState = {
      ...collapsedSections,
      [category]: !collapsedSections[category]
    };
    setCollapsedSections(newState);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving collapse state:', error);
    }
  };

  return {
    collapsedSections,
    toggleSection
  };
}; 