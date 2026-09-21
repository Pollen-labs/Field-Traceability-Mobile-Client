import "@expo/metro-runtime";
import "../global.css";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import React, { useEffect, useState } from "react";
import { StatusBar, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import * as Localization from "expo-localization";

import { NetworkProvider } from "@/contexts/NetworkContext";
import { QueueProvider } from "@/contexts/QueueContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { defaultLocale, dynamicActivate } from "@/lib/i18n";
import { Asset } from "expo-asset";
import { ACTION_ICONS } from "@/constants/action";
import { WalletProvider } from "@/contexts/WalletContext";
import { DevModeProvider } from "@/contexts/DevModeContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { QueueNetworkHandler } from "@/components/QueueNetworkHandler";

SplashScreen.preventAutoHideAsync();

const preloadedFonts = {
  "DMSans-Bold": require("../assets/fonts/DMSans-Bold.ttf"),
  "DMSans-Light": require("../assets/fonts/DMSans-Light.ttf"),
  "DMSans-Medium": require("../assets/fonts/DMSans-Medium.ttf"),
  "DMSans-Regular": require("../assets/fonts/DMSans-Regular.ttf"),
};

const preloadedActionIcons = Object.values(ACTION_ICONS).map(
  (icon) => icon as number
);

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded] = useFonts(preloadedFonts);
  const locale = Localization.getLocales()[0]?.languageCode || defaultLocale;

  useEffect(() => {
    dynamicActivate(locale);
  }, [locale]);

  useEffect(() => {
    async function prepare() {
      try {
        // Load all assets in parallel
        const [assetsLoaded] = await Promise.all([
          Asset.loadAsync(preloadedActionIcons),
          // Add any other asset loading here if needed
        ]);
        
        // Only set app as ready when both fonts and assets are loaded
        if (fontsLoaded && assetsLoaded) {
          setAppIsReady(true);
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn("Failed to pre-load assets:", e);
        // Even if asset loading fails, we should still show the app
        if (fontsLoaded) {
          setAppIsReady(true);
          await SplashScreen.hideAsync();
        }
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <NetworkProvider>
          <DevModeProvider>
            <WalletProvider>
              <AuthProvider>
                <QueueProvider>
                  <PreferencesProvider>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: "white" },
                        navigationBarHidden: true,
                        animation: "slide_from_right",
                      }}
                    >
                      <Stack.Screen
                        name="(tabs)"
                        options={{
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen
                        name="(auth)/login"
                        options={{
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen
                        name="attest/new/[slug]"
                        options={{
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen
                        name="queue/[id]"
                        options={{
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen
                        name="settings/wallet"
                        options={{
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen
                        name="settings/queue-test"
                        options={{
                          headerShown: false,
                        }}
                      />
                    </Stack>
                    <StatusBar barStyle="dark-content" />
                  </PreferencesProvider>
                </QueueProvider>
              </AuthProvider>
            </WalletProvider>
          </DevModeProvider>
        </NetworkProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
