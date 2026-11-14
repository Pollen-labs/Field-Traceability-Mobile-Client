// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { router } from "expo-router";
import { Image, ImageSourcePropType, Pressable, Text } from "react-native";
import { useState } from "react";

const buttonClassName = "items-center justify-center px-4 rounded-[24px] h-[138px]";

const buttonClasses = `w-[49%] mb-2 active:opacity-70 transition-opacity duration-200 active:scale-95 ease-out ${buttonClassName}`;
const bannerClasses = `w-full ${buttonClassName}`;

const ActionButton = ({
  presentation = "button",
  name,
  color,
  icon,
  slug,
}: {
  name: string;
  color: string;
  icon: ImageSourcePropType;
  slug: string;
  presentation?: "button" | "banner";
}) => {
  const [isIconLoaded, setIsIconLoaded] = useState(false);

  return (
    <Pressable
      className={presentation === "button" ? buttonClasses : bannerClasses}
      style={{ backgroundColor: color }}
      onPress={() =>
        presentation === "button" ? router.push(`/attest/new/${slug}`) : null
      }
    >
      <Image 
        source={icon} 
        className="w-[84px] h-[84px]" 
        onLoad={() => setIsIconLoaded(true)}
      />
      {isIconLoaded && (
        <Text className="pt-1 text-sm font-dm-medium tracking-[-0.25px] text-enaleia-black text-center w-full">
          {name}
        </Text>
      )}
    </Pressable>
  );
};

export default ActionButton;
