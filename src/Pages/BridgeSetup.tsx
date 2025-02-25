import { useNavigate } from "react-router";
import { useBridgeContext } from "../context/BridgeContext";
import BridgeDiscovery from "../Component/Bridge/BridgeDiscovery";

const BridgeSetup = () => {
  const navigate = useNavigate();
  const { bridges, loading, error, discoverBridges, connectBridge } =
    useBridgeContext();

  const handleBridgeSelected = async (bridgeIp: string) => {
    try {
      await connectBridge(bridgeIp);
      localStorage.setItem("hueBridge", JSON.stringify(bridgeIp));
      navigate("/");
    } catch (error) {
      console.error("Bridge connection failed:", error);
    }
  };

  return (
    <div className="setup-container">
      <h1>Setup Philips Hue Bridge</h1>
      <BridgeDiscovery
        bridges={bridges}
        loading={loading}
        error={error}
        onDiscover={discoverBridges}
        onConnect={handleBridgeSelected}
      />
    </div>
  );
};

export default BridgeSetup;