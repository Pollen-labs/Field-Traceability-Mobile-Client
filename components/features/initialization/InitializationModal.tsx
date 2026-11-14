// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import ModalBase from "@/components/shared/ModalBase";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ErrorMessage from "@/components/shared/ErrorMessage";

interface InitializationModalProps {
  isVisible: boolean;
  progress: {
    user: boolean;
    actions: boolean;
    materials: boolean;
    collectors: boolean;
    products: boolean;
  };
  error: Error | null;
  isAuthError?: boolean;
}

function ProgressItem({
  label,
  isComplete,
}: {
  label: string;
  isComplete: boolean;
}) {
  return (
    <View
      className="flex-row items-center space-x-2 py-2"
      accessibilityRole="none"
      accessibilityLabel={`${label} status`}
    >
      {isComplete ? (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color="green"
          accessibilityLabel={`${label} completed`}
        />
      ) : (
        <ActivityIndicator
          size="small"
          accessibilityLabel={`Loading ${label}`}
        />
      )}
      <Text className="text-base font-dm-medium" accessibilityRole="text">
        {label}
      </Text>
    </View>
  );
}

export function InitializationModal({
  isVisible,
  progress,
  error,
  isAuthError,
}: InitializationModalProps) {
  return (
    <ModalBase isVisible={isVisible} onClose={() => {}} canClose={false}>
      <View className="p-4">
        <Text className="text-xl font-dm-bold mb-4" accessibilityRole="header">
          {isAuthError
            ? "Authentication required"
            : "Please wait while we load the required data..."}
        </Text>

        <View accessibilityRole="none" accessibilityLabel="Loading progress">
          <ProgressItem label="User Info" isComplete={progress.user} />
          {!isAuthError && (
            <>
              <ProgressItem label="Actions" isComplete={progress.actions} />
              <ProgressItem label="Materials" isComplete={progress.materials} />
              <ProgressItem
                label="Collectors"
                isComplete={progress.collectors}
              />
              <ProgressItem label="Products" isComplete={progress.products} />
            </>
          )}
        </View>

        {error && !isAuthError && (
          <ErrorMessage
            message={`Error: ${error.message}`}
            secondaryMessage=""
            className="mt-4"
          />
        )}

        {isAuthError && (
          <View
            className="mt-4 p-4 bg-yellow-50 rounded-lg"
            accessibilityRole="alert"
            accessibilityLabel="Authentication required"
          >
            <Text className="text-yellow-800">
              Please sign in to access this feature.
            </Text>
          </View>
        )}
      </View>
    </ModalBase>
  );
}
