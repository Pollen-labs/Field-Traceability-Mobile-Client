import { JsonValue } from "@/types/json";
import { DirectusItemStatus } from "./directus";

export const processCollectors = (
  collectors: Pick<
    DirectusCollector,
    "collector_id" | "collector_name" | "collector_identity" | "registered_port"
  >[]
): Pick<
  DirectusCollector,
  "collector_id" | "collector_name" | "collector_identity" | "registered_port"
>[] => {
  return collectors.map(
    ({ collector_id, collector_name, collector_identity, registered_port }) => ({
      collector_id,
      collector_name,
      collector_identity,
      registered_port,
    })
  );
};

export interface DirectusCollector {
  /**
   * The ID of the collector
   */
  collector_id: number;
  /**
   * The status of the collector
   */
  status: DirectusItemStatus;
  /**
   * The sort order of the collector
   */
  sort?: number;
  /**
   * The user who created the collector
   */
  user_created?: string; // UUID
  /**
   * The date the collector was created
   */
  date_created?: string;
  /**
   * The user who updated the collector
   */
  user_updated?: string; // UUID
  /**
   * The date the collector was updated
   */
  date_updated?: string;
  /**
   * Whether the collector is active
   */
  is_active?: boolean;
  /**
   * The contact person of the collector
   */
  contact_person?: string;
  /**
   * The fishing season of the collector
   */
  fishing_season?: JsonValue;
  /**
   * The country of the collector
   *  foreign key to countries
   */
  country?: number;
  /**
   * The name of the collector company
   */
  collector_company_name?: string;
  /**
   * The type of vessel of the collector
   */
  vessel_type?: number;
  /**
   * The registered port of the collector
   *  foreign key to Companies
   */
  registered_port?: number;
  /**
   * The fishing zone of the collector
   */
  fishing_zone?: any;
  /**
   * The scanned QR code from the collector's card
   */
  collector_identity?: string;
  /**
   * The name of the collector
   */
  collector_name?: string;
  /**
   * The start date of the collector
   */
  start_date?: string;
  /**
   * The events of the collector
   */
  events?: any;
}
