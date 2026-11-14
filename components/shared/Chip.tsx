// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { Text, View } from "react-native";

type ChipProps = {
  label: string;
  textColor?: string;
  icon?: React.ReactNode;
  bgColor?: string;
  borderColor?: string;
};

/**
 * A reusable Chip component that displays text with optional icon
 * @param label - The text to display in the chip
 * @param textColor - Color of the text (optional)
 * @param icon - Optional icon component to display
 * @param bgColor - Background color of the chip (optional)
 * @param borderColor - Border color of the chip (optional)
 */
export default function Chip({
  label,
  textColor = "text-neutral-700",
  icon,
  bgColor,
  borderColor,
}: ChipProps) {
  return (
    <View
      className={[
        "flex-row items-center px-1 py-0.5 rounded-md border-[1.5px]",
        bgColor ?? "bg-neutral-100",
        borderColor ?? "border-neutral-300",
      ].join(" ")}
    >
      {icon && <View className="mr-1">{icon}</View>}
      <Text
        className={[
          "text-xs font-dm-medium tracking-tight",
          textColor ?? "text-neutral-600",
        ].join(" ")}
      >
        {label}
      </Text>
    </View>
  );
}
