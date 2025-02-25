import React from "react";
import { FaLightbulb } from "react-icons/fa";

interface LightCardProps {
  light: any;
  onToggle: () => void;
  onBrightnessChange: (brightness: number) => void;
}

const LightCard: React.FC<LightCardProps> = ({
  light,
  onToggle,
  onBrightnessChange,
}) => {
  return (
    <div className="light-card">
      <div className="light-info">
        <h3>{light.name}</h3>
        <div className="card-interactions">
          <div
            className={`light-card-button`}
            role="button"
            tabIndex={0}
          ></div>
          <FaLightbulb
            className={`lamp-icon ${light.state.on ? "on" : "off"}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          />
        </div>
      </div>
      <div className="light-controls">
        <input
          type="range"
          min="0"
          max="254"
          value={light.state.bri}
          onChange={(e) => onBrightnessChange(+e.target.value)}
        />
        <span>{Math.round((light.state.bri / 254) * 100)}%</span>
      </div>
    </div>
  );
};

export default LightCard;
