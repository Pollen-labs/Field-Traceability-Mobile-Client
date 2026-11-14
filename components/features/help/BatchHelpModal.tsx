// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React from 'react';
import { Text, View, Image } from 'react-native';
import { HelpModal } from './HelpModal';

interface BatchHelpModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const BatchHelpModal: React.FC<BatchHelpModalProps> = ({
  isVisible,
  onClose,
}) => {
  const content = (
    <>
      <Text className="text-base font-dm-light text-enaleia-black mb-2">
      This attestation is used when shipping a container of waste collections.
      </Text>

      {/* Incoming section as a short note */}
      <View className="mb-3 tighter-tracking">
        <Text className="text-lg font-dm-bold text-enaleia-black mb-1">
          Incoming
        </Text>
        <Text className="text-base font-dm-light text-enaleia-black">
          A batch typically has no incoming materials so do not add any unless instructed differently.
        </Text>
      </View>

      {/* Outgoing section as a numbered list */}
      <View className="mb-3 tighter-tracking">
        <Text className="text-lg font-dm-bold text-enaleia-black mb-1">
          Outgoing
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
              <Text className="font-dm-bold">Put a new QR</Text> code sticker on the container
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">4.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              <Text className="font-dm-bold">Scan the QR</Text> code or enter it manually
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">5.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              If known, enter the <Text className="font-dm-bold">weight</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">6.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Repeat for each outgoing containers, if applicable
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
      title="Batch"
      content={content}
      importantNote="If a batch has multiple containers, make sure each containers have it's own QR code stickers and outgoing entry."
      importantNoteBgColor="#9FD08B"
      categories={[
        {
          name: "Batch",
          icon: <Image 
            source={require('../../../assets/images/action-icons/Batch.webp')}
            className="w-14 h-14 mb-1 self-center"
            resizeMode="contain"
          />
        }
      ]}
    />
  );
}; 