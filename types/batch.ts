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
