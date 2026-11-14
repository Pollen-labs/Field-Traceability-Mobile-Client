// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { EAS } from "eas-lib";

export interface WalletInfo {
  address: string;
  providerUrl: string;
  privateKey: string;
  schemaUID?: string;
}

export interface WalletContextType {
  wallet: WalletInfo | null;
  createWallet: () => Promise<WalletInfo>;
  isWalletCreated: boolean;
  easHelper: EAS | null;
  verifyWalletOwnership: (address: string) => Promise<boolean>;
}
