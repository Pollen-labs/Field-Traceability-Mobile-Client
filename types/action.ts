// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { ACTION_COLORS, ACTION_ICONS, ACTION_SLUGS } from "@/constants/action";
import { ImageSourcePropType } from "react-native";
import { DirectusItemStatus } from "./directus";

export interface Action {
  id: number;
  name: ActionTitle;
  description: string;
  color: string;
  icon: ImageSourcePropType;
  slug: string;
  category: ActionCategory;
}

export type ActionTitle =
  | "Fishing for litter"
  | "Manufacturing"
  | "Prevention"
  | "Shredding"
  | "Sorting"
  | "Washing"
  | "Batch"
  | "Beach cleanup"
  | "Ad-hoc"
  | "Pelletizing";

export type ActionCategory = NonNullable<DirectusAction["action_group"]>;

export type ActionIcon = Record<ActionTitle, ImageSourcePropType>;
export type ActionColor = Record<ActionTitle, string>;
export type ActionCategories = Record<
  NonNullable<ActionCategory>,
  ActionTitle[]
>;
export type ActionSlug = Record<ActionTitle, string>;
export type ActionIds = {
  [K in keyof typeof ACTION_COLORS]: number;
};

export type GroupedActions = {
  [category: string]: Action[];
};

export const processActions = (actions: any[] | undefined): Action[] => {
  if (!actions || !Array.isArray(actions)) {
    return [];
  }

  return actions
    .map((action) => {
      const name = action.action_name as ActionTitle;
      if (!Object.keys(ACTION_SLUGS).includes(name)) {
        console.warn(`Invalid action name: ${name}`);
        return null;
      }

      return {
        id: action.action_id,
        name,
        description: action.action_description,
        color: ACTION_COLORS[name],
        icon: ACTION_ICONS[name],
        slug: ACTION_SLUGS[name],
        category: action.action_group,
      };
    })
    .filter((action): action is Action => action !== null);
};

export const groupActionsByCategory = (
  actions: Action[] | undefined
): GroupedActions => {
  if (!actions || !Array.isArray(actions)) {
    return {};
  }

  const groupedActions: GroupedActions = {};

  for (const action of actions) {
    if (!groupedActions[action.category]) {
      groupedActions[action.category] = [];
    }
    groupedActions[action.category].push(action);
  }

  return groupedActions;
};

export interface DirectusAction {
  action_id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: string;
  user_updated?: string; // UUID
  date_updated?: string;
  action_name?: string;
  action_description?: string;
  action_group?: "Collection" | "Transport" | "Recycling" | "Manufacturing";
}
