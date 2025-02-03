import { useEffect, useMemo, useState } from "react";
import { HueBridgeManager } from "../services/hue-bridage-manager";
import BridgeCard from "./BridgeCard";
import { HueBridgeConfig } from "../types";

// src/components/BridgeDiscovery.tsx
export const BridgeDiscovery = () => {
    const [bridges, setBridges] = useState<HueBridgeConfig[]>([]);
    const manager = useMemo(() => new HueBridgeManager(), []);
  
    useEffect(() => {
      const discover = async () => {
        const foundBridges = await manager.discoverBridges();
        setBridges(foundBridges);
      };
      discover();
    }, [manager]);
  
    function showError(message: any) {
        throw new Error("Function not implemented.");
    }

    return (
      <div className="discovery-container">
        <h2>Found Bridges</h2>
        <div className="bridge-list">
          {bridges.map(bridge => (
            <BridgeCard 
              key={bridge.id}
              bridge={bridge}
              onConnect={async () => {
                try {
                  const username = await manager.authenticateBridge(bridge.ip);
                  await manager.addBridge({ ...bridge, username });
                } catch (error) {
                  showError(error);
                }
              }}
            />
          ))}
        </div>
      </div>
    );
  };