// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useQueue } from "@/contexts/QueueContext";
import { useState } from "react";
import { QueueItem, QueueItemStatus, ServiceStatus } from "@/types/queue";

const TEST_ACTIONS = [
  {
    name: "Fishing for litter",
    actionId: 1,
    incomingMaterials: [
      { id: 1, code: "TEST1", weight: 25 },
      { id: 1, code: "TEST1", weight: 52 },
    ],
    outgoingMaterials: [{ id: 2, code: "000002", weight: 14 }],
  },
  {
    name: "Batch",
    actionId: 2,
    incomingMaterials: [{ id: 2, code: "000002", weight: 58 }],
    outgoingMaterials: [{ id: 2, code: "000002", weight: 36 }],
  },
  {
    name: "Sorting",
    actionId: 3,
    incomingMaterials: [
      { id: 1, code: "000020", weight: 25 },
      { id: 2, code: "000002", weight: 87 },
    ],
    outgoingMaterials: [
      { id: 2, code: "000002", weight: 85 },
      { id: 1, code: "000020", weight: 79 },
    ],
  },
  {
    name: "Shredding",
    actionId: 4,
    incomingMaterials: [{ id: 1, code: "000020", weight: 58 }],
    outgoingMaterials: [{ id: 2, code: "000002", weight: 87 }],
  },
  {
    name: "Manufacturing",
    actionId: 5,
    incomingMaterials: [{ id: 1, code: "000020", weight: 24 }],
    outgoingMaterials: [],
    manufacturedProducts: [
      {
        productName: "Nelo 400 Kayak",
        quantity: 45,
        weightPerItem: 17,
      },
    ],
  },
];

export const TestFormSubmission = () => {
  const { updateQueueItems } = useQueue();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmitTestForms = async () => {
    setIsSubmitting(true);
    setResult(null);

    try {
      const submissions: QueueItem[] = TEST_ACTIONS.map((action) => ({
        localId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: QueueItemStatus.PENDING,
        totalRetryCount: 1,
        date: new Date().toISOString(),
        actionId: action.actionId,
        actionName: action.name,
        incomingMaterials: action.incomingMaterials,
        outgoingMaterials: action.outgoingMaterials,
        manufacturedProducts: action.manufacturedProducts,
        directus: {
          status: ServiceStatus.INCOMPLETE,
        },
        eas: {
          status: ServiceStatus.INCOMPLETE,
        },
      }));

      await updateQueueItems(submissions);

      setResult({
        success: true,
        message: `Successfully added ${submissions.length} test forms to the queue`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to submit test forms",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-dm-bold text-enaleia-black mb-2">
        Test Form Submission
      </Text>
      <Text className="text-sm text-grey-6 mb-4">
        Submit test forms with different actions to the queue for testing purposes.
      </Text>
      <Pressable
        onPress={handleSubmitTestForms}
        disabled={isSubmitting}
        className={`bg-enaleia-blue rounded-xl py-3 px-4 flex-row justify-center items-center ${
          isSubmitting ? "opacity-50" : ""
        }`}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-dm-bold text-base">
            Submit Test Forms
          </Text>
        )}
      </Pressable>
      {result && (
        <Text
          className={`mt-2 text-sm ${
            result.success ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {result.message}
        </Text>
      )}
    </View>
  );
}; 