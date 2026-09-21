import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItem, ServiceStatus, QueueItemStatus, MAX_RETRIES, LIST_RETRY_INTERVAL } from "@/types/queue";
import { useBatchData } from "@/hooks/data/useBatchData";
import { MaterialDetail } from "@/types/material";
import { EAS_CONSTANTS } from "@/services/eas";
import { removeFromActiveQueue, removeFromAllQueues, getCompletedQueue, markItemAsRescued, getRescuedItems } from "@/utils/queueStorage";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ClearConfirmationModal } from "@/components/features/queue/ClearConfirmationModal";
import { IncompleteAttestationModal } from "@/components/features/attest/IncompleteAttestationModal";
import { LeaveAttestationModal } from "@/components/features/attest/LeaveAttestationModal";
import { ServiceStatusIndicator } from "@/components/features/queue/ServiceStatusIndicator";
import QueueStatusIndicator from "@/components/features/queue/QueueStatusIndicator";
import { formatDate } from "@/utils/date";
import { EmailConfirmationModal } from "@/components/features/queue/EmailConfirmationModal";
import { ClearItemConfirmationModal } from "@/components/features/queue/ClearItemConfirmationModal";
import { openWebUrl } from "@/utils/links";

export default function QueueItemDetails() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const { queueItems, loadQueueItems, retryItem } = useQueue();
  const { materials: materialsData, products: productsData, actions: actionsData, collectors } = useBatchData();
  const { user } = useAuth();
  const [item, setItem] = useState<QueueItem | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [hasEmailedSupport, setHasEmailedSupport] = useState(false);
  const [showClearButton, setShowClearButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Find collector info if available
  const collectorInfo = useMemo(() => {
    if (!item?.collectorId || !collectors) return null;
    return collectors.find(c => c.collector_identity === item.collectorId);
  }, [item?.collectorId, collectors]);

  // Check if item was previously rescued
  useEffect(() => {
    const checkRescuedStatus = async () => {
      if (item) {
        const rescuedItems = await getRescuedItems();
        if (rescuedItems.includes(item.localId)) {
          setHasEmailedSupport(true);
          setShowClearButton(true);
        }
      }
    };
    checkRescuedStatus();
  }, [item]);

  useEffect(() => {
    const loadQueueItemDetails = async () => {
      try {
        setIsLoading(true);
        console.log("Loading queue item details:", {
          id,
          queueItemsCount: queueItems.length,
          availableIds: queueItems.map(i => i.localId)
        });

        // First check active queue
        let foundItem = queueItems.find(i => i.localId === id);
        
        // If not found in active queue, check completed queue
        if (!foundItem) {
          console.log("Item not found in active queue, checking completed queue...");
          const completedItems = await getCompletedQueue();
          foundItem = completedItems.find(i => i.localId === id);
        }

        console.log("Found item:", foundItem);
        setItem(foundItem || null);
      } catch (error) {
        console.error("Error loading queue item details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQueueItemDetails();
  }, [id, queueItems]);

  const handleRetry = async () => {
    if (!item) return;
    try {
      await retryItem(item.localId);
      navigation.goBack();
    } catch (error) {
      console.error("Error retrying item:", error);
      Alert.alert("Error", "Failed to retry item. Please try again.");
    }
  };

  const handleContactSupport = async () => {
    await openWebUrl("mailto:app-support@enaleia.com,enaleia@pollenlabs.org");
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-lg text-grey-9 mb-2">Item not found</Text>
        <Text className="text-sm text-grey-6 text-center mb-4">
          The requested item could not be found. It may have been deleted or moved.
        </Text>
        <Pressable
          onPress={handleContactSupport}
          className="bg-enaleia-blue px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Contact Support</Text>
        </Pressable>
      </View>
    );
  }

  const currentAction = actionsData?.find(action => action.id === item.actionId);
  if (!currentAction) {
    console.log('Action not found:', { actionId: item.actionId, availableActions: actionsData?.map(a => a.id) });
    return (
      <SafeAreaContent>
        <View className="flex-1 items-center justify-center">
          <Text>Action type not found</Text>
        </View>
      </SafeAreaContent>
    );
  }

  const timestamp = item.lastAttempt || item.date;
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
  }).format(new Date(timestamp))
    .replace(/(\d+)(?=(,))/, (match) => {
      const num = parseInt(match);
      const suffix = ["th", "st", "nd", "rd"][(num % 10 > 3 || num % 100 - num % 10 == 10) ? 0 : num % 10];
      return num + suffix;
    });

  const getStatusSummary = () => {
    if (!item) return "";
    
    const hasDirectusIncomplete = item.directus?.status === ServiceStatus.INCOMPLETE;
    const hasEasIncomplete = item.eas?.status === ServiceStatus.INCOMPLETE;
    const hasLinkingIncomplete = item.linking?.status === ServiceStatus.INCOMPLETE;
    
    if (hasDirectusIncomplete || hasEasIncomplete || hasLinkingIncomplete) {
      const incompleteServices = [];
      if (hasDirectusIncomplete) incompleteServices.push("Database incomplete");
      if (hasEasIncomplete) incompleteServices.push("Blockchain incomplete");
      if (hasLinkingIncomplete) incompleteServices.push("Linking incomplete");
      return `: ${incompleteServices.join(", ")}`;
    }
    
    if (item.directus?.status === ServiceStatus.COMPLETED && 
        item.eas?.status === ServiceStatus.COMPLETED && 
        item.linking?.status === ServiceStatus.COMPLETED) {
      return ": All services completed";
    }
    
    return ": Processing";
  };

  const getStatusEmoji = (status: ServiceStatus | undefined, isLinked?: boolean) => {
    if (status === ServiceStatus.COMPLETED && isLinked) return "✅";
    if (status === ServiceStatus.FAILED) return "❌";
    if (status === ServiceStatus.PROCESSING) return "⏳";
    return "⏳";
  };

  const formatEmailBody = () => {
    if (!item || !currentAction) return "";

    const sections = [
      `Action Type: ${currentAction.name}`,
      `Status Summary:
  Database: ${item.directus?.status || "INCOMPLETE"} ${getStatusEmoji(item.directus?.status)}
  Blockchain: ${item.eas?.status || "INCOMPLETE"} ${getStatusEmoji(item.eas?.status)}
  Linking: ${item.linking?.status || "INCOMPLETE"} ${getStatusEmoji(item.linking?.status)}`,
      item.collectorId ? `
Collector Information:
  - ID: ${item.collectorId}
  - Name: ${collectorInfo?.collector_name || "N/A"}` : null,
      (currentAction?.category === "Collection" && item.selectedPort) ? `
Reception Port:
  - Name: ${item.selectedPort.name}` : null,
      item.incomingMaterials?.length ? `
Incoming Materials:
${item.incomingMaterials.map((material, index) => {
  const materialData = materialsData?.find(m => m.material_id === material.id);
  return `
Material #${index + 1}:
  - Name: ${materialData?.material_name || "Unknown Material"}
  - Code: ${material.code || "N/A"}
  - Weight: ${material.weight} Kg`;
}).join("\n")}` : null,
      item.outgoingMaterials?.length ? `
Outgoing Materials:
${item.outgoingMaterials.map((material, index) => {
  const materialData = materialsData?.find(m => m.material_id === material.id);
  return `
Material #${index + 1}:
  - Name: ${materialData?.material_name || "Unknown Material"}
  - Code: ${material.code || "N/A"}
  - Weight: ${material.weight} Kg`;
}).join("\n")}` : null,
      item.manufacturing ? `
Manufacturing Details:
  - Product: ${productsData?.find(p => p.product_id === item.manufacturing?.product)?.product_name || "N/A"}
  - Batch Quantity: ${item.manufacturing.quantity || "N/A"} Unit
  - Weight per item: ${item.manufacturing.weightInKg || "N/A"} Kg` : null,
      `
Other Details:
  - Created Date: ${formattedTime}
  - Location: ${item.location?.coords ? `${item.location.coords.latitude}, ${item.location.coords.longitude}` : "N/A"}
  - Attestation UID: ${item.eas?.txHash || "N/A"}
  - Event ID: ${item.directus?.eventId || "N/A"}`,
      (item.directus?.error || item.eas?.error || (item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked)) ? `
Error:
${[
  item.directus?.error ? `  - Database: ${item.directus.error}` : null,
  item.eas?.error ? `  - Blockchain: ${item.eas.error}` : null,
  item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked ? `  - Linking: Failed to link attestation with database` : null
].filter(Boolean).join("\n")}` : null
    ].filter(Boolean).join("\n\n");

    return sections;
  };

  const handleEmail = async () => {
    const emailBody = formatEmailBody();
    const subject = `Attestation Details - ${currentAction?.name}${getStatusSummary()}`;
    const url = `mailto:app-support@enaleia.com,enaleia@pollenlabs.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    try {
      await openWebUrl(url);
      setHasEmailedSupport(true);
      if (item) {
        await markItemAsRescued(item.localId);
      }
    } catch (error) {
      console.error('Error opening email client:', error);
      Alert.alert(
        "Error",
        "Failed to open email client. Please try again later."
      );
    } finally {
      setShowEmailModal(false);
    }
  };

  const handleEmailPress = () => {
    setShowEmailModal(true);
  };

  const handleEmailProceed = () => {
    setShowEmailModal(false);
    handleEmail();
  };

  const handleClear = () => {
    setShowClearModal(true);
  };

  const confirmClear = async () => {
    if (!item) return;
    try {
      await removeFromAllQueues(item.localId);
      await removeFromRescuedItems(item.localId);
      await loadQueueItems();
      setShowClearModal(false);
      router.back();
    } catch (error) {
      console.error("Error clearing item:", error);
      Alert.alert(
        "Error",
        "Failed to clear the item. Please try again."
      );
    }
  };

  // const canClear = item.status === QueueItemStatus.FAILED && 
  //                  item.directus?.status === ServiceStatus.FAILED && 
  //                  item.eas?.status === ServiceStatus.FAILED;

  const isCompleted = item.status === QueueItemStatus.COMPLETED;
  const hasFailed = item.status === QueueItemStatus.FAILED || item.totalRetryCount >= MAX_RETRIES;
  const canRetry = !isCompleted;

  return (
    <SafeAreaContent>
      <View className="flex-row items-center justify-between pb-4">
              <Pressable
              onPress={() => router.back()}
              className="flex-row items-center space-x-1"
              >
              <Ionicons name="chevron-back" size={24} color="#0D0D0D" />
              <Text className="text-base font-dm-regular text-enaleia-black tracking-tight">
                  Queue
              </Text>
              </Pressable>
      </View>
      <ScrollView
        className="flex-1 mb-10"
        showsVerticalScrollIndicator={false}
      >

        {item && (
          <View className="flex-1">


            <Text className="text-3xl font-dm-bold text-enaleia-black tracking-tighter mb-4">
              {currentAction?.name || 'Unknown Action'}
            </Text>

            {/* Collector Section */}
            {collectorInfo && (
              <View className="mb-8">
                <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter mb-2">
                  Collector
                </Text>
                <View className="border border-grey-3 rounded-2xl">
                  <View className="p-4 py-3 border-b border-grey-3">
                    <Text className="text-sm font-dm-bold text-grey-6">
                      Collector ID
                    </Text>
                    <Text className="text-xl font-dm-bold text-enaleia-black">
                      {item.collectorId || 'N/A'}
                    </Text>
                  </View>
                  <View className="p-4 py-3">
                    <Text className="text-sm font-dm-bold text-grey-6">
                      Name
                    </Text>
                    <Text className="text-xl font-dm-bold text-enaleia-black">
                      {collectorInfo.collector_name || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Reception Port Section (Collection only) */}
            {currentAction?.category === "Collection" && item.selectedPort && (
              <View className="mb-8">
                <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter mb-2">
                  Collected at
                </Text>
                <View className="border border-grey-3 rounded-2xl">
                  <View className="p-4 py-3">
                    <Text className="text-sm font-dm-bold text-grey-6">
                      Port Name
                    </Text>
                    <Text className="text-xl font-dm-bold text-enaleia-black">
                      {item.selectedPort.name || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Incoming Materials Section */}
            {item.incomingMaterials && item.incomingMaterials.length > 0 && (
              <View className="mb-8">
                <View className="flex-row items-center gap-1 mb-2">
                  <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter">
                    Incoming
                  </Text>
                  <View style={{ transform: [{ rotateZ: '-45deg' }] }}>
                    <Ionicons 
                      name="arrow-down" 
                      size={24} 
                      color="#8E8E93" 
                    />
                  </View>
                </View>
                
                {item.incomingMaterials.map((material, index) => {
                  const materialData = materialsData?.find(m => m.material_id === material.id);
                  return (
                    <View key={index} className="mb-4">
                      <Text className="text-xl font-dm-bold text-enaleia-black mb-2">
                        {materialData?.material_name || "Unknown Material"}
                      </Text>
                      <View className="border bg-white border-grey-3 rounded-2xl">
                        <View className="flex-row">
                          <View className="flex-1 p-4 py-3 border-r border-grey-3">
                            <Text className="text-sm font-dm-bold text-grey-6">
                              Code
                            </Text>
                            <Text className="text-xl font-dm-bold text-enaleia-black">
                              {material.code || "N/A"}
                            </Text>
                          </View>
                          <View className="flex-1 p-4 py-3">
                            <Text className="text-sm font-dm-bold text-grey-6">
                              Weight
                            </Text>
                            <View className="flex-row items-baseline">
                              <Text className="text-xl font-dm-bold text-enaleia-black flex-1">
                                {material.weight || "-"}
                              </Text>
                              <Text className="text-sm text-right font-dm-bold text-grey-6 ml-2">
                                Kg
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Outgoing Materials Section */}
            {item.outgoingMaterials && item.outgoingMaterials.length > 0 && (
              <View className="mb-8">
                <View className="flex-row items-center gap-1 mb-2">
                  <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter">
                    Outgoing
                  </Text>
                  <View style={{ transform: [{ rotateZ: '45deg' }] }}>
                    <Ionicons 
                      name="arrow-up" 
                      size={24} 
                      color="#8E8E93" 
                    />
                  </View>
                </View>
                
                {item.outgoingMaterials.map((material, index) => {
                  const materialData = materialsData?.find(m => m.material_id === material.id);
                  return (
                    <View key={index} className="mb-4">
                      <Text className="text-xl font-dm-bold text-enaleia-black mb-2">
                        {materialData?.material_name || "Unknown Material"}
                      </Text>
                      <View className="border bg-white border-grey-3 rounded-2xl">
                        <View className="flex-row">
                          <View className="flex-1 p-4 py-3 border-r border-grey-3">
                            <Text className="text-sm font-dm-bold text-grey-6">
                              Code
                            </Text>
                            <Text className="text-xl font-dm-bold text-enaleia-black">
                              {material.code || "N/A"}
                            </Text>
                          </View>
                          <View className="flex-1 p-4 py-3">
                            <Text className="text-sm font-dm-bold text-grey-6 flex-1">
                              Weight
                            </Text>
                            <View className="flex-row items-baseline">
                              <Text className="text-xl font-dm-bold text-enaleia-black">
                                {material.weight || "-"}
                              </Text>
                              <Text className="text-sm text-right font-dm-bold text-grey-6 ml-2">
                                Kg
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Manufacturing Section */}
            {currentAction?.name === "Manufacturing" && (
              <View className="mb-8">
                <View className="flex-row items-center gap-1 mb-4">
                  <Text className="text-[20px] font-dm-light text-enaleia-black tracking-tighter">
                    Manufacturing
                  </Text>
                  <Ionicons name="cube-outline" size={24} color="#8E8E93" />
                </View>
                
                <View className="border bg-white border-grey-3 rounded-2xl">
                  <View className="p-4 py-3 border-b border-grey-3">
                    <Text className="text-sm font-dm-bold text-grey-6">
                      Product
                    </Text>
                    <Text className="text-xl font-dm-bold text-enaleia-black">
                      {productsData?.find(p => p.product_id === item.manufacturing?.product)?.product_name || "No product selected"}
                    </Text>
                  </View>

                  <View className="p-4 py-3 border-b border-grey-3">
                    <Text className="text-sm font-dm-bold text-grey-6">
                      Batch Quantity
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-xl font-dm-bold text-enaleia-black flex-1">
                        {item.manufacturing?.quantity || "0"}
                      </Text>
                      <Text className="text-sm text-right font-dm-bold text-grey-6 ml-2">
                        Unit
                      </Text>
                    </View>
                  </View>

                  <View className="p-4 py-3">
                    <Text className="text-sm font-dm-bold text-grey-6">
                      Weight per item
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-xl font-dm-bold text-enaleia-black flex-1">
                        {item.manufacturing?.weightInKg || "0"}
                      </Text>
                      <Text className="text-sm text-right font-dm-bold text-grey-6 ml-2">
                        Kg
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Details Section */}
            <View className="mb-8">
              <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter mb-2">
                    Other details
                  </Text>
              <View className="border bg-white border-grey-3 rounded-2xl">
                <View className="p-4 py-3 border-b border-grey-3">
                  <Text className="text-sm font-dm-bold text-grey-6">
                    Attested by
                  </Text>
                  <Text className="text-base font-dm-bold text-enaleia-black">
                    {user?.email || "N/A"}
                  </Text>
                </View>
                <View className="p-4 py-3 border-b border-grey-3">
                  <Text className="text-sm font-dm-bold text-grey-6">
                    Created date
                  </Text>
                  <Text className="text-base font-dm-bold text-enaleia-black">
                    {formattedTime}
                  </Text>
                </View>
                <View className="p-4 py-3 border-b border-grey-3">
                  <Text className="text-sm font-dm-bold text-grey-6">
                    Action coordinates
                  </Text>
                  <Text className="text-base font-dm-bold text-enaleia-black">
                    {item.location?.coords?.latitude && item.location?.coords?.longitude 
                      ? `${item.location.coords.latitude}, ${item.location.coords.longitude}`
                      : "N/A"}
                  </Text>
                </View>
                <View className="p-4 py-3 border-b border-grey-3">
                  <Text className="text-sm font-dm-bold text-grey-6">
                    Attestation UID
                  </Text>
                  {item.eas?.txHash ? (
                    <View className="flex-row items-center">
                      <Text className="text-base font-dm-bold text-enaleia-black flex-1">
                        {item.eas.txHash}
                      </Text>
                      <Pressable
                        onPress={() => {
                          const txHash = item.eas.txHash;
                          if (txHash) {
                            openWebUrl(EAS_CONSTANTS.getAttestationUrl(txHash));
                          }
                        }}
                        hitSlop={8}
                        className="ml-2"
                      >
                        <Ionicons name="open-outline" size={20} color="#0D0D0D" />
                      </Pressable>
                    </View>
                  ) : (
                    <Text className="text-base font-dm-bold text-enaleia-black">
                      N/A
                    </Text>
                  )}
                </View>
                <View className="p-4 py-3">
                  <Text className="text-sm font-dm-bold text-grey-6">
                    Database event ID
                  </Text>
                  <Text className="text-base font-dm-bold text-enaleia-black">
                    {item.directus?.eventId || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Section */}
            <View className="mb-12">
              <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter mb-2">
                Attestation status
              </Text>
              <View className="border bg-white border-grey-3 rounded-2xl">
                <View className="flex-row justify-between">
                  <View className="flex-1 p-4 py-3 border-r border-grey-3">
                    <ServiceStatusIndicator 
                      status={item.directus?.status || ServiceStatus.PENDING}
                      type="directus"
                      textClassName="text-sm font-dm-medium text-enaleia-black"
                      iconSize={20} 
                    />
                  </View>
                  <View className="flex-1 p-4 py-3 border-r border-grey-3">
                    <ServiceStatusIndicator
                      status={item.eas?.status || ServiceStatus.PENDING}
                      type="eas"
                      textClassName="text-sm font-dm-medium text-enaleia-black"
                      iconSize={20} 
                    />
                  </View>
                  <View className="flex-1 p-4 py-3">
                    <ServiceStatusIndicator
                      status={item.linking?.status || ServiceStatus.PENDING}
                      type="linking"
                      textClassName="text-sm font-dm-medium text-enaleia-black"
                      iconSize={20} 
                    />
                  </View>
                </View>
                {((item.directus?.error || item.eas?.error || (item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked)) || 
                  item.totalRetryCount > 0) && (
                  <View className="border-t border-grey-3 p-4">
                    {(item.directus?.error || item.eas?.error || (item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked)) && (
                      <>
                        <Text className="text-base font-dm-bold text-red-500 mb-2">
                          Error:
                        </Text>
                        {item.directus?.error && (
                          <Text className="text-sm text-red-500 font-dm-regular mb-1">
                            Database: {item.directus.error}
                          </Text>
                        )}
                        {item.eas?.error && (
                          <Text className="text-sm text-red-500 font-dm-regular mb-1">
                            Blockchain: {item.eas.error}
                          </Text>
                        )}
                        {item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked && (
                          <Text className="text-sm text-red-500 font-dm-regular">
                            Linking: Failed to link attestation with database
                          </Text>
                        )}
                      </>
                    )}
                    {item.totalRetryCount > 0 && (
                      <View className={`${(item.directus?.error || item.eas?.error || (item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked)) ? "mt-4" : ""}`}>
                        <Text className="text-base font-dm-bold text-grey-6 mb-2">
                          Retry Information:
                        </Text>
                        <Text className="text-sm text-grey-6 font-dm-regular mb-1">
                          Total Retries: {item.totalRetryCount} of {MAX_RETRIES}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="mt-6 space-y-3">
            {(isCompleted || hasEmailedSupport) && (
                <View className="mt-4">
                  <Pressable
                    onPress={handleClear}
                    className="flex-row items-center justify-center px-4 py-3 rounded-full border border-red-500"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text className="text-center font-dm-bold text-red-500 ml-2">
                      Clear it from device
                    </Text>
                  </Pressable>
                </View>
              )} 
              {canRetry && (
                <Pressable
                  onPress={handleRetry}
                  className="border border-grey-3 py-4 rounded-full flex-row items-center justify-center"
                >
                  <Ionicons name="refresh" size={20} color="#0D0D0D" />
                  <Text className="text-enaleia-black text-center font-dm-bold ml-2">
                    Retry
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={isCompleted ? handleEmail : handleEmailPress}
                className="border border-grey-3 py-4 rounded-full flex-row items-center justify-center"
              >
                <Ionicons name={isCompleted ? "mail-outline" : "help-buoy"} size={20} color="#0D0D0D" />
                <Text className="text-enaleia-black text-center font-dm-bold ml-2">
                  {isCompleted ? "Email data to Enaleia" : "Rescue data"}
                </Text>
              </Pressable>

            
            </View>
          </View>
        )}
      </ScrollView>

      <EmailConfirmationModal
        isVisible={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onProceed={handleEmail}
      />

      <ClearItemConfirmationModal
        isVisible={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClear}
      />
    </SafeAreaContent>
  );
} 