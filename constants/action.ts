// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { ActionColor, ActionIcon, ActionSlug } from "@/types/action";

export const ACTION_COLORS: ActionColor = {
  "Ad-hoc": "#FABAA4",
  Batch: "#9FD08B",
  "Beach cleanup": "#E2CD96",
  "Fishing for litter": "#69B5E8",
  Manufacturing: "#E2B9ED",
  Pelletizing: "#DCB093",
  Prevention: "#7BCFCC",
  Shredding: "#EAD9B4",
  Sorting: "#82CC97",
  Washing: "#A7C8DE",
} as const;

export const ACTION_SLUGS: ActionSlug = {
  "Ad-hoc": "adhoc",
  Batch: "collection-batch",
  "Beach cleanup": "beach-cleanup",
  "Fishing for litter": "fishing-for-litter",
  Manufacturing: "manufacturing",
  Pelletizing: "pelletizing",
  Prevention: "prevention",
  Shredding: "shredding",
  Sorting: "sorting",
  Washing: "washing",
} as const;

const actionIcons = {
  "Ad-hoc": require("@assets/images/action-icons/Ad-hoc.webp"),
  Batch: require("@assets/images/action-icons/Batch.webp"),
  "Beach cleanup": require("@assets/images/action-icons/Beach Cleanup.webp"),
  "Fishing for litter": require("@assets/images/action-icons/Fishing for Litter.webp"),
  Manufacturing: require("@assets/images/action-icons/Manufacturing.webp"),
  Pelletizing: require("@assets/images/action-icons/Pelletizing.webp"),
  Prevention: require("@assets/images/action-icons/Prevention.webp"),
  Shredding: require("@assets/images/action-icons/Shredding.webp"),
  Sorting: require("@assets/images/action-icons/Sorting.webp"),
  Washing: require("@assets/images/action-icons/Washing.webp"),
} as const;

export const ACTION_ICONS: ActionIcon = actionIcons;

export default actionIcons;
