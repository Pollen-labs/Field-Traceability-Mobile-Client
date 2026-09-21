import AsyncStorage from "@react-native-async-storage/async-storage";
import { BatchData, PortData } from "@/types/batch";
import { batchFetchData } from "./batchFetcher";
import { processCollectors } from "@/types/collector";
import { processMaterials } from "@/types/material";
import { processProducts } from "@/types/product";
import { processActions } from "@/types/action";
import { DirectusCollector } from "@/types/collector";
import { DirectusMaterial } from "@/types/material";
import { DirectusProduct } from "@/types/product";

const BATCH_STORAGE_KEY = "ENALEIA_BATCH";

type BatchDataListener = (data: BatchData | null) => void;
const listeners = new Set<BatchDataListener>();

export function subscribeToBatchData(listener: BatchDataListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function notifyListeners(data: BatchData | null) {
  listeners.forEach((listener) => listener(data));
}

export async function getBatchData(): Promise<BatchData | null> {
  try {
    const stored = await AsyncStorage.getItem(BATCH_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading batch data:", error);
    return null;
  }
}

export async function setBatchData(data: BatchData): Promise<void> {
  try {
    const dataWithTimestamp = {
      ...data,
      lastUpdated: Date.now(),
    };
    await AsyncStorage.setItem(
      BATCH_STORAGE_KEY,
      JSON.stringify(dataWithTimestamp)
    );
    await notifyListeners(dataWithTimestamp);
  } catch (error) {
    console.error("Error saving batch data:", error);
    throw error;
  }
}

export async function fetchAndProcessBatchData(): Promise<BatchData> {
  try {
    const data = await batchFetchData();
    if (!data) throw new Error("Failed to fetch batch data");

    const processedData: BatchData = {
      collectors: processCollectors(data.collectors as DirectusCollector[]),
      materials: data.materials as DirectusMaterial[],
      materialOptions: processMaterials(data.materials as DirectusMaterial[])
        .options,
      products: processProducts(data.products as DirectusProduct[]),
      actions: processActions(data.actions),
      ports: (data.ports || []) as PortData[],
      lastUpdated: Date.now(),
    };

    await setBatchData(processedData);
    return processedData;
  } catch (error) {
    console.error("Error fetching and processing batch data:", error);
    throw error;
  }
}

export async function clearBatchData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BATCH_STORAGE_KEY);
    await notifyListeners(null);
  } catch (error) {
    console.error("Error clearing batch data:", error);
    throw error;
  }
}

export async function refreshBatchData(): Promise<BatchData> {
  return fetchAndProcessBatchData();
}

interface InitializationProgress {
  user: boolean;
  actions: boolean;
  materials: boolean;
  collectors: boolean;
  products: boolean;
  ports: boolean;
}

export async function initializeBatchData(
  isOnline: boolean,
  user: any | null
): Promise<{
  data: BatchData | null;
  progress: InitializationProgress;
  error: Error | null;
}> {
  try {
    // Try to get cached data first
    const cached = await getBatchData();
    const progress: InitializationProgress = {
      user: !!user,
      actions: !!cached?.actions?.length,
      materials: !!cached?.materials?.length,
      collectors: !!cached?.collectors?.length,
      products: !!cached?.products?.length,
      ports: !!cached?.ports?.length,
    };

    // If we have cached data, return it immediately
    if (cached) {
      return { data: cached, progress, error: null };
    }

    // If offline or no user, return null
    if (!isOnline || !user) {
      return { data: null, progress, error: null };
    }

    // Fetch fresh data
    const fresh = await fetchAndProcessBatchData();
    progress.actions = !!fresh.actions?.length;
    progress.materials = !!fresh.materials?.length;
    progress.collectors = !!fresh.collectors?.length;
    progress.products = !!fresh.products?.length;
    progress.ports = !!fresh.ports?.length;

    return { data: fresh, progress, error: null };
  } catch (error) {
    console.error("Error initializing batch data:", error);
    return {
      data: null,
        progress: {
          user: !!user,
          actions: false,
          materials: false,
          collectors: false,
          products: false,
          ports: false,
        },
      error: error as Error,
    };
  }
}
