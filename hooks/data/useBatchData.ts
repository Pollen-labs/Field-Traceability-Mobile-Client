import { useEffect, useState } from "react";
import { BatchData } from "@/types/batch";
import { subscribeToBatchData, getBatchData } from "@/utils/batchStorage";

export function useBatchData() {
  const [data, setData] = useState<BatchData | null>(null);

  useEffect(() => {
    let mounted = true;

    // Load initial data
    getBatchData().then((stored) => {
      if (mounted) setData(stored);
    });

    // Subscribe to updates
    const unsubscribe = subscribeToBatchData((newData) => {
      if (mounted) setData(newData);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return {
    data,
    materials: data?.materials || [],
    materialOptions: data?.materialOptions || [],
    products: data?.products || [],
    actions: data?.actions || [],
    collectors: data?.collectors || [],
    ports: data?.ports || [],
    hasMaterials: !!data?.materials?.length,
    hasProducts: !!data?.products?.length,
    hasActions: !!data?.actions?.length,
    hasCollectors: !!data?.collectors?.length,
    lastUpdated: data?.lastUpdated,
  };
}
