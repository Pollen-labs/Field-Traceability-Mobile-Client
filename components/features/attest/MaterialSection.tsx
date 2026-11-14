// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { useMemo, useRef, useEffect, useState } from "react";
import { Alert, Linking, Pressable, Text, TextInput, View, Platform, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import QRTextInput, { QRTextInputRef } from "@/components/features/scanning/QRTextInput";
import { MaterialDetail, MaterialsData } from "@/types/material";
import AddMaterialModal from "@/components/features/attest/AddMaterialModal";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Modal } from "@/components/shared/Modal";

interface MaterialSectionProps {
  materials: MaterialsData | undefined;
  category: "incoming" | "outgoing";
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  selectedMaterials: MaterialDetail[];
  setSelectedMaterials: (materials: MaterialDetail[]) => void;
  hideCodeInput?: boolean;
  disabled?: boolean;
}

// Add DeleteMaterialModal component
const DeleteMaterialModal = ({
  isVisible,
  onClose,
  onConfirm,
  materialName,
}: {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  materialName: string;
}) => {
  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      className="p-6 bg-white rounded-3xl mx-4"
    >
      <View className="items-center">
        <Text className="text-xl font-dm-bold text-enaleia-black text-center mb-4">
          Delete Material
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black text-center mb-6">
          Are you sure you want to delete {materialName}?
        </Text>
        <View className="flex-row space-x-3 w-full">
          <Pressable
            onPress={onClose}
            className="flex-1 py-3 bg-white border-[1.5px] border-grey-3 rounded-full"
          >
            <Text className="text-base font-dm-bold text-enaleia-black text-center">
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            className="flex-1 py-3 bg-red-500 rounded-full"
          >
            <Text className="text-base font-dm-bold text-white text-center">
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const MaterialSection = ({
  materials,
  category,
  isModalVisible,
  setModalVisible,
  selectedMaterials,
  setSelectedMaterials,
  hideCodeInput = false,
  disabled = false,
}: MaterialSectionProps) => {
  const title = category === "incoming" ? "Incoming" : "Outgoing";
  const icon = category === "incoming" ? "arrow-down" : "arrow-up";
  const { autoScanQR, autoJumpToWeight } = usePreferences();
  const [prevModalVisible, setPrevModalVisible] = useState(isModalVisible);
  const [prevMaterialsLength, setPrevMaterialsLength] = useState(selectedMaterials.length);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<{ index: number; name: string } | null>(null);

  // Local state to manage raw weight input values
  const [localWeightValues, setLocalWeightValues] = useState<{ [key: number]: string }>({});

  // Create refs array for weight inputs
  const weightInputRefs = useRef<Array<TextInput | null>>([]);
  // Create refs array for QR code inputs
  const codeInputRefs = useRef<Array<QRTextInputRef | null>>([]);

  const getMaterialCount = useMemo(() => {
    return (id: number, currentIndex: number) => {
      const count = selectedMaterials.filter(
        (material, index) => material.id === id && index < currentIndex
      ).length;
      return count > 0 ? `(${count + 1})` : "";
    };
  }, [selectedMaterials]);

  // Sync localWeightValues when selectedMaterials change externally
  useEffect(() => {
    const initialWeights: { [key: number]: string } = {};
    selectedMaterials.forEach((material, index) => {
      // Initialize local state only if it doesn't exist or differs
      // Avoid overwriting during active typing
      if (localWeightValues[index] === undefined || 
          parseFloat(localWeightValues[index]) !== material.weight) { 
        initialWeights[index] = material.weight?.toString() || "";
      }
    });
    // Merge with existing local values to preserve inputs being typed
    setLocalWeightValues(prev => ({ ...prev, ...initialWeights }));
  }, [selectedMaterials]); 

  // Effect to detect when modal closes and materials length increases
  useEffect(() => {
    // Check if modal just closed (was visible and now is not)
    const modalJustClosed = prevModalVisible && !isModalVisible;
    // Check if materials were added (length increased)
    const materialsAdded = selectedMaterials.length > prevMaterialsLength;
    
    // If modal just closed AND materials were added, trigger QR scanner
    if (modalJustClosed && materialsAdded && !hideCodeInput && autoScanQR) {
      const lastIndex = selectedMaterials.length - 1;
      const lastMaterial = selectedMaterials[lastIndex];
      
      // Only launch scanner if the code field is empty
      if (!lastMaterial.code) {
        const triggerScanner = async () => {
          try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            if (status === 'granted') {
              // Get the QR input ref for the last added material
              const qrInputRef = codeInputRefs.current[lastIndex];
              if (qrInputRef) {
                qrInputRef.openScanner();
              }
            }
          } catch (error) {
            console.error("Error checking camera permissions:", error);
          }
        };
        
        triggerScanner();
      }
    }
    
    // Update previous state for next comparison
    setPrevModalVisible(isModalVisible);
    setPrevMaterialsLength(selectedMaterials.length);
  }, [isModalVisible, selectedMaterials.length, hideCodeInput, autoScanQR]);

  // Validation function for QR Code
  const validateQRCode = (code: string | undefined): boolean => {
    if (!code) return false; // Cannot be empty
    return /^\d{6}$/.test(code); // Regex for exactly 6 digits
  };

  // Function to handle actions after QR scan completes
  // Now accepts the scanned data directly
  const handleQRScanComplete = (index: number, scannedCode: string) => { 
    // Validate the scannedCode directly
    if (!validateQRCode(scannedCode)) { 
      // Invalid code after scan
      Alert.alert(
        "Invalid Input",
        "QR field accepts 6 digits number only, please review your input.",
        [{ text: "OK" }]
      );
      codeInputRefs.current[index]?.focus(); // Focus QR field
    } else {
      // Valid code, proceed with jump preference
      console.log(`[MaterialSection] Scan valid for index ${index}. Checking autoJumpToWeight: ${autoJumpToWeight}`); // Log preference
      const weightRef = weightInputRefs.current[index];
      console.log(`[MaterialSection] Weight ref for index ${index}:`, weightRef ? 'Exists' : 'MISSING'); // Log ref existence
      
      if (autoJumpToWeight && weightRef) {
        console.log(`[MaterialSection] Attempting to focus weight field for index ${index}`);
        // Use a longer delay for Android to ensure the keyboard appears
        const delay = Platform.OS === 'android' ? 300 : 100;
        
        setTimeout(() => {
          // First focus the input
          weightRef.focus();
          
          if (Platform.OS === 'android') {
            // On Android, use multiple techniques to ensure keyboard appears
            // 1. Set selection to trigger keyboard
            weightRef.setNativeProps({ selection: { start: 0, end: 0 } });
            
            // 2. Force keyboard to appear by simulating a tap
            // This is a common workaround for Android keyboard issues
            const currentValue = localWeightValues[index] || '';
            weightRef.setNativeProps({ text: currentValue + ' ' });
            setTimeout(() => {
              weightRef.setNativeProps({ text: currentValue });
            }, 50);
          }
          
          console.log(`[MaterialSection] focus() called for index ${index} after delay`);
        }, delay);
      } else {
        // If preference off, or ref missing, focus QR field
        console.log(`[MaterialSection] Preference off or ref missing, focusing QR field for index ${index}`);
        codeInputRefs.current[index]?.focus(); 
      }
    }
  };

  const handleDeleteMaterial = (index: number) => {
    const newMaterials = [...selectedMaterials];
    newMaterials.splice(index, 1);
    setSelectedMaterials(newMaterials);
    // Also remove the corresponding local weight state
    setLocalWeightValues(prev => {
      const newState = { ...prev };
      delete newState[index];
      // Adjust keys for subsequent items if needed (or rebuild state)
      const rebuiltState: { [key: number]: string } = {};
      newMaterials.forEach((_, newIndex) => {
         if (newState[newIndex] !== undefined) { // Check if old state exists for this new index
             rebuiltState[newIndex] = newState[newIndex];
         } else if (newState[newIndex + 1] !== undefined) { // Check if old state existed for the *next* index (item shifted)
             rebuiltState[newIndex] = newState[newIndex + 1];
         } else {
             rebuiltState[newIndex] = newMaterials[newIndex].weight?.toString() || ""; // Fallback
         }
      });
      return rebuiltState;
    });
    setMaterialToDelete(null);
  };

  if (!materials) {
    return null;
  }

  return (
    <View>
      <View className="flex-row items-start space-x-1 mb-1">
        <Text className="text-[20px] font-dm-regular text-enaleia-black tracking-tighter">
          {title}
        </Text>
        <View className={category === "incoming" ? "-rotate-45" : "rotate-45"}>
          <Ionicons name={icon} size={24} color="#8E8E93" />
        </View>
      </View>
      <View className="flex-col items-center justify-center">
        {selectedMaterials.length > 0 ? (
          <View className="w-full">
            {selectedMaterials.map((material, index) => (
              <View key={index} className="mb-3">
                <View className="flex-row items-center justify-between w-full mb-1">
                  <Text className="text-base font-dm-bold text-enaleia-black tracking-[-0.5px]">
                    {materials?.idToName?.[material.id] ?? "Unknown Material"}
                    <Text className="text-sm font-dm-regular text-grey-6">
                      {" "}
                      {getMaterialCount(material.id, index)}
                    </Text>
                  </Text>
                  {!disabled && (
                    <View className="h-10 flex-row items-center justify-end">
                      {materialToDelete?.index === index ? (
                        <View className="flex-row items-center gap-1.5">
                          <Pressable
                            onPress={() => setMaterialToDelete(null)}
                            className="px-3 py-1.5 rounded-full bg-white flex-row items-center border border-gray-300"
                          >
                            <Text className="text-sm font-dm-light text-enaleia-black mr-1">Cancel</Text>
                            <View className="w-4 h-4">
                              <Ionicons name="close" size={16} color="#0D0D0D" />
                            </View>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteMaterial(index)}
                            className="px-3 py-1.5 rounded-full bg-red-500 flex-row items-center"
                          >
                            <Text className="text-sm font-dm-light text-white mr-1 px-1">Delete</Text>
                            <View className="w-4 h-4">
                              <Ionicons name="trash-outline" size={16} color="white" />
                            </View>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => setMaterialToDelete({ index, name: materials?.idToName?.[material.id] ?? "Unknown Material" })}
                          className="h-10 w-10 rounded-full flex-row items-center justify-center"
                        >
                          <View className="w-5 h-5">
                            <Ionicons name="trash-outline" size={20} color="#8E8E93" />
                          </View>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
                <View
                  className={`flex-row items-center justify-between w-full rounded-lg`}
                >
                  {!hideCodeInput && (
                    <Pressable
                      className={`flex-1 border-[1.5px] border-grey-3 rounded-l-2xl rounded-r-[1.7px] p-2 px-4 bg-white h-[65px] ${disabled ? 'opacity-50' : ''}`}
                      onPress={async () => {
                        if (disabled) return;
                        try {
                          // First check the current permission status
                          const { status } = await Camera.getCameraPermissionsAsync();
                          
                          if (status === 'granted') {
                            // Permission already granted, open scanner directly
                            setModalVisible(true);
                          } else if (status === 'denied') {
                            // Permission denied, show settings alert
                            console.warn("Camera permission denied.");
                            Alert.alert(
                              "Camera Permission Required",
                              "This permission is required to scan QR codes, Please enable it in settings.",
                              [
                                { text: "Cancel", style: "cancel" },
                                { text: "Settings", onPress: () => Linking.openSettings() }
                              ]
                            );
                          } else if (status === 'undetermined') {
                            // Permission not determined yet, show alert with option to request
                            Alert.alert(
                              "Camera Permission Required",
                              "This app needs camera access to scan QR codes.",
                              [
                                { text: "Cancel", style: "cancel" },
                                { 
                                  text: "OK", 
                                  onPress: async () => {
                                    // User clicked OK, now request permission
                                    const { status: newStatus } = await Camera.requestCameraPermissionsAsync();
                                    if (newStatus === 'granted') {
                                      setModalVisible(true);
                                    }
                                  }
                                }
                              ]
                            );
                          }
                        } catch (error) {
                          console.error("Error checking camera permissions:", error);
                        }
                      }}
                    >
                      <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
                        Code
                      </Text>
                      <QRTextInput
                        ref={(ref) => {
                          if (codeInputRefs.current.length <= index) {
                            codeInputRefs.current = [...codeInputRefs.current, ref];
                          } else {
                            codeInputRefs.current[index] = ref;
                          }
                        }}
                        placeholder=""
                        value={material.code || ""}
                        onChangeText={(text) => {
                          if (disabled) return;
                          // Remove any decimal points (dots or commas) - Keep this?
                          // User wants 6 digits only validation on blur/scan, maybe allow typing non-digits temporarily?
                          // Let's allow typing anything, validation happens on blur/scan.
                          // const cleanedText = text.replace(/[.,]/g, ""); 
                          const newMaterials = [...selectedMaterials];
                          newMaterials[index] = { ...material, code: text }; // Use raw text
                          setSelectedMaterials(newMaterials);
                        }}
                        onScanComplete={(scannedData) => handleQRScanComplete(index, scannedData)}
                        onBlur={() => {
                           // Validate on blur
                          const codeValue = selectedMaterials[index]?.code;
                          // Validate, converting null to undefined
                          if (!validateQRCode(codeValue ?? undefined)) {
                            // Don't alert if field is empty on blur
                            if (codeValue && codeValue.length > 0) { 
                                Alert.alert(
                                  "Invalid Input",
                                  "QR field accepts 6 digits number only, please review your input.",
                                  [{ text: "OK" }]
                                );
                                codeInputRefs.current[index]?.focus(); // Focus QR field
                            }
                          } 
                          // No need to clear field or do anything on valid blur
                        }}
                        keyboardType="number-pad" // Keep as number-pad
                        editable={!disabled}
                        id={`material-${category}-${index}`}
                      />
                    </Pressable>
                  )}
                  <Pressable
                    className={`border-[1.5px] border-grey-3 h-[65px] ${
                      !hideCodeInput
                        ? "flex-[1] border-l-0 rounded-r-2xl"
                        : "flex-1 rounded-2xl"
                    } p-2 px-4 bg-white ${disabled ? 'opacity-50' : ''}`}
                    onPress={() => {
                      if (disabled) return;
                      // Focus the weight input when its container is tapped
                      if (weightInputRefs.current[index]) {
                        weightInputRefs.current[index]?.focus();
                      }
                    }}
                  >
                    <Text className="w-full text-sm font-dm-bold text-grey-6 tracking-tighter text-left">
                      Weight
                    </Text>
                    <View className="flex-row items-center">
                      <TextInput
                        ref={(ref) => {
                          // Store ref in the array
                          if (weightInputRefs.current.length <= index) {
                            weightInputRefs.current = [
                              ...weightInputRefs.current,
                              ref,
                            ];
                          } else {
                            weightInputRefs.current[index] = ref;
                          }
                        }}
                        value={localWeightValues[index] ?? ""} // Use local state for value
                        style={{
                          textAlign: "left",
                          direction: "ltr",
                        }}
                        className="flex-1 h-[28px] py-0 font-dm-bold tracking-tighter text-enaleia-black text-xl text-left"
                        onChangeText={(text) => {
                          if (disabled) return;
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
                              "Warning: Weight cannot be above 65536, please review your input."
                            );
                            return;
                          }
                          
                          // Update local state immediately for display
                          setLocalWeightValues(prev => ({ ...prev, [index]: cleanedValue }));

                          // Also parse and update the main state immediately
                          let finalWeight: number | null = null;
                          if (cleanedValue) {
                              const parsedValue = parseFloat(cleanedValue);
                              if (!isNaN(parsedValue)) {
                                finalWeight = parsedValue;
                              }
                          }
                          
                          if (selectedMaterials[index]?.weight !== finalWeight) {
                              const newMaterials = [...selectedMaterials];
                              if (newMaterials[index]) {
                                  newMaterials[index] = {
                                    ...newMaterials[index],
                                    weight: finalWeight,
                                  };
                                  setSelectedMaterials(newMaterials);
                              }
                          }
                        }}
                        onBlur={() => {
                          // Round the value when the field loses focus
                          const currentValue = localWeightValues[index];
                          if (currentValue) {
                            const roundedValue = Math.round(parseFloat(currentValue));
                            setLocalWeightValues(prev => ({ ...prev, [index]: roundedValue.toString() }));
                            
                            const newMaterials = [...selectedMaterials];
                            if (newMaterials[index]) {
                              newMaterials[index] = {
                                ...newMaterials[index],
                                weight: roundedValue,
                              };
                              setSelectedMaterials(newMaterials);
                            }
                          }
                        }}
                        keyboardType="number-pad"
                        editable={!disabled}
                      />
                      <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter text-right self-end pl-1">
                        kg
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {!disabled && (
        <Pressable
          className={`flex-row items-center justify-center mt-2 bg-white px-3 py-1 rounded-full border-[1.5px] border-grey-3 ${disabled ? 'opacity-50' : ''}`}
          onPress={() => {
            if (disabled) return;
            setModalVisible(true);
          }}
        >
          <Ionicons name="add-outline" size={24} color="grey-8" />
          <Text className="text-sm font-dm-bold text-slate-600 tracking-tight color-grey-8">
            Add material
          </Text>
        </Pressable>
      )}
      <DeleteMaterialModal
        isVisible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setMaterialToDelete(null);
        }}
        onConfirm={() => {
          if (materialToDelete !== null) {
            const newMaterials = [...selectedMaterials];
            newMaterials.splice(materialToDelete.index, 1);
            setSelectedMaterials(newMaterials);
          }
          setDeleteModalVisible(false);
          setMaterialToDelete(null);
        }}
        materialName={materialToDelete?.name ?? ""}
      />
      <AddMaterialModal
        materials={materials?.options ?? []}
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        selectedMaterials={selectedMaterials}
        setSelectedMaterials={setSelectedMaterials}
      />
    </View>
  );
};

export default MaterialSection;