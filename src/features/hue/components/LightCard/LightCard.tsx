import React from "react";
import { FaLightbulb, FaExclamationTriangle } from "react-icons/fa";

interface LightCardProps {
  light: any;
  onToggle: () => void;
  onBrightnessChange: (brightness: number) => void;
}

// Convert Hue values to CSS color
const hueToColor = (hue: number, sat: number, bri: number): string => {
  const h = (hue / 65535) * 360;
  const s = (sat / 254) * 100;
  const l = Math.max(20, (bri / 254) * 60); // Keep lightness visible
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const LightCard: React.FC<LightCardProps> = ({
  light,
  onToggle,
  onBrightnessChange,
}) => {
  const isOn = light.state?.on;
  const isReachable = light.state?.reachable !== false;
  const hue = light.state?.hue ?? 0;
  const sat = light.state?.sat ?? 0;
  const bri = light.state?.bri ?? 254;
  
  // Get light color or use warm white for CT-only lights
  const lightColor = isOn && isReachable
    ? (light.state?.hue !== undefined 
        ? hueToColor(hue, sat, bri) 
        : `hsl(40, 100%, ${(bri / 254) * 60}%)`) // Warm white for CT lights
    : '#333';

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <div 
      className={`light-card ${isOn ? 'is-on' : 'is-off'} ${!isReachable ? 'is-unreachable' : ''}`}
      style={{ '--light-color': lightColor } as React.CSSProperties}
    >
      {/* Color indicator bar */}
      <div 
        className="light-color-bar" 
        style={{ background: isOn && isReachable ? lightColor : (!isReachable ? '#666' : 'transparent') }}
      />
      
      <div className="light-header">
        {/* Clickable bulb icon to toggle light */}
        <div 
          className={`light-icon-wrapper ${isOn ? 'is-on' : ''}`}
          style={{ 
            background: isOn && isReachable ? lightColor : undefined,
            cursor: 'pointer'
          }}
          onClick={handleToggleClick}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {!isReachable ? (
            <FaExclamationTriangle className="light-bulb-icon unreachable" />
          ) : (
            <FaLightbulb className={`light-bulb-icon ${isOn ? 'on' : 'off'}`} />
          )}
        </div>
        <div className="light-name-section">
          <h3 className="light-name">{light.name}</h3>
          <span className="light-status">
            {!isReachable ? 'Unreachable' : (isOn ? 'On' : 'Off')}
          </span>
        </div>
      </div>
      
      <div className="light-controls">
        <label className="brightness-label">Brightness</label>
        <div className="brightness-slider-wrapper">
          <input
            type="range"
            min="1"
            max="254"
            value={bri}
            onChange={(e) => isReachable && onBrightnessChange(+e.target.value)}
            disabled={!isReachable}
            className="brightness-slider"
            style={{
              background: isReachable 
                ? `linear-gradient(to right, ${lightColor} ${(bri / 254) * 100}%, rgba(255,255,255,0.1) ${(bri / 254) * 100}%)`
                : 'rgba(255,255,255,0.05)'
            }}
          />
          <span className="brightness-value">{Math.round((bri / 254) * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default LightCard;
