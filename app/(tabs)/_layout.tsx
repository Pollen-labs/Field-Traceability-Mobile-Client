// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItemStatus } from "@/types/queue";
import { Icon } from "../../components/shared/Icon";
import { Platform, Pressable } from "react-native";

const TabsLayout = () => {
  const { queueItems } = useQueue();

  const incompleteItems = Array.isArray(queueItems)
    ? queueItems.filter((item) => item.status !== QueueItemStatus.COMPLETED)
    : [];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0D0D0D",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarHideOnKeyboard: true,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            bottom: 0,
            left: 20,
            right: 20,
            elevation: 0,
            backgroundColor: 'white',
            borderRadius: 21,
            height: 88,
            paddingBottom: 5,
            paddingTop: 10,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 24,
            },
            shadowOpacity: 0.24,
            shadowRadius: 24,
            borderWidth: 2,
            borderColor: '#E5E5E5',
            rippleEnabled: false,
            pressOpacity: 1,
          },
          android: {
            position: 'absolute',
            bottom: 0,
            left: 20,
            right: 20,
            elevation: 0,
            backgroundColor: 'white',
            borderRadius: 21,
            height: 74,
            paddingBottom: 5,
            paddingTop: 10,
            marginBottom: 0,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 24,
            },
            shadowOpacity: 0.24,
            shadowRadius: 24,
            borderWidth: 2,
            borderColor: '#E5E5E5',
            rippleEnabled: false,
            pressOpacity: 1,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <Icon 
              name={focused ? 'home-active' : 'home-inactive'} 
              size={24} 
              color={focused ? "#0D0D0D" : "#8E8E93"} 
            />
          ),
          tabBarButton: (props) => (
            <Pressable {...props} android_ripple={null} />
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          tabBarLabel: "Queue",
          tabBarBadge: incompleteItems.length || undefined,
          tabBarIcon: ({ focused }) => (
            <Icon 
              name={focused ? 'queue-active' : 'queue-inactive'} 
              size={24} 
              color={focused ? "#0D0D0D" : "#8E8E93"} 
            />
          ),
          tabBarButton: (props) => (
            <Pressable {...props} android_ripple={null} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ focused }) => (
            <Icon 
              name={focused ? 'settings-active' : 'settings-inactive'} 
              size={24} 
              color={focused ? "#0D0D0D" : "#8E8E93"} 
            />
          ),
          tabBarButton: (props) => (
            <Pressable {...props} android_ripple={null} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
