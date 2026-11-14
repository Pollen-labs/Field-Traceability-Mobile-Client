// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import ErrorMessage from "@/components/shared/ErrorMessage";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";
import { resetAllStorage } from "@/utils/storage";

const LoginData = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(4, "Password is too short"),
});

type LoginData = z.infer<typeof LoginData>;

export default function LoginForm() {
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, isAuthenticated, lastLoggedInUser, offlineLogin } =
    useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const isOnline = isConnected && isInternetReachable;

  useEffect(() => {
    // If already authenticated, redirect to tabs
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  // Try to auto-login when offline
  useEffect(() => {
    const tryOfflineLogin = async () => {
      if (!isOnline && lastLoggedInUser) {
        try {
          // Get stored password
          const storedPassword = await SecureStore.getItemAsync(
            "user_password"
          );
          if (storedPassword) {
            const success = await offlineLogin(
              lastLoggedInUser,
              storedPassword
            );
            if (success) {
              router.replace("/(tabs)");
            }
          }
        } catch (error) {
          console.error("Failed to auto-login offline:", error);
        }
      }
    };

    tryOfflineLogin();
  }, [isOnline, lastLoggedInUser]);

  const handleLogin = async (values: LoginData) => {
    try {
      if (isOnline) {
        // Online login
        await login(values.email, values.password);
        router.replace("/(tabs)");
      } else {
        // Offline login
        const success = await offlineLogin(values.email, values.password);
        if (success) {
          router.replace("/(tabs)");
        } else {
          setFormError("Unable to log in while offline");
        }
      }
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
      if (
        error instanceof TypeError &&
        error.message === "Network request failed"
      ) {
        setFormError(
          "Unable to connect to the server. Please check your internet connection and try again."
        );
      } else {
        setFormError("Invalid login credentials, please try again");
      }
      throw error;
    }
  };

  const form = useForm<LoginData>({
    defaultValues: {
      email: lastLoggedInUser || "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        // Check if both fields are filled
        if (!value.email && !value.password) {
          setFormError("Please enter your email and password");
          return;
        }

        // Check if only one field is filled
        if (!value.email) {
          setFormError("Please enter your email");
          return;
        }

        if (!value.password) {
          setFormError("Please enter your password");
          return;
        }

        // Validate email format
        if (value.email && !value.email.includes("@")) {
          setFormError("Please enter a valid email address");
          return;
        }

        // Validate password length
        if (value.password && value.password.length < 4) {
          setFormError("Password is too short");
          return;
        }

        await handleLogin(value);
      } catch (error) {
        console.error("Login failed:", error);
      }
    },
  });

  return (
    <View>
      {/* {!isOnline && (
        <View className="mb-4">
          <View className="flex-row items-center px-3 py-1 bg-sand-beige rounded-full self-start">
            <Text className="text-sm font-dm-medium text-enaleia-black">
              Limited functionality is available in offline mode
            </Text>
          </View>
        </View>
      )} */}

      <form.Field name="email">
        {(field) => (
          <View
            className={`bg-white px-4 py-2 rounded-2xl h-2xl border-[1.5px] ${
              formError && !field.state.value
                ? "border-red-300"
                : field.state.meta.isTouched
                ? "border-sand-beige"
                : "border-transparent"
            }`}
          >
            <Text className="font-dm-light text-grey-6 text-sm">Email</Text>
            <TextInput
              ref={emailInputRef}
              className="h-10 px-0 focus:shadow-outline focus:ring-offset-2 font-dm-bold text-xl"
              placeholder="email@email.com"
              value={field.state.value}
              onChangeText={(text) => {
                field.handleChange(text);
                if (formError) setFormError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              inputMode="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          </View>
        )}
      </form.Field>

      <View className="p-1" />

      <form.Field name="password">
        {(field) => (
          <View
            className={`bg-white px-4 py-2 rounded-2xl h-2xl border-[1.5px] ${
              formError && !field.state.value
                ? "border-red-300"
                : field.state.meta.isTouched
                ? "border-sand-beige"
                : "border-transparent"
            }`}
          >
            <Text className="font-dm-light text-grey-6 text-sm">Password</Text>
            <View className="flex-row items-center">
              <TextInput
                ref={passwordInputRef}
                className="flex-1 h-10 px-0 focus:shadow-outline focus:ring-offset-2 font-dm-bold text-xl"
                placeholder="••••••••"
                value={field.state.value}
                onChangeText={(text) => {
                  field.handleChange(text);
                  if (formError) setFormError(null);
                }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={() => form.handleSubmit()}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="pl-2"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="#6B7280"
                />
              </Pressable>
            </View>
          </View>
        )}
      </form.Field>

      <View className="p-1" />

      <form.Subscribe
        selector={(state) => ({
          canSubmit: !isLoading,
          isSubmitting: isLoading,
        })}
      >
        {({ canSubmit, isSubmitting }) => (
          <Pressable
            onPress={() => form.handleSubmit()}
            className="flex flex-row items-center justify-center p-3 bg-blue-ocean rounded-full tracking-tight"
          >
            {isSubmitting ? (
              <View className="flex flex-row items-center justify-center gap-2">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-dm-medium text-base">
                  Logging in...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-dm-medium text-base">
                {isOnline ? "Login" : "Login Offline"}
              </Text>
            )}
          </Pressable>
        )}
      </form.Subscribe>

      <View className="p-1" />

      <View className="min-h-[32px]">
        {formError && (
          <ErrorMessage message={formError} hideSecondaryMessage={true} />
        )}
      </View>

      <View className="p-4" />

      {__DEV__ && (
        <Pressable
          onPress={async () => {
            try {
              await resetAllStorage();
              router.replace("/login");
            } catch (error) {
              console.error("Failed to reset storage:", error);
            }
          }}
          className="flex flex-row items-center justify-center p-3 bg-red-500 rounded-full tracking-tight mt-4"
        >
          <Text className="text-white font-dm-medium text-base">
            Reset Storage (Dev Only)
          </Text>
        </Pressable>
      )}
    </View>
  );
}
