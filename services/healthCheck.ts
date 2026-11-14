// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { getEnvironment } from "@/utils/environment";

const HEALTH_CHECK_TIMEOUT =10 * 1000; // 10 seconds timeout

export async function checkDirectusHealth(): Promise<boolean> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${apiUrl}/server/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

export async function checkEASHealth(checkSchema: boolean = false): Promise<boolean> {
  const scanUrl = process.env.EXPO_PUBLIC_NETWORK_SCAN;
  const providerUrl = process.env.EXPO_PUBLIC_NETWORK_PROVIDER;
  
  if (!scanUrl || !providerUrl) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    // Check both the scan service and the blockchain provider
    const [scanResponse, providerResponse] = await Promise.all([
      fetch(scanUrl, {
        method: 'GET',
        signal: controller.signal
      }).catch(() => ({ status: 500 })),
      fetch(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'net_version',
          params: [],
          id: 1
        }),
        signal: controller.signal
      }).catch(() => ({ status: 500 }))
    ]);

    clearTimeout(timeoutId);

    // Both services need to be healthy
    return scanResponse.status === 200 && providerResponse.status === 200;
  } catch (error) {
    return false;
  }
}

export async function checkServicesHealth(checkEASSchema: boolean = false): Promise<{
  directus: boolean;
  eas: boolean;
  allHealthy: boolean;
}> {
  const [directusHealth, easHealth] = await Promise.all([
    checkDirectusHealth(),
    checkEASHealth(checkEASSchema)
  ]);

  return {
    directus: directusHealth,
    eas: easHealth,
    allHealthy: directusHealth && easHealth
  };
} 