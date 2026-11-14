// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { JsonValue } from "@/types/json";
import { DirectusItemStatus } from "./directus";

export interface MaterialTrackingEvent {
  event_id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: string;
  user_updated?: string; // UUID
  date_updated?: string;
  event_timestamp?: string;
  event_location?: string;
  EAS_UID?: string;
  action?: number;
  internal_tag?: JsonValue;
  weight_slip_ref?: number;
  collector_name?: number;
  company?: number;
  Verified?: boolean;
  Ready_for_EAS_submission?: boolean;
  event_output_id?: MaterialTrackingEventOutput[];
  event_input_id?: MaterialTrackingEventInput[];
  Batch_quantity?: number;
  manufactured_products?: number;
  weight_per_item?: string;
}

export interface MaterialTrackingEventInput {
  event_input_id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: string;
  user_updated?: string; // UUID
  date_updated?: string;
  input_code?: string;
  input_weight?: number;
  event_id?: number;
  input_Material?: number;
}

export interface MaterialTrackingEventOutput {
  event_output_id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: string;
  user_updated?: string; // UUID
  date_updated?: string;
  output_code?: string;
  output_material?: number;
  output_weight?: number;
  event_id?: number;
}
