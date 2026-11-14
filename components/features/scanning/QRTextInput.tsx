// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import QRCodeScanner from "@/components/features/scanning/QRCodeScanner";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import React, {
  useCallback,
  useReducer,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Alert, Linking, Modal, Pressable, Text, TextInput, View } from "react-native";

interface QRTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  variant?: "standalone" | "embedded";
  label?: string;
  error?: string;
  editable?: boolean;
  onScanComplete?: (scannedData: string) => void;
  keyboardType?: "default" | "numeric" | "number-pad";
  onBlur?: () => void;
}

export interface QRTextInputRef {
  focus: () => void;
  blur: () => void;
  openScanner: () => void;
}

const scannerReducer = (state: any, action: any) => {
  switch (action.type) {
    case "SET_SCANNER":
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          isVisible: action.payload.isVisible,
        },
      };
    case "SET_ERROR":
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          error: action.payload.error,
        },
      };
    default:
      return state;
  }
};

const QRTextInput = forwardRef<QRTextInputRef, QRTextInputProps>(
  (
    {
      value,
      onChangeText,
      placeholder = "",
      className = "",
      id = "default",
      variant = "embedded",
      label,
      error,
      editable = true,
      onScanComplete,
      keyboardType = variant === "embedded" ? "numeric" : "default",
      onBlur,
    },
    ref
  ) => {
    const [scannerStates, dispatch] = useReducer(scannerReducer, {});
    const inputRef = React.useRef<TextInput>(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      blur: () => {
        inputRef.current?.blur();
      },
      openScanner: async () => {
        try {
          // First check the current permission status
          const { status } = await Camera.getCameraPermissionsAsync();
          
          if (status === 'granted') {
            // Permission already granted, open scanner directly
            setScanner(true);
          } else if (status === 'denied') {
            // Permission denied, show settings alert
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
                      setScanner(true);
                    }
                  }
                }
              ]
            );
          }
        } catch (error) {
          console.error("Error checking camera permissions:", error);
        }
      }
    }));

    const currentState = scannerStates[id] || { isVisible: false, error: null };
    console.log(`[QRTextInput ${id}] Render - isVisible: ${currentState.isVisible}`);

    const setScanner = (isVisible: boolean) => {
      console.log(`[QRTextInput ${id}] setScanner called with: ${isVisible}`);
      dispatch({
        type: "SET_SCANNER",
        payload: {
          id,
          isVisible,
        },
      });
    };

    const setError = (error: string | null) => {
      dispatch({
        type: "SET_ERROR",
        payload: {
          id,
          error,
        },
      });
    };

    const handleQRScan = useCallback(
      (scannedData: unknown) => {
        try {
          let textValue: string;

          if (typeof scannedData === "string") {
            textValue = scannedData;
          } else if (
            scannedData &&
            typeof scannedData === "object" &&
            "data" in scannedData
          ) {
            textValue = String(scannedData.data);
          } else {
            throw new Error("Invalid QR code data format");
          }

          if (!textValue.trim()) {
            throw new Error("QR code data is empty");
          }

          onChangeText(textValue.trim());
          setError(null);
          setScanner(false);
          onScanComplete?.(textValue.trim());
        } catch (error) {
          dispatch({
            type: "SET_ERROR",
            payload: {
              id,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to process QR code",
            },
          });
        }
      },
      [id, onChangeText, onScanComplete]
    );

    // Log when the modal visibility *actually* changes based on state
    useEffect(() => {
      console.log(`[QRTextInput ${id}] Modal visibility state changed to: ${currentState.isVisible}`);
    }, [currentState.isVisible, id]);

    const containerClass =
      variant === "standalone"
        ? "h-[65px] border-[1.5px] border-grey-3 rounded-2xl px-4 py-2 bg-white"
        : "";

    const inputClass =
      variant === "standalone"
        ? "overflow-hidden my-0 py-0 font-dm-bold tracking-tighter text-xl text-enaleia-black items-center h-[26px]"
        : "w-[100px] h-[26px] overflow-hidden my-0 py-0 font-dm-bold tracking-tighter text-xl items-center";

    return (
      <View className={containerClass}>
        {/* Log props to see if value updates correctly */}
        {/* console.log(`[QRTextInput ${id}] Value prop: ${value}`) */}
        {variant === "standalone" && label && (
          <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
            {label}
          </Text>
        )}
        <View className="relative flex-row items-center gap-2">
          <View className="flex-1">
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={(text) => {
                // For collector ID field (variant === "standalone")
                if (variant === "standalone") {
                  // Check for special characters
                  if (/[^a-zA-Z0-9]/.test(text)) {
                    Alert.alert(
                      "Invalid Input",
                      "Warning: Collector ID Field does not accept special characters, Please review your input."
                    );
                    return;
                  }
                }
                onChangeText(text);
              }}
              autoCapitalize="characters"
              placeholder={placeholder}
              accessibilityLabel={placeholder}
              accessibilityRole="text"
              accessibilityState={{
                selected: !!value,
                disabled: !editable,
              }}
              accessibilityHint="Enter text or tap QR code button to scan"
              className={`${inputClass} ${className} ${error ? 'border-red-500' : 'border-gray-300'}`}
              style={{
                textAlignVertical: "center", // Ensures text is vertically centered (Android)
                paddingVertical: 0, // Removes default iOS padding
                lineHeight: 26, // Ensures proper line height consistency
              }}
              keyboardType={keyboardType}
              editable={editable}
              onBlur={onBlur}
            />
          </View>
          <View className="w-6 h-6 justify-center items-center">
            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={async () => {
                if (!editable) return;
                try {
                  const { status } = await Camera.requestCameraPermissionsAsync();
   
                  if (status === 'granted') {
                    console.log(`[QRTextInput ${id}] Permission granted, calling setScanner(true)`);
                    setScanner(true); // Open QR scanner
                  } else {
                    console.warn("Camera permission denied.");
                    Alert.alert(
                      "QR Code scanning",
                      "Access to the camera is required to scan QR codes, Please toggle on the camera access it in settings.",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Settings", style: "default", onPress: () => Linking.openSettings() }
                      ]
                    );
                  }
                } catch (error) {
                  console.error("Error requesting camera permissions:", error);
                }
              }}
              className="active:scale-75 transition-transform"
              accessibilityRole="button"
              accessibilityLabel="Open QR scanner"
              accessibilityHint="Double tap to open QR code scanner"
            >
              <Ionicons name="qr-code-outline" size={24} color="#8E8E93" />
            </Pressable>
          </View>
        </View>

        {currentState.error && (
          <Text className="text-red-500 text-sm mt-1">
            {currentState.error}
          </Text>
        )}

        <Modal
          visible={currentState.isVisible}
          animationType="fade"
          onShow={() => console.log(`[QRTextInput ${id}] Modal onShow event fired`)}
          onRequestClose={() => setScanner(false)}
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
        >
          <View style={{ flex: 1, backgroundColor: 'black' }}>
            <QRCodeScanner
              onScan={handleQRScan}
              onClose={() => setScanner(false)}
            />
          </View>
        </Modal>
      </View>
    );
  }
);

export default QRTextInput;