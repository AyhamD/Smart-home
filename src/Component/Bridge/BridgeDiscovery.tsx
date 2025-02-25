import { useBridgeContext } from "../../context/BridgeContext";
import { BridgeDiscoveryProps } from "../../types";
import BridgeCard from "./BridgeCard";

const BridgeDiscoveryFlow:React.FC<BridgeDiscoveryProps> = () => {
  const { bridges, loading, error, discoverBridges, connectBridge } =
    useBridgeContext();

  return (
    <div className="discovery-flow">
      <h1>Philips Hue Setup</h1>

      <button
        className="discover-button"
        onClick={discoverBridges}
        disabled={loading}
      >
        {loading ? "Searching..." : "Find Bridges"}
      </button>

      {error && <div className="error-message">{error}</div>}

      <div className="bridge-list">
        {bridges.map((bridge) => (
          <BridgeCard
            key={bridge.id}
            bridge={bridge}
            onConnect={() => connectBridge(bridge.ip)}
          />
        ))}
      </div>

      {/* Link Button Modal */}
      <div id="link-button-modal-root"></div>
    </div>
  );
};

export default BridgeDiscoveryFlow;