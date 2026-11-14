// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React from 'react';
import { Text, View, Image } from 'react-native';
import { HelpModal } from './HelpModal';

interface CollectionHelpModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CollectionHelpModal: React.FC<CollectionHelpModalProps> = ({
  isVisible,
  onClose,
}) => {
  const content = (
    <>
      <Text className="text-base font-dm-light text-enaleia-black mb-2">
      This attestation is used when receiving a waste collection.
      </Text>

      {/* Section with subtitle and bullet points */}
      <View className="mb-3 tighter-tracking">
        <Text className="text-lg font-dm-bold text-enaleia-black mb-1">
          Incoming
        </Text>
        <View className="gap-0">
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">1.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
            Scan the <Text className="font-dm-bold">collector's ID card</Text> or enter it manually
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">2.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
            Tap <Text className="font-dm-bold">+Add</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">3.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
            Select a <Text className="font-dm-bold">material</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">4.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
            Enter the <Text className="font-dm-bold">weight</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">5.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
            <Text className="font-dm-bold">Repeat</Text> for each additional incoming materials, if applicable
            </Text>
          </View>
        </View>
      </View>

      <View>
        <Text className="text-lg font-dm-bold text-enaleia-black mb-1">
          Outgoing
        </Text>
        <Text className="text-base font-dm-light text-enaleia-black">
        A collection typically has <Text className="font-dm-bold">no outgoing materials</Text> so do not add any unless instructed differently.
        </Text>
      </View>
    </>
  );

  return (
    <HelpModal
      isVisible={isVisible}
      onClose={onClose}
      title="Collection"
      content={content}
      importantNote="If a collector has multiple distinct materials that can be weigthed individually, then all the materials can be entered into a single attestation. Just make sure that each materials have it's own incoming entry, material type and weight."
      importantNoteBgColor="#FABAA4"
      categories={[
        {
          name: "Fishing for Litter",
          icon: <Image 
            source={require('../../../assets/images/action-icons/Fishing for Litter.webp')}
            className="w-14 h-14 mb-1"
            resizeMode="contain"
          />
        },
        {
          name: "Prevention",
          icon: <Image 
            source={require('../../../assets/images/action-icons/Prevention.webp')}
            className="w-14 h-14 mb-1"
            resizeMode="contain"
          />
        },
        {
          name: "Ad-hoc",
          icon: <Image 
            source={require('../../../assets/images/action-icons/Ad-hoc.webp')}
            className="w-14 h-14 mb-1"
            resizeMode="contain"
          />
        },
        {
          name: "Beach Cleanup",
          icon: <Image 
            source={require('../../../assets/images/action-icons/Beach Cleanup.webp')}
            className="w-14 h-14 mb-1"
            resizeMode="contain"
          />
        }
      ]}
    />
  );
}; 