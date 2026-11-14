// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CollectionHelpModal } from '@/components/features/help/CollectionHelpModal';
import { Stack } from 'expo-router';

export default function HelpTestScreen() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <View className="flex-1 bg-white p-5">
      <Stack.Screen options={{ title: 'Help Modal Test' }} />
      
      <Text className="text-xl font-dm-bold mb-4">Help Modal Examples</Text>
      
      <Pressable
        onPress={() => setShowHelp(true)}
        className="bg-enaleia-black px-4 py-2 rounded-lg"
      >
        <Text className="text-white font-dm-medium">Show Collection Help</Text>
      </Pressable>

      <CollectionHelpModal 
        isVisible={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </View>
  );
} 