// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { DirectusItemStatus } from "./directus";
import { MaterialTrackingEvent } from "./event";
import { EnaleiaUser } from "./user";

export interface Company {
  id: number;
  status: DirectusItemStatus;
  sort?: number;
  user_created?: string; // UUID
  date_created?: "datetime";
  user_updated?: string; // UUID
  date_updated?: "datetime";
  name?: string;
  city?: string;
  country?: number;
  coordinates?: string;
  role?: string; // UUID
  contact_person?: string;
  is_active?: boolean;
  users?: EnaleiaUser[];
  events?: MaterialTrackingEvent[];
}
