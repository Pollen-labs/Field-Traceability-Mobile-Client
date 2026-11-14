// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React from "react";
import { View } from "react-native";

/**
 * A form section component that adds vertical spacing between form fields.
 * This is a workaround for NativeWind's space-y-* classes which don't work properly.
 * Instead of using space-y-*, this component wraps each child in a View with margin-bottom
 * to achieve consistent vertical spacing between form elements.
 * - @thebeyondr
 */

function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1">
      {React.Children.map(children, (child) => (
        <View className="mb-3">{child}</View>
      ))}
    </View>
  );
}

export default FormSection;
