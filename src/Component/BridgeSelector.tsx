import { useEffect, useRef, useState } from "react";
import { HueBridgeManager } from "../services/hue-bridage-manager";
import { HueBridgeConfig } from "../types";

// src/components/BridgeSelector.tsx
export const BridgeSelector = () => {
    const [selectedBridge, setSelectedBridge] = useState<HueBridgeConfig>();
    const [bridges, setBridges] = useState<HueBridgeConfig[]>([]);
    const manager = useRef(new HueBridgeManager());
  
    useEffect(() => {
      manager.current.discoverBridges().then(setBridges);
    }, []);
  
    return (
      <select
        value={selectedBridge?.id}
        onChange={(e) => {
          const bridge = bridges.find(b => b.id === e.target.value);
          setSelectedBridge(bridge);
        }}
      >
        {bridges.map(bridge => (
          <option key={bridge.id} value={bridge.id}>
            {bridge.friendlyName} ({bridge.ip})
          </option>
        ))}
      </select>
    );
  };