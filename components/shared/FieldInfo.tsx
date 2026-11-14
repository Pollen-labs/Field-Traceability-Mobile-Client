// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { FieldApi } from "@tanstack/react-form";
import { View, Text } from "react-native";

export default function FieldInfo({
  field,
  showErrors = false,
}: {
  field: FieldApi<any, any, any, any>;
  showErrors?: boolean;
}) {
  return (
    <View>
      {(field.state.meta.isTouched || showErrors) &&
      field.state.meta.errors.length ? (
        <Text className="text-red-500 text-sm mt-1">
          {field.state.meta.errors.join(",")}
        </Text>
      ) : null}
      {/* {field.state.meta.isValidating ? "Validating..." : null} */}
    </View>
  );
}
