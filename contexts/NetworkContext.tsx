// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { createContext, useContext, useEffect, useState } from "react";
import NetInfo, {
  NetInfoState,
  NetInfoStateType,
} from "@react-native-community/netinfo";
import { Platform } from "react-native";

interface NetworkContextType {
  isConnected: boolean;
  connectionType: NetInfoStateType | null;
  isMetered: boolean | null;
  isInternetReachable: boolean | null;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkContextType>({
    isConnected: true,
    connectionType: null,
    isMetered: null,
    isInternetReachable: true,
  });

  useEffect(() => {
    return NetInfo.addEventListener((state: NetInfoState) => {
      const newState = {
        isConnected: !!state.isConnected,
        connectionType: state.type,
        isMetered: Platform.select({
          android: (state as any).isMetered ?? null,
          ios: (state as any).isConnectionExpensive ?? null,
          default: null,
        }),
        isInternetReachable: !!state.isInternetReachable,
      };
      setNetworkState(newState);
    });
  }, []);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
