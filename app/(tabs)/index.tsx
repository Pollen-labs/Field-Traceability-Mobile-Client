// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import ActionSelection from "@/components/features/home/ActionSelect";
import { InitializationModal } from "@/components/features/initialization/InitializationModal";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { groupActionsByCategory } from "@/types/action";
import { BatchData } from "@/types/batch";
import {
  fetchAndProcessBatchData,
  initializeBatchData,
  subscribeToBatchData,
} from "@/utils/batchStorage";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

function Home() {
  const { user } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const isOnline = !!(isConnected && isInternetReachable);
  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState({
    user: false,
    actions: false,
    materials: false,
    collectors: false,
    products: false,
  });

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        const result = await initializeBatchData(isOnline, user);
        if (!mounted) return;

        setBatchData(result.data);
        setProgress(result.progress);
        setError(result.error);
      } catch (e) {
        if (!mounted) return;
        setError(e as Error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Subscribe to batch data updates
    const unsubscribe = subscribeToBatchData((data) => {
      if (mounted) {
        setBatchData(data);
        if (data) {
          setProgress({
            user: !!user,
            actions: !!data.actions?.length,
            materials: !!data.materials?.length,
            collectors: !!data.collectors?.length,
            products: !!data.products?.length,
          });
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isOnline, user]);

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && user) {
      fetchAndProcessBatchData().catch(console.error);
    }
  }, [isOnline, user]);

  const isComplete = user && batchData;
  const isAuthError = !user || (error?.message || "").includes("FORBIDDEN");
  const groupedActions = batchData?.actions
    ? groupActionsByCategory(batchData.actions)
    : undefined;

  // Show initialization modal if loading or error
  const showInitModal =
    isLoading || (!isComplete && !isAuthError) || (!!error && !isAuthError);

  return (
    <SafeAreaContent>
      {/* <InitializationModal
        isVisible={showInitModal}
        progress={progress}
        error={error instanceof Error ? error : null}
        isAuthError={isAuthError}
      /> */}

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
      >
        <View className="mt-2">
          <Text
            className="text-[33px] font-dm-bold tracking-[-1.5px] text-enaleia-black pt-1"
            style={{ marginBottom: 12, lineHeight: 33 }}
          >
            Hello, what action will you be doing today?
          </Text>
          <ActionSelection
            actions={groupedActions ?? undefined}
            isLoading={isLoading && !isAuthError}
          />
        </View>
      </ScrollView>
    </SafeAreaContent>
  );
}

export default Home;
