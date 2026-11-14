// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { EnaleiaDirectusSchema } from "@/types/enaleia";
import {
  authentication,
  createDirectus,
  rest,
  AuthenticationData,
  readMe,
  refresh,
  updateMe,
} from "@directus/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";

// Secure storage keys
const SECURE_STORE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  TOKEN_EXPIRY: "token_expiry",
};

// Custom storage implementation for Directus auth
class SecureStorage {
  async get(): Promise<AuthenticationData | null> {
    try {
      const [accessToken, refreshToken, expiresAt] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY),
      ]);

      if (!accessToken) return null;

      return {
        access_token: accessToken,
        refresh_token: refreshToken ?? null,
        expires: expiresAt ? new Date(expiresAt).getTime() : null,
        expires_at: expiresAt ? new Date(expiresAt).getTime() : null,
      };
    } catch (error) {
      console.error("Error reading from secure storage:", error);
      return null;
    }
  }

  async set(data: AuthenticationData | null) {
    try {
      if (!data) {
        await Promise.all([
          SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
          SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
          SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY),
        ]);
        return;
      }

      let promises: Promise<void>[] = [];

      if (data.access_token) {
        promises.push(
          SecureStore.setItemAsync(
            SECURE_STORE_KEYS.AUTH_TOKEN,
            data.access_token
          )
        );
      }

      if (data.refresh_token) {
        promises.push(
          SecureStore.setItemAsync(
            SECURE_STORE_KEYS.REFRESH_TOKEN,
            data.refresh_token
          )
        );
      }

      if (data.expires_at) {
        promises.push(
          SecureStore.setItemAsync(
            SECURE_STORE_KEYS.TOKEN_EXPIRY,
            new Date(data.expires_at).toISOString()
          )
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Error writing to secure storage:", error);
    }
  }
}

export const createDirectusClient = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not set");
  }

  try {
    const storage = new SecureStorage();
    const client = createDirectus<EnaleiaDirectusSchema>(apiUrl)
      .with(
        authentication("json", {
          storage,
          autoRefresh: true,
          msRefreshBeforeExpires: 24 * 60 * 60 * 1000, // Refresh 24 hours before expiry
        })
      )
      .with(rest({ credentials: "include" }));

    // Only check network state for logging purposes
    NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable;
      if (isOnline) {
        console.log("[Directus] Network connection restored");
      }
    });

    console.log("[Directus] Client created successfully");
    return client;
  } catch (error) {
    console.error("[Directus] Client creation failed", error);
    throw error;
  }
};

export const directus = createDirectusClient();

export async function getStoredAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
}

export async function clearAuthTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY),
  ]);
  directus.setToken(null);
}

// Update token expiration check to use stored expiry
export async function isTokenExpiringSoon(): Promise<boolean> {
  try {
    const expiryStr = await SecureStore.getItemAsync(
      SECURE_STORE_KEYS.TOKEN_EXPIRY
    );
    if (!expiryStr) return true;

    const expiry = new Date(expiryStr);
    const now = new Date();

    // Consider token expiring soon if it expires in less than 1 hour
    return expiry.getTime() - now.getTime() < 60 * 60 * 1000;
  } catch (error) {
    console.error("Error checking token expiry:", error);
    return true;
  }
}

export async function refreshAuthToken(): Promise<boolean> {
  try {
    // Check if token is actually expiring soon before attempting refresh
    if (!(await isTokenExpiringSoon())) {
      return true; // Token is still valid, no need to refresh
    }

    // First try using refresh token
    const refreshToken = await getStoredRefreshToken();
    if (refreshToken) {
      try {
        const result = await directus.request(refresh("json", refreshToken));
        if (result?.access_token) {
          return true;
        }
      } catch (error) {
        console.warn(
          "[Directus] Refresh token failed, trying stored credentials"
        );
      }
    }

    // If refresh token fails, try stored credentials
    const email = await SecureStore.getItemAsync("user_email");
    const password = await SecureStore.getItemAsync("user_password");

    if (!email || !password) {
      await clearAuthTokens();
      return false;
    }

    try {
      await directus.login(email, password);
      return true;
    } catch (error) {
      console.error("Failed to refresh with stored credentials:", error);
      await clearAuthTokens();
      return false;
    }
  } catch (error) {
    console.error("Error in refreshAuthToken:", error);
    await clearAuthTokens();
    return false;
  }
}

export async function ensureValidToken(): Promise<string | null> {
  try {
    const token = await getStoredAuthToken();
    if (!token) return null;

    // If token is expiring soon or refresh fails, clear tokens and return null
    if (await isTokenExpiringSoon()) {
      const refreshed = await refreshAuthToken();
      if (!refreshed) {
        await clearAuthTokens();
        return null;
      }
      return await getStoredAuthToken();
    }

    directus.setToken(token);
    return token;
  } catch (error) {
    console.error("Error ensuring valid token:", error);
    await clearAuthTokens();
    return null;
  }
}

// Update QueryClient settings to be more aggressive with refetching
export const getQueryClientConfig = () => ({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount: number, error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        // Don't retry on auth errors
        if (
          errorMessage.includes("FORBIDDEN") ||
          errorMessage.includes("TOKEN_EXPIRED") ||
          errorMessage.includes("TOKEN_INVALID")
        ) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export async function updateUserWalletAddress(walletAddress: string) {
  try {
    await directus.request(
      updateMe({
        wallet_address: walletAddress,
      })
    );
    return true;
  } catch (error) {
    console.error("[Directus] Failed to update wallet address:", error);
    return false;
  }
}
