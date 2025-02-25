import React, { createContext, useContext, useState, ReactNode } from "react";
import { HueBridgeManager } from "../services/hue-bridage-manager";
import { BridgeContextProps, HueBridgeConfig } from "../types";

const BridgeContext = createContext<BridgeContextProps | undefined>(undefined);

export const useBridgeContext = (): BridgeContextProps => {
  const context = useContext(BridgeContext);
  if (!context) {
    throw new Error("useBridgeContext must be used within a BridgeProvider");
  }
  return context;
};

export const BridgeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [bridges, setBridges] = useState<HueBridgeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const manager = new HueBridgeManager();

  const discoverBridges = async () => {
    setLoading(true);
    try {
      const discoveredBridges = await manager.discoverBridges();
      setBridges(discoveredBridges);
      setError("");
    } catch (err) {
      setError("Failed to discover bridges. Check network connection.");
    } finally {
      setLoading(false);
    }
  };

  const connectBridge = async (bridgeIp: string) => {
    try {
      const pressed = await manager.promptLinkButton();
      if (!pressed) return;

      const username = await manager.authenticateBridge(bridgeIp);

      const updatedBridges = bridges.map((bridge) =>
        bridge.ip === bridgeIp ? { ...bridge, username } : bridge
      );

      setBridges(updatedBridges);
      await manager.addBridge({
        ...bridges.find((b) => b.ip === bridgeIp)!,
        username,
      });
    } catch (err) {
      setError("Connection failed. Make sure link button was pressed.");
    }
  };

  return (
    <BridgeContext.Provider
      value={{ bridges, loading, error, discoverBridges, connectBridge }}
    >
      {children}
    </BridgeContext.Provider>
  );
};