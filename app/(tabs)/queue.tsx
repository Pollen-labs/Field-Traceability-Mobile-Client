import QueueSection from "@/components/features/queue/QueueSection";
// import NetworkStatus from "@/components/shared/NetworkStatus";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useAuth } from "@/contexts/AuthContext";
import { useQueue } from "@/contexts/QueueContext";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { QueueItem, QueueItemStatus, MAX_RETRIES } from "@/types/queue";
import { useEventListener } from "expo";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View, Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCompletedQueueCacheKey } from "@/utils/storage";
import { getCompletedQueue } from "@/utils/queueStorage";
import { Ionicons } from "@expo/vector-icons";
import { openWebUrl } from "@/utils/links";

const QueueScreen = () => {
  const { queueItems, loadQueueItems, retryItems, refreshQueueStatus } = useQueue();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [completedItems, setCompletedItems] = useState<QueueItem[]>([]);

  const items = queueItems.length > 0 ? queueItems : [];
  
  // Split items into active, failed, and completed
  const activeItems = items.filter(item => {
    const nonCompletedStates = [
      QueueItemStatus.PENDING,
      QueueItemStatus.PROCESSING,
      QueueItemStatus.FAILED
    ];
    return nonCompletedStates.includes(item.status) && item.totalRetryCount < MAX_RETRIES;
  });

  // Failed items are those that have exceeded max retries
  const failedItems = items
    .filter(item => item.totalRetryCount >= MAX_RETRIES)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Count items needing attention (all active items)
  const attentionCount = activeItems.length + failedItems.length;

  // Load completed items
  useEffect(() => {
    const loadCompletedItems = async () => {
      try {
        console.log("Loading completed items...");
        const completed = await getCompletedQueue();
        console.log("Completed items loaded:", completed.length);
        setCompletedItems(completed);
      } catch (error) {
        console.error("Error loading completed items:", error);
      }
    };

    loadCompletedItems();
  }, []);

  // Listen for queue updates to refresh completed items
  useEffect(() => {
    const handleQueueUpdate = async () => {
      try {
        console.log("Queue update received, refreshing completed items...");
        const completed = await getCompletedQueue();
        console.log("Completed items refreshed:", completed.length);
        setCompletedItems(completed);
      } catch (error) {
        console.error("Error refreshing completed items:", error);
      }
    };

    queueEventEmitter.addListener(QueueEvents.UPDATED, handleQueueUpdate);
    return () => {
      queueEventEmitter.removeListener(QueueEvents.UPDATED, handleQueueUpdate);
    };
  }, []);

  const handleClearAllCompleted = async () => {
    try {
      console.log("Clearing all completed items...");
      // Clear completed items from AsyncStorage
      await AsyncStorage.setItem(getCompletedQueueCacheKey(), JSON.stringify([]));
      // Reload queue items to update the UI
      await loadQueueItems();
      setCompletedItems([]);
      console.log("Completed items cleared successfully");
    } catch (error) {
      console.error("Error clearing completed items:", error);
      Alert.alert(
        "Error",
        "Failed to clear completed items. Please try again."
      );
    }
  };

  const contactSupport = async () => {
    await openWebUrl("mailto:app-support@enaleia.com,enaleia@pollenlabs.org");
  };

  useEffect(() => {
    navigation.setOptions({
      tabBarBadge: attentionCount > 0 ? attentionCount : undefined,
    });
  }, [attentionCount]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      // Only load queue items without refreshing status
      await loadQueueItems();
      // Also load completed items when screen comes into focus
      const completed = await getCompletedQueue();
      setCompletedItems(completed);
    });
    return unsubscribe;
  }, [navigation, loadQueueItems]);

  useEventListener(queueEventEmitter, QueueEvents.UPDATED, loadQueueItems);

  const hasNoItems = items.length === 0 && completedItems.length === 0;

  return (
    <SafeAreaContent>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-2">
          <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-1">
            Queue
          </Text>
        </View>

        <View className="flex-1">
          {hasNoItems ? (
            <View className="flex-1 items-center justify-top px-4">
              <View className="w-auto items-center py-4 px-12 rounded-2xl bg-white mt-12 border border-grey-3">
                <View className="flex-row items-center">
                  <View className="flex-col items-center mr-2">
                    <View className="items-center justify-center">
                      <Ionicons 
                        name="checkmark-circle" 
                        size={24} 
                        color="#059669"
                      />
                    </View>
                  </View>
                  <Text className="text-base font-dm-regular text-enaleia-black">
                    Your queue is empty
                  </Text>
                </View>
              </View>
              <View className="absolute bottom-20 left-0 right-0 items-center">
                <Image
                  source={require("@/assets/images/animals/CrabBubble.png")}
                  className="w-[294px] h-[250px]"
                  accessibilityLabel="Decorative crab illustration"
                  accessibilityRole="image"
                />
              </View>
            </View>
          ) : (
            <View className="py-4">
              {/* Active Items Section */}
              <QueueSection
                title="Active"
                items={activeItems}
                onRetry={retryItems}
                alwaysShow={true}
              />

              {/* Failed Items Section */}
              <QueueSection
                title="Failed"
                items={failedItems}
                onRetry={retryItems}
              />

              {/* Completed Items Section */}
              <QueueSection
                title="Completed"
                items={completedItems}
                onRetry={retryItems}
                onClearAll={handleClearAllCompleted}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaContent>
  );
};

export default QueueScreen;
