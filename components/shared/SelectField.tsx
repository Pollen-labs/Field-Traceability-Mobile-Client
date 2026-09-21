import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

interface SelectOption {
  label: string;
  value: number;
  type?: string;
}

interface GroupedOptions {
  [key: string]: SelectOption[];
}

interface SelectFieldProps {
  value?: number;
  onChange: (value: number) => void;
  options: SelectOption[];
  placeholder?: string;
  isLoading?: boolean;
  error?: string;
  disabled?: boolean;
}

export default function SelectField({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  isLoading = false,
  error,
  disabled = false,
}: SelectFieldProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["80%"], []);

  const selectedOption = options.find((opt) => opt.value === value);

  const sortedGroups = useMemo(() => {
    const grouped = options.reduce<GroupedOptions>((acc, option) => {
      const type = option.type || "Other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(option);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [options]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <>
      <Pressable
        onPress={() => !disabled && !isLoading && sheetRef.current?.present()}
        className={`flex-row items-center justify-between rounded-2xl p-2 px-4 h-[65px] bg-white border-[1.5px] ${
          error ? "border-red-500" : "border-grey-3"
        } ${disabled ? "opacity-50" : ""}`}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        accessibilityState={{ selected: !!selectedOption, disabled }}
        accessibilityHint="Double tap to open selection"
      >
        {isLoading ? (
          <ActivityIndicator size="small" className="mr-2" />
        ) : (
          <View className="flex-1">
            <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
              {placeholder}
            </Text>
            <Text
              className="font-dm-bold text-xl tracking-tighter text-enaleia-black"
              numberOfLines={1}
            >
              {selectedOption?.label || "Select"}
            </Text>
          </View>
        )}
        <Ionicons
          name="chevron-down"
          size={20}
          color="#0D0D0D"
          style={{ marginLeft: 8 }}
        />
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#DDDDDD", width: 36, height: 5 }}
        backgroundStyle={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
      >
        <View className="px-5 pt-2 pb-2 flex-row justify-center items-center">
          <Text className="text-3xl font-dm-bold text-enaleia-black text-center w-full">
            {placeholder}
          </Text>
        </View>

        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {sortedGroups.map(([type, typeOptions]) => (
            <View key={type} className="mb-4">
              <Text className="text-[18px] font-dm-regular text-enaleia-black tracking-tighter mb-2">
                {type}
              </Text>
              {typeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    sheetRef.current?.dismiss();
                  }}
                  className="bg-white w-full px-4 py-3 rounded-2xl flex flex-row items-center justify-between border-[1.5px] border-grey-3 mb-2"
                  accessibilityRole="menuitem"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: option.value === value }}
                >
                  <Text className="text-base font-dm-bold text-enaleia-black tracking-tighter">
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#0D0D0D"
                    />
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}
