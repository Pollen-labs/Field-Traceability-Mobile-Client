import React from 'react';
import { IncompleteAttestationModal } from "@/components/features/attest/IncompleteAttestationModal";
import { LeaveAttestationModal } from "@/components/features/attest/LeaveAttestationModal";
import MaterialSection from "@/components/features/attest/MaterialSection";
import { SubmitConfirmationModal } from "@/components/features/attest/SubmitConfirmationModal";

import { BatchHelpModal } from "@/components/features/help/BatchHelpModal";
import { CollectionHelpModal } from "@/components/features/help/CollectionHelpModal";
import { ManufacturingHelpModal } from "@/components/features/help/ManufacturingHelpModal";
import { PelletizingHelpModal } from "@/components/features/help/PelletizingHelpModal";
import { ShreddingHelpModal } from "@/components/features/help/ShreddingHelpModal";
import { SortingHelpModal } from "@/components/features/help/SortingHelpModal";
import { WashingHelpModal } from "@/components/features/help/WashingHelpModal";

import { LocationPermissionHandler } from "@/components/features/location/LocationPermissionHandler";
import QRTextInput from "@/components/features/scanning/QRTextInput";
import DecimalInput from "@/components/shared/DecimalInput";

import SafeAreaContent from "@/components/shared/SafeAreaContent";
import SelectField from "@/components/shared/SelectField";
import PortSelector from "@/components/features/attest/PortSelector";
import { ACTION_SLUGS } from "@/constants/action";
import { useQueue } from "@/contexts/QueueContext";
import { useBatchData } from "@/hooks/data/useBatchData";
import { useUserInfo } from "@/hooks/data/useUserInfo";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

import { LocationSchema } from "@/services/locationService";
import { ActionTitle } from "@/types/action";
import { MaterialDetail, processMaterials } from "@/types/material";
import { QueueItem, QueueItemStatus, ServiceStatus } from "@/types/queue";
import { getActiveQueue, getCompletedQueue } from "@/utils/queueStorage";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  GestureResponderEvent,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  Alert,
} from "react-native";
import uuid from "react-native-uuid";
import { z } from "zod";

const ATTEST_FORM_KEY = "attest_form_state";
// Save state to AsyncStorage
const saveFormState = async (state: EventFormType) => {
  try {
    await AsyncStorage.setItem(ATTEST_FORM_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving form state:", error);
  }
};

// Load state from AsyncStorage
const loadFormState = async () => {
  try {
    const savedState = await AsyncStorage.getItem(ATTEST_FORM_KEY);
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.error("Error loading form state:", error);
    return null;
  }
};

// Delete state from AsyncStorage
const deleteFormState = async () => {
  try {
    await AsyncStorage.removeItem(ATTEST_FORM_KEY);
  } catch (error) {
    console.error("Error deleting form state:", error);
  }
};

const eventFormSchema = z.object({
  type: z
    .string()
    .refine((value) => Object.keys(ACTION_SLUGS).includes(value), {
      message: "Please select an action that exists",
    }) as z.ZodType<ActionTitle>,
  date: z.string().min(1),
  location: LocationSchema.optional(),
  collectorId: z.string().optional(),
  incomingMaterials: z
    .array(
      z
        .object({
          id: z.number(),
          weight: z
            .number()
            .nullable()
            .refine((value) => value === null || value >= 0, {
              message: "Weight must be greater than or equal to 0",
            }),
          code: z.string().min(0).optional(),
        })
        .optional()
    )
    .optional() as z.ZodType<MaterialDetail[]>,
  outgoingMaterials: z
    .array(
      z
        .object({
          id: z.number(),
          weight: z
            .number()
            .nullable()
            .refine((value) => value === null || value >= 0, {
              message: "Weight must be greater than or equal to 0",
            }),
          code: z.string().min(0).optional(),
        })
        .optional()
    )
    .optional() as z.ZodType<MaterialDetail[]>,
  manufacturing: z
    .object({
      weightInKg: z.number().min(0).optional(),
      quantity: z.number().min(0).optional(),
      product: z.number().min(0).optional(),
    })
    .optional(),
  selectedPortId: z.number().optional(),
});

export type EventFormType = z.infer<typeof eventFormSchema>;

const NewActionScreen = () => {
  const { slug } = useLocalSearchParams(); // slug format
  const location = useCurrentLocation();
  const { data: userData } = useUserInfo();
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const { updateQueueItems } = useQueue();
  const { data: locationData, isLoading: locationLoading } =
    useCurrentLocation();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isSentToQueue, setIsSentToQueue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isTypeInformationModalVisible, setIsTypeInformationModalVisible] =
    useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [
    isIncomingMaterialsPickerVisible,
    setIsIncomingMaterialsPickerVisible,
  ] = useState(false);
  const [
    isOutgoingMaterialsPickerVisible,
    setIsOutgoingMaterialsPickerVisible,
  ] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [pendingValidation, setPendingValidation] = useState(false);
  const [collectorIdValue, setCollectorIdValue] = useState("");

  const {
    materials: materialsData,
    materialOptions,
    products: productsData,
    actions: actionsData,
    collectors: collectorsData,
    ports: portsData,
  } = useBatchData();

  const processedMaterials = useMemo(() => {
    if (!materialsData) return undefined;
    return processMaterials(materialsData);
  }, [materialsData]);

  const currentAction = useMemo(() => {
    if (!actionsData?.length || !slug) return undefined;

    const matchingAction = actionsData.find((action) => action.slug === slug);

    if (!matchingAction) {
      console.warn(`No action found for slug: ${slug}`);
    }
    return matchingAction;
  }, [actionsData, slug]);

  // Clear form state when entering new form
  useEffect(() => {
    deleteFormState();
  }, []);

  const form = useForm({
    defaultValues: {
      type: currentAction?.name as ActionTitle,
      date: new Date().toISOString(),
      location: undefined,
      collectorId: "",
      incomingMaterials: [] as MaterialDetail[],
      outgoingMaterials: [] as MaterialDetail[],
      manufacturing: {
        product: undefined,
        quantity: undefined,
        weightInKg: undefined,
      },
      selectedPortId: undefined as number | undefined,
    },
    onSubmit: async ({ value }) => {
      setHasAttemptedSubmit(true);
      setSubmitError(null);

      try {
        const runtimeSchema = eventFormSchema.refine(
          (data) => {
            return true;
          },
          {
            message: "Collector ID is required for Collection actions",
            path: ["collectorId"],
          }
        );

        const { success: isValid, error: validationError } = runtimeSchema.safeParse(value);
        if (!isValid) {
          validationError.errors.forEach((error) => {
            const fieldPath = error.path.join(".") as any;
            form.setFieldMeta(fieldPath, (old: any) => ({
              ...old,
              errors: [...(old?.errors || []), error.message],
            }));
          });

          setSubmitError("Please fill in all required fields");
          console.error("Form validation errors:", validationError);
          return;
        }

        const actionId = currentAction?.id;

        if (!actionId) {
          throw new Error("Could not find matching action ID");
        }

        // Extract only the form fields we need
        const formData = {
          type: value.type,
          date: new Date().toISOString(),
          location: value.location,
          collectorId: value.collectorId,
          incomingMaterials: value.incomingMaterials || [],
          outgoingMaterials: value.outgoingMaterials || [],
          manufacturing: value.manufacturing,
        };

        const queueItem: QueueItem = {
          ...formData,
          actionId,
          actionName: currentAction.name,
          localId: uuid.v4() as string,
          status: QueueItemStatus.PENDING,
          totalRetryCount: 0,
          directus: {
            status: ServiceStatus.INCOMPLETE
          },
          eas: {
            status: ServiceStatus.INCOMPLETE
          },
          linking: {
            status: ServiceStatus.INCOMPLETE
          },
          company:
            typeof userData?.Company === "number"
              ? undefined
              : userData?.Company?.id,
          selectedPort: currentAction?.category === "Collection" && value.selectedPortId
            ? (() => {
                const port = portsData?.find((p) => p.id === value.selectedPortId);
                return port
                  ? { id: port.id, name: port.name, coordinates: port.coordinates ?? "" }
                  : undefined;
              })()
            : undefined,
        };

        await addItemToQueue(queueItem);
        setSubmitError(null);
        
        // Clear form state immediately after successful submission
        await deleteFormState();
        
        // Reset form to default values
        form.reset();
      } catch (error) {
        const errorMsg =
          error instanceof Error && error.message.includes("Cache key")
            ? "Unable to access queue storage. Please try again or contact support"
            : "Failed to add action to queue. Please try again or contact support";
        setSubmitError(errorMsg);
        console.error("Error adding to queue:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (locationData) {
      form.setFieldValue("location" as any, locationData as any);
    }
  }, [locationData]);

  useEffect(() => {
    if (currentAction?.category !== "Collection") return;
    if (!collectorIdValue || !collectorsData?.length || !portsData?.length) return;
    const collector = collectorsData.find(
      (c) => c.collector_identity === collectorIdValue
    );
    if (collector?.registered_port) {
      const port = portsData.find((p) => p.id === collector.registered_port);
      if (port) {
        form.setFieldValue("selectedPortId", port.id);
      }
    }
  }, [collectorIdValue, currentAction?.category, collectorsData, portsData]);

  // Reinstate useEffect to disable iOS swipe gesture
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      navigation.setOptions({
        gestureEnabled: false,
      });
    });

    return unsubscribe;
  }, [navigation]);

  // Add effect to disable Android hardware back button
  useEffect(() => {
    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Returning true prevents the default back button action
        return true;
      }
    );

    // Clean up the subscription when the component unmounts
    return () => backHandlerSubscription.remove();
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  // Remove the auto-save effect to prevent race conditions
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        // Clear form state when app becomes active
        deleteFormState();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
      // Clear form state on unmount
      deleteFormState();
    };
  }, []);

  // Handle back navigation
  useEffect(() => {
    if (saveTimeoutRef?.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    return () => {
      if (saveTimeoutRef?.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [navigation]);

  const hasAnyMaterials = (values: EventFormType | boolean | null | undefined) => {
    // Initial check for invalid input types (related to linter errors)
    if (!values || typeof values === 'boolean') return false; // Restored check

    const incomingMaterials = values.incomingMaterials || [];
    const outgoingMaterials = values.outgoingMaterials || [];

    // Logic for all actions (including Manufacturing): check if any materials are present
    return incomingMaterials.length > 0 || outgoingMaterials.length > 0;
  };

  // Add validation for manufacturing form
  const isManufacturingFormValid = (values: EventFormType | boolean | null | undefined): boolean => {
    if (!values || typeof values === 'boolean') return false; // Restored check
    return Boolean(values.manufacturing?.product && values.manufacturing.product > 0);
  };

  if (!actionsData?.length) return null;
  if (!currentAction) {
    console.warn("No matching action found for:", slug);
    return null;
  }

  const validateMaterials = (
    incomingMaterials: MaterialDetail[],
    outgoingMaterials: MaterialDetail[],
    currentActionName: string | undefined,
    isManufacturing: boolean = false,
    manufacturingData?: { quantity?: number | undefined; weightInKg?: number | undefined }
  ): boolean => {
    const collectorActionsWithHiddenQR = [
      "Fishing for litter",
      "Prevention",
      "Ad-hoc",
      "Beach cleanup",
    ];
    const isCollectorAction = currentActionName ? collectorActionsWithHiddenQR.includes(currentActionName) : false;

    // Check if any materials are provided
    if (incomingMaterials.length === 0 && outgoingMaterials.length === 0) {
      return false;
    }

    // --- Incoming Materials Validation ---
    const hasInvalidIncoming = incomingMaterials.some(material => {
      const isWeightMissing = !material.weight || material.weight <= 0;
      // For collector actions without outgoing materials, only check weight
      if (isCollectorAction && outgoingMaterials.length === 0) {
        return isWeightMissing;
      }
      // Otherwise (or for non-collector actions), check both code and weight
      const isCodeMissing = !material.code || material.code.trim() === "";
      return isCodeMissing || isWeightMissing;
    });

    if (hasInvalidIncoming) return false;

    // --- Outgoing Materials Validation ---
    const hasInvalidOutgoing = outgoingMaterials.some(
      (material) =>
        !material.code || material.code.trim() === "" ||
        !material.weight || material.weight <= 0
    );

    if (hasInvalidOutgoing) return false;

    // --- Manufacturing Validation ---
    if (isManufacturing) {
      const hasMissingManufacturingDetails =
        !manufacturingData?.quantity ||
        manufacturingData.quantity <= 0 ||
        !manufacturingData?.weightInKg ||
        manufacturingData.weightInKg <= 0;
      if (hasMissingManufacturingDetails) return false;
    }

    // All checks passed
    return true;
  };

  const addItemToQueue = async (queueItem: QueueItem) => {
    try {
      const activeItems = (await getActiveQueue()) || [];
      const updatedItems = [...activeItems, queueItem];

      // Process queue in background after navigation
      setTimeout(() => {
        updateQueueItems(updatedItems).catch(error => {
          console.error("Background queue processing error:", error);
        });
      }, 500);

    } catch (error) {
      console.error("Error in addItemToQueue:", error);
      throw error;
    }
  };

  const handleProceedWithSubmission = async () => {
    try {
      // Show loading state
      setIsSubmitting(true);

      // Submit form and create queue item
      await form.handleSubmit();

    } catch (error) {
      // Just log the error, queue page will show appropriate status
      console.error("Submission error:", error);
    } finally {
      // Always close modal and navigate to queue
      setShowSubmitConfirmation(false);
      router.push("/queue");
    }
  };

  return (
    <SafeAreaContent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        contentContainerStyle={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Account for header + status bar
      >
        {/* <View className="absolute top-20 right-[-30px] bg-white-sand opacity-60">
          <Image
            source={require("@/assets/images/animals/Turtle.png")}
            className="w-[223px] h-[228px]"
            accessibilityLabel="Decorative turtle illustration"
            accessibilityRole="image"
          />
        </View> */}
        <View className="flex-row items-center justify-between pb-4">
          <form.Subscribe selector={(state) => state.values}>
            {(values) => {
              const hasChanges = 
                values.incomingMaterials?.length > 0 ||
                values.outgoingMaterials?.length > 0 ||
                values.collectorId !== "" ||
                values.manufacturing?.product !== undefined ||
                values.manufacturing?.quantity !== undefined ||
                values.manufacturing?.weightInKg !== undefined;
              
              return (
                <Pressable
                  onPress={() => {
                    if (hasChanges) {
                      setShowLeaveModal(true);
                    } else {
                      if (saveTimeoutRef?.current) {
                        clearTimeout(saveTimeoutRef.current);
                      }
                      deleteFormState();
                      router.back();
                    }
                  }}
                  className="flex-row items-center space-x-1"
                >
                  <Ionicons name="chevron-back" size={24} color={isSubmitting ? "#8E8E93" : "#0D0D0D"} />
                  <Text className={`text-base font-dm-regular tracking-tighter ${isSubmitting ? 'text-grey-6' : 'text-enaleia-black'}`}>
                    Home
                  </Text>
                </Pressable>
              );
            }}
          </form.Subscribe>

          <Pressable onPress={() => setIsTypeInformationModalVisible(true)}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#0D0D0D"
            />
          </Pressable>
        </View>
        {currentAction?.name === "Batch" ? (
          <BatchHelpModal
            isVisible={isTypeInformationModalVisible}
            onClose={() => setIsTypeInformationModalVisible(false)}
          />
        ) : currentAction?.name === "Fishing for litter" ||
          currentAction?.name === "Prevention" ||
          currentAction?.name === "Beach cleanup" ||
          currentAction?.name === "Ad-hoc" ? (
          <CollectionHelpModal
            isVisible={isTypeInformationModalVisible}
            onClose={() => setIsTypeInformationModalVisible(false)}
          />
        ) : currentAction?.name === "Manufacturing" ? (
          <ManufacturingHelpModal
            isVisible={isTypeInformationModalVisible}
            onClose={() => setIsTypeInformationModalVisible(false)}
          />
        ) : currentAction?.name === "Pelletizing" ? (
          <PelletizingHelpModal
            isVisible={isTypeInformationModalVisible}
            onClose={() => setIsTypeInformationModalVisible(false)}
          />
        ) : currentAction?.name === "Shredding" ? (
          <ShreddingHelpModal
            isVisible={isTypeInformationModalVisible}
            onClose={() => setIsTypeInformationModalVisible(false)}
          />
        ) : currentAction?.name === "Sorting" ? (
          <SortingHelpModal
            isVisible={isTypeInformationModalVisible}
            onClose={() => setIsTypeInformationModalVisible(false)}
          />
        ) : currentAction?.name === "Washing" ? (
          <WashingHelpModal
            isVisible={isTypeInformationModalVisible}
            onClose={() => setIsTypeInformationModalVisible(false)}
          />
        ) : null}

        <View className="flex-1">
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
              flexGrow: 0,
              paddingBottom: 100,
            }}
          >
            <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
              {currentAction?.name}
            </Text>
            <View className="flex-1">
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <View className="mb-2 mt-4">
                    <LocationPermissionHandler
                      onPermissionGranted={() => {
                        // Location will be automatically updated via the effect
                      }}
                      onPermissionDenied={() => {
                        // Alert.alert(
                        //   "Location Access",
                        //   "Location helps verify where events take place. You can still use saved locations or change this later in settings."
                        // );
                      }}
                    />
                  </View>
                )}
              </form.Subscribe>

              {currentAction?.category === "Collection" && (
                <View className="mb-12">
                  <Text className="text-[18px] font-dm-regular text-enaleia-black tracking-tighter mb-2">
                    Collector
                  </Text>
                  <form.Field name="collectorId">
                    {(field) => (
                      <>
                        <QRTextInput
                          value={field.state.value || ""}
                          onChangeText={(text: string) => {
                            setCollectorIdValue(text);
                            field.handleChange(text);
                          }}
                          variant="standalone"
                          label="Collector ID Card"
                          keyboardType="default"
                          error={field.state.meta.errors?.[0] || undefined}
                        />
                      </>
                    )}
                  </form.Field>

                  <View className="mt-4">
                    <Text className="text-[18px] font-dm-regular text-enaleia-black tracking-tighter mb-2">
                      Collected at
                    </Text>
                    <form.Field name="selectedPortId">
                      {(field) => (
                        <PortSelector
                          value={field.state.value as number | undefined}
                          onChange={(value: number) => field.handleChange(value)}
                          ports={portsData || []}
                          countryIds={
                            userData?.Country_assign?.map(
                              (c) => c.countries_country_id.country_id
                            ) ?? []
                          }
                        />
                      )}
                    </form.Field>
                  </View>
                </View>
              )}
              <form.Field name="incomingMaterials">
                {(field) => (
                  <View className="mb-8">
                    <MaterialSection
                      materials={processedMaterials}
                      category="incoming"
                      isModalVisible={isIncomingMaterialsPickerVisible}
                      setModalVisible={setIsIncomingMaterialsPickerVisible}
                      selectedMaterials={field.state.value as MaterialDetail[]}
                      setSelectedMaterials={(materials: MaterialDetail[]) =>
                        field.handleChange(materials)
                      }
                      hideCodeInput={currentAction?.category === "Collection"}
                    />
                  </View>
                )}
              </form.Field>
              {currentAction?.name !== "Manufacturing" && (
                <form.Field name="outgoingMaterials">
                  {(field) => (
                    <View className="mb-8 mt-8">
                      <MaterialSection
                        materials={processedMaterials}
                        category="outgoing"
                        isModalVisible={isOutgoingMaterialsPickerVisible}
                        setModalVisible={setIsOutgoingMaterialsPickerVisible}
                        selectedMaterials={field.state.value as MaterialDetail[]}
                        setSelectedMaterials={(materials: MaterialDetail[]) =>
                          field.handleChange(materials)
                        }
                        hideCodeInput={false}
                      />
                    </View>
                  )}
                </form.Field>
              )}

              {currentAction?.name === "Manufacturing" && (
                <View className="mt-4">
                  <View className="flex-row items-center mb-4">
                    <Text className="text-xl font-dm-regular text-enaleia-black tracking-tighter">
                      Manufacturing information
                    </Text>
                    <View className="ml-2">
                      <Ionicons name="cube-outline" size={24} color="#8E8E93" />
                    </View>
                  </View>

                  <View className="gap-2">
                    <form.Field name={"manufacturing.product" as any}>
                      {(field) => {
                        const ProductField = () => (
                          <SelectField
                            value={field.state.value as number | undefined}
                            onChange={(value) => field.handleChange(value as any)}
                            options={
                              productsData?.map((product) => ({
                                label: product.product_name || "Unknown Product",
                                value: product.product_id,
                                type: product.manufactured_by?.name || "Other"
                              })) || []
                            }
                            placeholder="Product"
                            isLoading={!productsData}
                            disabled={!productsData}
                          />
                        );
                        return <ProductField />;
                      }}
                    </form.Field>

                    <form.Field name={"manufacturing.quantity" as any}>
                      {(field) => {
                        const QuantityField = () => (
                          <DecimalInput
                            field={field as any}
                            label="Batch Quantity"
                            placeholder=""
                            allowDecimals={false}
                            suffix="Unit"
                          />
                        );
                        return <QuantityField />;
                      }}
                    </form.Field>

                    <form.Field name={"manufacturing.weightInKg" as any}>
                      {(field) => {
                        const WeightField = () => (
                          <DecimalInput
                            field={field as any}
                            label="Weight per item"
                            placeholder=""
                            suffix="kg"
                          />
                        );
                        return <WeightField />;
                      }}
                    </form.Field>
                  </View>
                </View>
              )}
            </View>
            <View className="pt-3">
              <form.Subscribe
                selector={(state) => [
                  state.canSubmit,
                  state.isSubmitting,
                  state.values,
                ]}
              >
                {([canSubmit, isSubmitting, values]: any) => {
                  // Type guard to ensure values is the correct shape before proceeding
                  if (typeof values !== 'object' || values === null || Array.isArray(values)) {
                    // Render nothing or a placeholder if values is not the expected object
                    return null; 
                  }

                  const handleSubmitClick = (e: GestureResponderEvent) => {
                    // Prevent submission if button is disabled
                    if (isSubmitDisabled) return;

                    setSubmitError(null);
                    e.preventDefault();
                    e.stopPropagation();

                    const incomingMaterials = values.incomingMaterials || [];
                    const outgoingMaterials = values.outgoingMaterials || [];
                    const isManufacturing = currentAction?.name === "Manufacturing";
                    const currentActionName = currentAction?.name; // Get current action name

                    // Check if manufacturing form is valid when needed
                    if (isManufacturing && !isManufacturingFormValid(values)) {
                      Alert.alert(
                        "Product Required",
                        "Please select a product before submitting the manufacturing attestation.",
                        [{ text: "OK" }]
                      );
                      return;
                    }

                    // Show incomplete modal if validation fails
                    const isValid = validateMaterials(
                      incomingMaterials, // Pass incoming list
                      outgoingMaterials, // Pass outgoing list
                      currentActionName, // Pass action name
                      isManufacturing,
                      isManufacturing ? values.manufacturing : undefined
                    );

                    if (!isValid) {
                      setShowIncompleteModal(true);
                      return;
                    }

                    // If validation passes, show the confirmation modal
                    setShowSubmitConfirmation(true);
                  };

                  // Update the submit button disabled state
                  const isValidValuesObject = typeof values === 'object' && values !== null && !Array.isArray(values);
                  const hasMaterials = isValidValuesObject && hasAnyMaterials(values);
                  const isMfgFormValid = isValidValuesObject && isManufacturingFormValid(values);

                  const isSubmitDisabled = !canSubmit ||
                    isSubmitting ||
                    !hasMaterials ||
                    (currentAction?.name === "Manufacturing" && !isMfgFormValid);

                  return (
                    <>
                      <Pressable
                        onPress={handleSubmitClick}
                        disabled={isSubmitDisabled}
                        className={`w-full flex-row items-center justify-center p-0 h-[60px] rounded-full ${
                          isSubmitDisabled
                            ? "bg-primary-dark-blue opacity-50"
                            : "bg-blue-ocean"
                        }`}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="white" className="mr-2" />
                        ) : null}
                        <Text className="text-lg font-dm-medium text-slate-50 tracking-tight">
                          {isSubmitting ? "Preparing..." : "Submit Attestation"}
                        </Text>
                      </Pressable>

                      <SubmitConfirmationModal
                        isVisible={showSubmitConfirmation}
                        onClose={() => setShowSubmitConfirmation(false)}
                        onProceed={handleProceedWithSubmission}
                        isSubmitting={isSubmitting}
                      />

                      <IncompleteAttestationModal
                        isVisible={showIncompleteModal}
                        onClose={() => setShowIncompleteModal(false)}
                        onSubmitAnyway={() => {
                          setShowIncompleteModal(false);
                          setShowSubmitConfirmation(true);
                        }}
                      />
                    </>
                  );
                }}
              </form.Subscribe>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <LeaveAttestationModal
        isVisible={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirmLeave={() => {
          // Clean up timeout, remove state from storage
          if (saveTimeoutRef?.current) {
            clearTimeout(saveTimeoutRef.current);
          }
          deleteFormState();
          setShowLeaveModal(false);
          router.back();
        }}
      />
    </SafeAreaContent>
  );
};

export default NewActionScreen;
