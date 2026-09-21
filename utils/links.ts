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