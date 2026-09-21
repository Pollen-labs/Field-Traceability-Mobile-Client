import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PortData } from "@/types/batch";

interface PortSelectorProps {
  value?: number;
  onChange: (value: number) => void;
  ports: PortData[];
  countryIds: number[];
  isLoading?: boolean;
  disabled?: boolean;
}

export default function PortSelector({
  value,
  onChange,
  ports,
  countryIds,
  isLoading = false,
  disabled = false,
}: PortSelectorProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const snapPoints = useMemo(() => ["85%"], []);

  const filteredPorts = useMemo(() => {
    const countryFiltered =
      countryIds.length > 0
        ? ports.filter((p) => countryIds.includes(p.country?.country_id ?? -1))
        : ports;

    if (!searchQuery.trim()) return countryFiltered;

    const query = searchQuery.toLowerCase().trim();
    return countryFiltered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.city && p.city.toLowerCase().includes(query)) ||
        (p.country?.country_name &&
          p.country.country_name.toLowerCase().includes(query))
    );
  }, [ports, countryIds, searchQuery]);

  const groupedPorts = useMemo(() => {
    const groups: Record<string, PortData[]> = {};
    for (const port of filteredPorts) {
      const countryName = port.country?.country_name || "Other";
      if (!groups[countryName]) {
        groups[countryName] = [];
      }
      groups[countryName].push(port);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPorts]);

  const selectedPort = ports.find((p) => p.id === value);

  const portLabel = selectedPort
    ? selectedPort.city
      ? `${selectedPort.name} — ${selectedPort.city}`
      : selectedPort.name
    : undefined;

  const presentSheet = useCallback(() => {
    if (!disabled && !isLoading) {
      sheetRef.current?.present();
    }
  }, [disabled, isLoading]);

  const dismissSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const handleSelect = useCallback(
    (portId: number) => {
      onChange(portId);
      dismissSheet();
    },
    [dismissSheet, onChange]
  );

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
        onPress={presentSheet}
        className={`flex-row items-center justify-between rounded-2xl p-2 px-4 h-[65px] bg-white border-[1.5px] ${
          disabled || isLoading ? "border-grey-3 opacity-50" : "border-grey-3"
        }`}
        accessibilityRole="button"
        accessibilityLabel="Select reception port"
        accessibilityState={{ selected: !!selectedPort, disabled: disabled || isLoading }}
        accessibilityHint="Double tap to open port selection"
      >
        <View className="flex-1">
          <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
            Port name
          </Text>
          <Text
            className="font-dm-bold text-xl tracking-tighter text-enaleia-black"
            numberOfLines={1}
          >
            {isLoading ? "Loading..." : portLabel || "Select port"}
          </Text>
        </View>
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
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="interactive"
        backdropComponent={renderBackdrop}
        onDismiss={() => setSearchQuery("")}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-2 pb-2 flex-row justify-center items-center">
            <Text className="text-3xl font-dm-bold text-enaleia-black text-center w-full">
              Collected at
            </Text>
          </View>

          <View className="pb-3">
            <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-2">
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <BottomSheetTextInput
                style={styles.searchInput}
                placeholder="Search ports..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
            </View>
          </View>

          {filteredPorts.length === 0 ? (
            <Text className="text-center text-grey-6 font-dm-regular py-4">
              {searchQuery.trim() ? "No ports match your search" : "No ports available"}
            </Text>
          ) : (
            groupedPorts.map(([countryName, countryPorts]) => (
              <View key={countryName} className="mb-4">
                <Text className="text-[18px] font-dm-regular text-enaleia-black tracking-tighter mb-2">
                  {countryName}
                </Text>
                {countryPorts.map((port) => (
                  <Pressable
                    key={port.id}
                    onPress={() => handleSelect(port.id)}
                    className="bg-white w-full px-4 py-3 rounded-2xl flex flex-row items-center justify-between border-[1.5px] border-grey-3 mb-2"
                    accessibilityRole="menuitem"
                    accessibilityLabel={port.name}
                    accessibilityState={{ selected: port.id === value }}
                  >
                    <View className="flex-1">
                      <Text className="text-base font-dm-bold text-enaleia-black tracking-tighter">
                        {port.name}
                      </Text>
                      {port.city && (
                        <Text className="text-sm font-dm-regular text-grey-6 tracking-tighter">
                          {port.city}
                        </Text>
                      )}
                    </View>
                    {port.id === value && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#0D0D0D"
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetContent: {
    paddingTop: 8,
    flex: 1,
  },
  handleIndicator: {
    backgroundColor: "#DDDDDD",
    width: 36,
    height: 5,
  },
  scrollView: {
    flex: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#0D0D0D",
    fontFamily: "DMSans-Regular",
  },
});
