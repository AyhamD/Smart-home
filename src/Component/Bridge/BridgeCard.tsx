import { HueBridgeConfig } from "../../types";

type BridgeCardProps = {
  bridge: HueBridgeConfig;
  onConnect: () => void;
};

const BridgeCard = ({ bridge, onConnect }: BridgeCardProps) => (
  <div className="bridge-card">
    <h3>{bridge.friendlyName}</h3>
    <p>IP: {bridge.ip}</p>
    <button onClick={onConnect}>Connect</button>
  </div>
);

export default BridgeCard;