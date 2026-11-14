// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { Icon } from '@/components/shared/Icon';
import { Modal } from '@/components/shared/Modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HelpModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  icons?: Array<{
    name: string;
    icon: React.ReactNode;
  }>;
  content: React.ReactNode;
  importantNote?: string;
  importantNoteBgColor?: string;
  categories?: Array<{
    name: string;
    icon: React.ReactNode;
  }>;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isVisible,
  onClose,
  title,
  icons,
  content,
  importantNote,
  importantNoteBgColor = '#FABAA4', // Default color if none provided
  categories,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      className="m-0 mt-auto bg-transparent rounded-t-[32px] overflow-hidden"
    >
      <View className="flex-1 bg-white rounded-t-[32px] overflow-hidden">
        {/* Swipe Handle */}
        <View style={{
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 3,
          backgroundColor: '#DDDDDD',
          marginTop: 16,
          marginBottom: 4,
        }} />
        
        {/* Header */}
        <View className="px-5 pt-2 pb-2 flex-row justify-center items-center">
          <Text className="text-3xl font-dm-bold text-enaleia-black text-center w-full">
            {title}
          </Text>
        </View>

        <ScrollView 
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 16
          }}
        >
          {/* Icons Section */}
          <View className="flex-row justify-center gap-8 px-4 py-2">
            {categories?.map((category, index) => (
              <View key={index} className="items-center">
                {category.icon}
                {/* <Text className="text-xs text-gray-600 text-center">
                  {category.name.split(' ').map((word, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && '\n'}
                      {word}
                    </React.Fragment>
                  ))}
                </Text> */}
              </View>
            ))}
          </View>

          {/* Content Section */}
          <View className="px-5 py-3 gap-4">
            <View className="flex-1">
              {content}
            </View>

            {/* Important Note */}
            {importantNote && (
              <View className={`p-4 rounded-2xl`} style={{ backgroundColor: importantNoteBgColor }}>
                <Text className="font-dm-bold text-base text-enaleia-black mb-1">
                  IMPORTANT
                </Text>
                <Text className="font-dm-light text-base text-enaleia-black">
                  {importantNote}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}; 