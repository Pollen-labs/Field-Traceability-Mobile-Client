// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { JsonValue } from "@/types/json";
import { DirectusItemStatus } from "./directus";

export type MaterialNames =
  | "Mixed Plastics"
  | "Metals"
  | "Prevention Nets"
  | "Ghost Nets"
  | "Others"
  | "PP"
  | "HDPE"
  | "LDPE"
  | "PET"
  | "Nets"
  | "Non-Recyclables"
  | "PS"
  | "Rubbers"
  | "PA"
  | "PE"
  | "Ropes"
  | "Mixed Materials";

export type MaterialOption = {
  label: MaterialNames;
  value: number;
};

export type MaterialCategories =
  | "Plastics"
  | "Nets and Ropes"
  | "Other Materials";

export type MaterialOptions = MaterialOption[];

export type MaterialIdMap = Record<MaterialNames, number>;

export type MaterialDetail = {
  id: number;
  weight: number | null;
  code: string | null;
};

export interface MaterialsData {
  nameToId: Record<string, number>;
  idToName: Record<number, string>;
  options: Array<{
    label: string;
    value: number;
  }>;
}

export const processMaterials = (materials: any[]): MaterialsData => {
  const nameToId: Record<string, number> = {};
  const idToName: Record<number, string> = {};
  const options: Array<{ label: string; value: number }> = [];

  for (const material of materials) {
    if (material.material_name !== null) {
      const { material_name, material_id } = material;

      nameToId[material_name] = material_id;
      idToName[material_id] = material_name;
      options.push({
        label: material_name,
        value: material_id,
      });
    }
  }

  return {
    nameToId,
    idToName,
    options,
  };
};

export interface DirectusMaterial {
  material_id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: string; // Using literal type as shown in image
  user_updated?: string; // UUID
  date_updated?: string;
  material_name?: string;
  material_description?: string;
  used_for?: JsonValue; // Using JsonValue instead of any for json fields
}
