import { EventFormType } from "@/app/attest/new/[slug]";
import { DirectusCollector } from "@/types/collector";
import { Company } from "@/types/company";
import { EnaleiaEASSchema } from "@/types/enaleia";
import { DirectusMaterial } from "@/types/material";
import { DirectusProduct } from "@/types/product";
import { QueueItem } from "@/types/queue";
import { EnaleiaUser } from "@/types/user";

export const convertCoordinatesToString = (
  coords: [number, number]
): string[] => {
  return [
    coords[0].toFixed(5), // Latitude
    coords[1].toFixed(5), // Longitude
  ];
};

/**
 * Maps form data to EAS schema format
 */
export const mapToEASSchema = (
  form: EventFormType | QueueItem,
  userData: EnaleiaUser | null,
  materialsData: DirectusMaterial[],
  productsData: Pick<
    DirectusProduct,
    "product_id" | "product_name" | "product_type"
  >[],
  collectors: Pick<
    DirectusCollector,
    "collector_id" | "collector_name" | "collector_identity"
  >[],
  selectedPort?: { name: string; coordinates: string }
): EnaleiaEASSchema => {
  const formType = "actionName" in form ? form.actionName : form.type;
  const formDate = form.date;

  const company =
    typeof userData?.Company === "number"
      ? undefined
      : (userData?.Company as Pick<Company, "id" | "name" | "coordinates">);

  const actionCoordinates: string[] = form.location?.coords
    ? convertCoordinatesToString([
        form.location.coords.latitude,
        form.location.coords.longitude,
      ])
    : ["0.00000", "0.00000"];

  const companyCoordinates: string[] = company?.coordinates
    ? company.coordinates.split(",").map((coord: string) => coord.trim())
    : ["0.00000", "0.00000"];

  const COLLECTION_TYPES = ["Fishing for litter", "Prevention", "Beach cleanup", "Ad-hoc"];
  const isCollection = COLLECTION_TYPES.includes(formType);

  const portName = isCollection
    ? (selectedPort?.name ?? "")
    : (company?.name ?? "");

  const portCoordinates: string[] = isCollection
    ? (selectedPort?.coordinates
        ? selectedPort.coordinates.split(",").map((c: string) => c.trim())
        : ["0.00000", "0.00000"])
    : companyCoordinates;

  const incomingWeightsKg: number[] =
    form.incomingMaterials?.map((m) => m.weight || 0) || [];
  const outgoingWeightsKg: number[] =
    form.outgoingMaterials?.map((m) => m.weight || 0) || [];
  const weightPerItemKg = form.manufacturing?.weightInKg?.toString() || "";
  const batchQuantity = form.manufacturing?.quantity || 0;

  return {
    userID: userData?.id || "",
    portOrCompanyName: portName,
    portOrCompanyCoordinates: portCoordinates,

    actionType: formType,
    actionDate: formDate,
    actionCoordinates: actionCoordinates,

    collectorName:
      collectors.find((c) => c.collector_identity === form.collectorId)
        ?.collector_name || "",

    incomingMaterials:
      form.incomingMaterials?.map(
        (m) =>
          materialsData.find((md) => md.material_id === m.id)?.material_name ||
          ""
      ) || [],
    incomingWeightsKg,
    incomingCodes: form.incomingMaterials?.map(
      (m) => m.code || form.collectorId || ""
    ) || [],

    outgoingMaterials:
      form.outgoingMaterials?.map(
        (m) =>
          materialsData.find((md) => md.material_id === m.id)?.material_name ||
          ""
      ) || [],
    outgoingWeightsKg,
    outgoingCodes: form.outgoingMaterials?.map(
      (m) => m.code || ""
    ) || [],

    productName: form.manufacturing?.product
      ? productsData.find((p) => p.product_id === form.manufacturing?.product)
          ?.product_name || ""
      : "",
    batchQuantity,
    weightPerItemKg,
  };
};

/**
 * Validates the EAS schema data before attestation
 */
export const validateEASSchema = (data: EnaleiaEASSchema): boolean => {
  // Keep all materials, even those with zero weights or empty codes
  const validIncomingMaterials = data.incomingMaterials;
  const validIncomingWeights = data.incomingWeightsKg;
  const validIncomingCodes = data.incomingCodes;

  const validOutgoingMaterials = data.outgoingMaterials;
  const validOutgoingWeights = data.outgoingWeightsKg;
  const validOutgoingCodes = data.outgoingCodes;

  // Update the arrays in the data object
  data.incomingMaterials = validIncomingMaterials;
  data.incomingWeightsKg = validIncomingWeights;
  data.incomingCodes = validIncomingCodes;
  data.outgoingMaterials = validOutgoingMaterials;
  data.outgoingWeightsKg = validOutgoingWeights;
  data.outgoingCodes = validOutgoingCodes;

  if (
    !Array.isArray(data.incomingMaterials) ||
    !Array.isArray(data.incomingWeightsKg) ||
    !Array.isArray(data.incomingCodes) ||
    !Array.isArray(data.outgoingMaterials) ||
    !Array.isArray(data.outgoingWeightsKg) ||
    !Array.isArray(data.outgoingCodes)
  ) {
    throw new Error("Material arrays must be valid arrays (can be empty)");
  }

  if (
    data.incomingMaterials.length !== data.incomingWeightsKg.length ||
    data.incomingMaterials.length !== data.incomingCodes.length
  ) {
    throw new Error(
      "Incoming materials, weights, and codes must have matching lengths"
    );
  }

  if (
    data.outgoingMaterials.length !== data.outgoingWeightsKg.length ||
    data.outgoingMaterials.length !== data.outgoingCodes.length
  ) {
    throw new Error(
      "Outgoing materials, weights, and codes must have matching lengths"
    );
  }

  if (
    data.incomingWeightsKg.some((w) => w < 0) ||
    data.outgoingWeightsKg.some((w) => w < 0) ||
    (data.weightPerItemKg !== "0" && parseFloat(data.weightPerItemKg) < 0)
  ) {
    throw new Error("Weights must be non-negative");
  }

  if (data.batchQuantity !== 0 && data.batchQuantity < 0) {
    throw new Error("Batch quantity must be non-negative");
  }

  return true;
};

export async function fundWallet(address: string) {
  if (!process.env.EXPO_PUBLIC_FUNDING_URL) {
    throw new Error("FUNDING_URL is not set");
  }

  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_FUNDING_URL}/fund-address?address=${address}`
    );
    const data: { info: string } = await response.json();
    console.log("Funding successful", data);
    return data.info;
  } catch (error) {
    console.error("Funding failed", error);
    throw new Error(
      `Funding failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getWalletBalance(address: string) {
  if (!process.env.EXPO_PUBLIC_FUNDING_URL) {
    throw new Error("FUNDING_URL is not set");
  }

  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_FUNDING_URL}/get-balance?address=${address}`
    );
    const data: { balance: string } = await response.json();
    console.log("Balance successful", data);
    return data.balance;
  } catch (error) {
    console.error("Balance failed", error);
  }
}
