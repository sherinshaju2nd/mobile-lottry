import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { Platform } from "react-native";

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string;
  isOffline: boolean;
  isChecking: boolean;
  checkConnection: () => Promise<boolean>;
  showGameModal: boolean;
  setShowGameModal: (show: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string>("unknown");
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showGameModal, setShowGameModal] = useState<boolean>(false);

  const updateNetworkState = useCallback((state: NetInfoState) => {
    const connected = state.isConnected ?? true;
    const reachable = state.isInternetReachable ?? connected;
    const offline = !connected || reachable === false;

    setIsConnected(connected);
    setIsInternetReachable(reachable);
    setConnectionType(state.type || "unknown");
  }, []);

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then(updateNetworkState).catch(() => {});

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(updateNetworkState);

    return () => {
      unsubscribe();
    };
  }, [updateNetworkState]);

  // Active check ping
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      // NetInfo fresh fetch
      const state = await NetInfo.refresh();
      let hasNet = (state.isConnected ?? true) && (state.isInternetReachable ?? true);

      // Verify with a lightweight probe
      if (hasNet) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const res = await fetch("https://clients3.google.com/generate_204", {
            method: "HEAD",
            signal: controller.signal,
            cache: "no-store",
          });
          clearTimeout(timeoutId);
          hasNet = res.status >= 200 && res.status < 400;
        } catch {
          // If probe fails, fallback to state
          hasNet = state.isConnected ?? false;
        }
      }

      setIsConnected(hasNet);
      setIsInternetReachable(hasNet);
      return hasNet;
    } catch {
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const isOffline = !isConnected || isInternetReachable === false;

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        connectionType,
        isOffline,
        isChecking,
        checkConnection,
        showGameModal,
        setShowGameModal,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};
