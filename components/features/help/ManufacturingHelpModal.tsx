// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React from 'react';
import { Text, View, Image } from 'react-native';
import { HelpModal } from './HelpModal';

interface ManufacturingHelpModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ManufacturingHelpModal: React.FC<ManufacturingHelpModalProps> = ({
  isVisible,
  onClose,
}) => {
  const content = (
    <>
      <Text className="text-base font-dm-light text-enaleia-black mb-2">
        This attestation is used when manufacturing products using recycled materials. The product must be pre-registered in the Enaleia Hub database.
      </Text>

      <View className="mb-3 tighter-tracking">
        <Text className="text-lg font-dm-bold text-enaleia-black mb-1">
          Incoming
        </Text>
        <View className="gap-0">
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">1.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Tap <Text className="font-dm-bold">+Add</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">2.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Select a <Text className="font-dm-bold">material</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">3.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Scan the <Text className="font-dm-bold">QR code</Text> of the incoming material or enter it manually
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
          Manufacturing information
        </Text>
        <View className="gap-0">
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">1.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Select the <Text className="font-dm-bold">Product</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">2.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Enter the <Text className="font-dm-bold">batch quantity</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">3.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Enter the <Text className="font-dm-bold">weight per item</Text>
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <HelpModal
      isVisible={isVisible}
      onClose={onClose}
      title="Manufacturing"
      content={content}
      importantNote="If your manufacturing process has multiple incoming bags/containers, each should have it's own incoming entry."
      importantNoteBgColor="#E2B9ED"
      categories={[
        {
          name: "Manufacturing",
          icon: <Image 
            source={require('../../../assets/images/action-icons/Manufacturing.webp')}
            className="w-14 h-14 mb-1"
            resizeMode="contain"
          />
        }
      ]}
    />
  );
}; 