// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/**
 * Gets the cache key and validates it exists
 * @throws Error if cache key is not configured
 */
export const getActiveQueueCacheKey = (): string => {
  const key = process.env.EXPO_PUBLIC_ACTIVE_QUEUE_CACHE_KEY;
  if (!key) {
    throw new Error(
      "Active cache key is not configured. Please set EXPO_PUBLIC_ACTIVE_CACHE_KEY in your environment."
    );
  }
  return key;
};

/**
 * Gets the completed cache key and validates it exists
 * @throws Error if completed cache key is not configured
 */
export const getCompletedQueueCacheKey = (): string => {
  const key = process.env.EXPO_PUBLIC_COMPLETED_QUEUE_CACHE_KEY;
  if (!key) {
    throw new Error(
      "Completed cache key is not configured. Please set EXPO_PUBLIC_COMPLETED_CACHE_KEY in your environment."
    );
  }
  return key;
};

/**
 * Gets the batch cache key and validates it exists
 * @throws Error if batch cache key is not configured
 */
export const getBatchCacheKey = (): string => {
  const key = process.env.EXPO_PUBLIC_BATCH_CACHE_KEY;
  if (!key) {
    throw new Error(
      "Batch cache key is not configured. Please set EXPO_PUBLIC_BATCH_CACHE_KEY in your environment."
    );
  }
  return key;
};

/**
 * Reset all storage (SecureStore and AsyncStorage)
 * Use this for development/testing only
 */
export const resetAllStorage = async () => {
  // Clear SecureStore keys
  const secureKeys = [
    "auth_token",
    "refresh_token",
    "user_email",
    "user_password",
    "token_expiry",
    "wallet_mnemonic",
    "wallet_private_key",
    "wallet_address",
  ];

  await Promise.all(secureKeys.map((key) => SecureStore.deleteItemAsync(key)));

  // Clear AsyncStorage
  await AsyncStorage.clear();

  console.log("All storage cleared");
};
