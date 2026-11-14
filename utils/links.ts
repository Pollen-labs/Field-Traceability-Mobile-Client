// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import * as WebBrowser from "expo-web-browser";
import { Linking, Alert, Platform } from "react-native";

export async function openWebUrl(url: string) {
  if (url.startsWith("mailto:")) {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open email client.");
    }
    return;
  }

  const result = await WebBrowser.openBrowserAsync(url);
  if (result.type === "cancel" && Platform.OS === "ios") {
    // User dismissed the Safari View Controller — no action needed
  }
}