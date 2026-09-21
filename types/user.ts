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
