// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { LoadingScreen } from "@/components/LoadingScreen";
import ActionButton from "@/components/features/home/ActionButton";
import { GroupedActions } from "@/types/action";
import { Action } from "@/types/action";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useCollapsibleState } from "@/hooks/useCollapsibleState";
import { Ionicons } from "@expo/vector-icons";

interface ActionSelectionProps {
  actions: GroupedActions | undefined;
  isLoading: boolean;
}

export default function ActionSelection({
  actions,
  isLoading,
}: ActionSelectionProps) {
  const { collapsedSections, toggleSection } = useCollapsibleState();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!actions || Object.keys(actions).length === 0) {
    return <Text>No actions found</Text>;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {Object.entries(actions).map(([category, categoryActions]) => (
        <View
          key={category}
          className="py-3"
        >
          <Pressable
            onPress={() => toggleSection(category)}
            className="flex-row items-center justify-between mb-4" 
          >
            <Text className="text-[18px] font-dm-medium text-enaleia-black tracking-tight">
              {category}
            </Text>
            <Ionicons
              name={collapsedSections[category] ? "chevron-down" : "chevron-up"}
              size={24}
              color="#0D0D0D"
            />
          </Pressable>
          {!collapsedSections[category] && (
            <View className="flex-row flex-wrap justify-between">
              {categoryActions.map((action: Action) => (
                <ActionButton
                  key={action.id}
                  name={action.name}
                  color={action.color}
                  icon={action.icon}
                  slug={action.slug}
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
