// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { Company } from "./company";

interface DirectusUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  token?: string | null;
}

type EnaleiaUser = DirectusUser & {
  Company?: number | Pick<Company, "id" | "name" | "coordinates">;
  wallet_address?: string;
  Country_assign?: {
    countries_country_id: {
      country_id: number;
      country_name: string;
    };
  }[];
};

export { EnaleiaUser, DirectusUser };
