// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { View } from "moti";
import { memo, useRef } from "react";
import { Pressable, ScrollView, Text, View as RNView } from "react-native";

interface TabsProps {
  tabs: { label: string; value: string; count?: number }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const tabRefs = useRef<{ [key: string]: RNView | null }>({});

  const handleTabPress = (tabValue: string) => {
    onTabChange(tabValue);

    const selectedTab = tabRefs.current[tabValue];

    if (selectedTab && scrollViewRef.current) {
      selectedTab.measureLayout(
        scrollViewRef.current as unknown as RNView,
        (x: number, y: number, width: number, height: number) => {
          scrollViewRef.current?.scrollTo({
            x: x - width / 2,
            animated: true,
          });
        },
        () => console.log("Failed to measure tab")
      );
    }
  };

  return (
    <View className="flex-row space-x-2 py-2">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {tabs.map((tab) => (
          <Pressable
            ref={(ref) => {
              tabRefs.current[tab.value] = ref as RNView;
            }}
            className={`flex-row items-center justify-center space-x-1 px-3 py-1.5 rounded-full mr-1.5 ${
              activeTab === tab.value
                ? "bg-[#24548b] border border-[#24548b]"
                : "bg-neutral-50 border border-neutral-200"
            }`}
            key={tab.value}
            onPress={() => handleTabPress(tab.value)}
          >
            <Text
              className={`${
                activeTab === tab.value ? "text-neutral-50" : "text-neutral-700"
              } font-dm-medium tracking-tighter text-sm`}
            >
              {tab.label}
            </Text>
            {tab.count && tab.label !== "Recent" && (
              <View
                className={`rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-2 ${
                  activeTab === tab.value ? "bg-white/30" : "bg-[#24548b]"
                }`}
              >
                <Text className="text-[10px] text-white font-bold">
                  {tab.count}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default memo(Tabs);
