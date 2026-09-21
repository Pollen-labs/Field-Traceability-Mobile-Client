import { MaterialDetail, MaterialNames, MaterialsData } from "@/types/material";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SelectMaterialItem = React.memo(
  ({
    label,
    value,
    isSelected,
    handleAddMaterial,
  }: {
    label: MaterialNames;
    value: number;
    isSelected: boolean;
    handleAddMaterial: (materialId: number) => void;
  }) => {
    const handlePress = useCallback(() => {
      handleAddMaterial(value);
    }, [value, handleAddMaterial]);

    return (
      <Pressable
        accessibilityLabel={`Select ${label}`}
        accessibilityRole="button"
        accessibilityHint={`Tap to select ${label} material`}
        accessibilityState={{ selected: isSelected }}
        className="bg-white w-full px-4 py-3 rounded-2xl flex flex-row items-center justify-between border-[1.5px] border-grey-3 mb-2"
        onPress={handlePress}
      >
        <Text className="text-base font-dm-bold text-enaleia-black tracking-tighter">
          {label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#0D0D0D" />
        )}
      </Pressable>
    );
  }
);

export default function AddMaterialModal({
  isVisible,
  onClose,
  selectedMaterials,
  setSelectedMaterials,
  materials,
  onMaterialSelect,
}: {
  isVisible: boolean;
  materials: MaterialsData["options"];
  onClose: () => void;
  selectedMaterials: MaterialDetail[];
  setSelectedMaterials: (materials: MaterialDetail[]) => void;
  onMaterialSelect?: () => Promise<void>;
}) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const hasPresentedRef = useRef(false);
  const selectedIds = useMemo(
    () => (selectedMaterials || []).map((m) => m.id),
    [selectedMaterials]
  );
  const snapPoints = useMemo(() => ["80%"], []);

  useEffect(() => {
    if (!isVisible || hasPresentedRef.current) {
      return;
    }

    hasPresentedRef.current = true;
    const frame = requestAnimationFrame(() => {
      sheetRef.current?.present();
    });

    return () => cancelAnimationFrame(frame);
  }, [isVisible]);

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

  const handleAddMaterial = useCallback(async (materialId: number) => {
    if (selectedIds.includes(materialId)) return;

    const currentMaterials = selectedMaterials || [];
    const newMaterialDetails: MaterialDetail[] = [
      ...currentMaterials,
      {
        id: materialId,
        weight: null,
        code: "",
      },
    ];
    setSelectedMaterials(newMaterialDetails);
    Keyboard.dismiss();
    onClose();
    sheetRef.current?.dismiss();

    if (onMaterialSelect) {
      await onMaterialSelect();
    }
  }, [onClose, onMaterialSelect, selectedIds, selectedMaterials, setSelectedMaterials]);

  if (!isVisible) {
    hasPresentedRef.current = false;
    return null;
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <View className="px-5 pt-2 pb-2 flex-row justify-center items-center">
        <Text className="text-3xl font-dm-bold text-enaleia-black text-center w-full">
          Select Material
        </Text>
      </View>

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
        {materials.map(({ label, value }) => (
          <SelectMaterialItem
            key={value}
            label={label as MaterialNames}
            value={value}
            isSelected={selectedIds.includes(value)}
            handleAddMaterial={handleAddMaterial}
          />
        ))}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  handleIndicator: {
    backgroundColor: "#DDDDDD",
    width: 36,
    height: 5,
  },
  scrollView: {
    flex: 1,
  },
});
