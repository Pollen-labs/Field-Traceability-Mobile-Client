// TODO: Get all the data from the tables, not just the first 100
// TODO: Update the fields to only get the ones required
import {
  MaterialTrackingEvent,
  MaterialTrackingEventInput,
  MaterialTrackingEventOutput,
} from "@/types/event";
import { directus } from "@/utils/directus";
import { createItem, readItems, updateItem } from "@directus/sdk";

function formatDirectusError(endpoint: string, error: any): Error {
  const errorMessage =
    error.errors?.[0]?.message || error.message || "Unknown error";
  const errorCode = error.errors?.[0]?.extensions?.code || "UNKNOWN_ERROR";
  return new Error(
    `[Directus] Failed to fetch ${endpoint}: ${errorMessage} (${errorCode})`
  );
}

export async function fetchMaterials() {
  try {
    return await directus.request(readItems("Materials", {limit:-1}));
  } catch (error: any) {
    throw formatDirectusError("Materials", error);
  }
}

export async function fetchActions() {
  try {
    return await directus.request(readItems("Actions", {limit:-1}));
  } catch (error: any) {
    throw formatDirectusError("Actions", error);
  }
}

export async function fetchCollectors() {
  try {
    return await directus.request(
      readItems("Collectors", {
        limit: -1,
        fields: [
          "collector_id",
          "collector_name",
          "collector_identity",
          "registered_port",
        ],
      })
    );
  } catch (error: any) {
    throw formatDirectusError("Collectors", error);
  }
}

export async function fetchPorts() {
  try {
    return await directus.request(
      readItems("Companies", {
        filter: {
          role: { name: { _eq: "Port" } },
          is_active: { _eq: true },
        },
        fields: [
          "id",
          "name",
          "city",
          "coordinates",
          "country.country_id",
          "country.country_name",
        ],
        limit: -1,
      })
    );
  } catch (error: any) {
    throw formatDirectusError("Ports", error);
  }
}

export async function fetchProducts() {
  try {
    return await directus.request(readItems("Products", {
      limit: -1,
      fields: ['*', 'manufactured_by.name']
    }));
  } catch (error: any) {
    throw formatDirectusError("Products", error);
  }
}

export async function createEvent(event: Omit<MaterialTrackingEvent, 'event_id'>) {
  try {
    return await directus.request(createItem("Events", event));
  } catch (error: any) {
    throw formatDirectusError("Events", error);
  }
}

export async function createMaterialInput(input: Omit<MaterialTrackingEventInput, 'event_input_id'>) {
  try {
    return await directus.request(createItem("Events_Input", input));
  } catch (error: any) {
    throw formatDirectusError("MaterialInputs", error);
  }
}

export async function createMaterialOutput(
  output: Omit<MaterialTrackingEventOutput, 'event_output_id'>
) {
  try {
    return await directus.request(createItem("Events_Output", output));
  } catch (error: any) {
    throw formatDirectusError("Events_Output", error);
  }
}

export async function updateEvent(
  eventId: number,
  event: Partial<MaterialTrackingEvent>
) {
  try {
    return await directus.request(updateItem("Events", eventId, event));
  } catch (error: any) {
    throw formatDirectusError("Events", error);
  }
}

export async function getEvent(eventId: number) {
  try {
    return await directus.request(readItems("Events", { filter: { event_id: { _eq: eventId } } }));
  } catch (error: any) {
    throw formatDirectusError("Events", error);
  }
}
