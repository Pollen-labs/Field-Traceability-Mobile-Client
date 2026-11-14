// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import React from "react";
import { TextInput, Text, View, Pressable, Platform, Alert } from "react-native";
import { FieldApi } from "@tanstack/react-form";

interface DecimalInputProps {
  field: any;
  label: string;
  placeholder?: string;
  fullWidth?: boolean;
  allowDecimals?: boolean;
  suffix?: string;
  error?: string;
}

export default function DecimalInput({
  field,
  label,
  placeholder = "0",
  fullWidth = false,
  allowDecimals = true,
  suffix,
  error,
}: DecimalInputProps) {
  const [localValue, setLocalValue] = React.useState(
    field.state.value?.toString() || ""
  );

  // Sync localValue when the external field value changes
  React.useEffect(() => {
    const fieldValueStr = field.state.value?.toString() ?? "";
    if (field.state.value !== parseFloat(localValue) && fieldValueStr !== localValue) {
       setLocalValue(fieldValueStr);
    }
  }, [field.state.value]);

  // Use numeric for Android regardless of allowDecimals, but respect the setting for iOS
  const inputMode = Platform.select<"numeric" | "decimal">({
    android: "numeric",
    ios: allowDecimals ? "decimal" : "numeric",
    default: allowDecimals ? "decimal" : "numeric",
  });

  return (
    <View className={fullWidth ? 'w-full' : 'flex-1'}>
      <View className="rounded-2xl bg-white border-[1.5px] border-grey-3 p-2 px-4 h-[72px]">
        <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter mb-1">
          {label}
        </Text>
        <View className="flex-row items-center justify-between">
          <TextInput
            value={localValue}
            onChangeText={(text) => {
              // For weight per item (allowDecimals=true)
              if (allowDecimals) {
                // Convert commas to periods
                const normalizedText = text.replace(/,/g, ".");
                // Allow digits and a single decimal point
                const cleanedValue = normalizedText.replace(/[^0-9.]/g, "");
                
                // Prevent multiple decimal points
                if ((cleanedValue.match(/\./g) || []).length > 1) {
                  return;
                }

                // Validate format
                if (cleanedValue && !/^\d*\.?\d*$/.test(cleanedValue)) {
                  Alert.alert(
                    "Invalid Input",
                    "Warning: Weight per item only accept numbers with optional decimal. Please review your input."
                  );
                  return;
                }

                setLocalValue(cleanedValue);
              } 
              // For other weight fields and batch quantity (allowDecimals=false)
              else {
                // Allow digits and a single decimal point
                const cleanedValue = text.replace(/[^0-9.]/g, "");
                
                // Prevent multiple decimal points
                if ((cleanedValue.match(/\./g) || []).length > 1) {
                  return;
                }

                // Validate format
                if (cleanedValue && !/^\d*\.?\d*$/.test(cleanedValue)) {
                  Alert.alert(
                    "Invalid Input",
                    "This field only accept numbers, please review your input."
                  );
                  return;
                }

                // Check if the value exceeds 16-bit (65535)
                if (cleanedValue && parseFloat(cleanedValue) > 65535) {
                  Alert.alert(
                    "Invalid Input",
                    "Warning: Value cannot be above 65536, please review your input."
                  );
                  return;
                }

                setLocalValue(cleanedValue);
              }
            }}
            onBlur={() => {
              field.handleBlur();

              let finalValue: number | undefined = undefined;

              if (localValue && localValue !== ".") {
                const numericValue = parseFloat(localValue);
                if (!isNaN(numericValue)) {
                  if (allowDecimals) {
                    finalValue = numericValue;
                  } else {
                    finalValue = Math.round(numericValue);
                  }
                }
              }

              field.handleChange(finalValue);
            }}
            className="flex-1 h-[32px] py-0 font-dm-bold tracking-tighter text-enaleia-black text-xl"
            placeholder={placeholder}
            inputMode={inputMode}
          />
          {suffix && (
            <Text className="text-sm font-dm-bold text-grey-6 ml-2 mt-1">
              {suffix}
            </Text>
          )}
        </View>
      </View>
      {error && (
        <Text className="text-sm font-dm-regular text-red-500 mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
