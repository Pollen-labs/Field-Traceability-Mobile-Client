// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { Action } from "@/types/action";
import { DirectusCollector } from "@/types/collector";
import { DirectusProduct } from "@/types/product";
import { DirectusMaterial } from "@/types/material";

export interface PortData {
  id: number;
  name: string;
  city?: string;
  coordinates?: string;
  country?: {
    country_id: number;
    country_name: string;
  };
}

export interface BatchData {
  actions: Action[];
  materials: DirectusMaterial[];
  materialOptions: { label: string; value: number }[];
  collectors: Pick<
    DirectusCollector,
    "collector_id" | "collector_name" | "collector_identity" | "registered_port"
  >[];
  ports: PortData[];
  products: Pick<
    DirectusProduct,
    "product_id" | "product_name" | "product_type" | "manufactured_by"
  >[];
  lastUpdated?: number;
}
