// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { EnaleiaEASSchema } from "@/types/enaleia";
import { EAS } from "eas-lib";
import { getEnvironment } from "@/utils/environment";

type Environment = "development" | "production" | "preview";

export const EAS_CONSTANTS = {
  SCHEMA:
    "string userID, string portOrCompanyName, string[] portOrCompanyCoordinates, string actionType, string actionDate, string[] actionCoordinates, string collectorName, string[] incomingMaterials, uint16[] incomingWeightsKg, string[] incomingCodes, string[] outgoingMaterials, uint16[] outgoingWeightsKg, string[] outgoingCodes, string productName, uint16 batchQuantity, string weightPerItemKg",
  SCHEMA_UID: (() => {
    const schemaUid = process.env.EXPO_PUBLIC_EAS_SCHEMA_UID;
    if (!schemaUid) {
      throw new Error('EAS Schema UID not found in environment variables');
    }
    return schemaUid;
  })(),
  getNetworkConfig: () => {
    try {
      const providerUrl = process.env.EXPO_PUBLIC_NETWORK_PROVIDER;
      const scanUrl = process.env.EXPO_PUBLIC_NETWORK_SCAN;
      
      if (!providerUrl) {
        throw new Error('Network provider URL not found in environment variables');
      }
      if (!scanUrl) {
        throw new Error('Network scan URL not found in environment variables');
      }
      
      return { providerUrl, scanUrl };
    } catch (error) {
      console.error('[EAS] Error getting network config:', error);
      throw new Error('Network configuration not available');
    }
  },
  MINIMUM_BALANCE: 0.0005,
  getAttestationUrl: (uid: string) => {
    const { scanUrl } = EAS_CONSTANTS.getNetworkConfig();
    return `${scanUrl}/attestation/view/${uid}`;
  },
};

export type EASAttestationResult = {
  uid: string;
};

export class EASAttestationError extends Error {
  constructor(message: string, public readonly schema?: EnaleiaEASSchema) {
    super(message);
    this.name = "EASAttestationError";
  }
}

export class EASService {
  private eas: EAS | null = null;

  constructor(privateKey: string) {
    if (!privateKey) {
      throw new EASAttestationError("Missing wallet credentials");
    }
    
    const { providerUrl } = EAS_CONSTANTS.getNetworkConfig();
    
    this.eas = new EAS(
      providerUrl,
      privateKey,
      EAS_CONSTANTS.SCHEMA,
      EAS_CONSTANTS.SCHEMA_UID
    );
  }

  async attest(schema: EnaleiaEASSchema): Promise<EASAttestationResult> {
    if (!this.eas) {
      throw new EASAttestationError("EAS not initialized");
    }

    try {
      const uid = await this.eas.attest(schema);

      if (!uid) {
        throw new EASAttestationError("No transaction hash returned", schema);
      }
      return { uid };
    } catch (error) {
      if (error instanceof EASAttestationError) {
        throw error;
      }
      throw new EASAttestationError(
        `Attestation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        schema
      );
    }
  }
}
