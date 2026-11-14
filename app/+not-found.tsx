// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-xl font-bold mb-3">
          Seems you got lost in our ocean
        </Text>
        <Link href="/" className="text-blue-500 underline">
          <Text>Go back to home</Text>
        </Link>
      </View>
    </>
  );
}
