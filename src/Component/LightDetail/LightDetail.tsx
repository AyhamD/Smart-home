// src/components/LightDetail.tsx

import { LightDetailProps } from "../../types";

export const LightDetail = ({ 
  group, 
  lights,
  onClose,
  onChangeBrightness
}: LightDetailProps) => {
  const groupLights = lights.filter(light => 
    group.lights.includes(light.id)
  );

  return (
    <div className="light-detail-overlay">
      <div className="light-detail">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{group.name} Controls</h2>
        
        <div className="light-controls">
          {groupLights.map(light => (
            <div key={light.id} className="light-control">
              <h3>{light.name}</h3>
              <div className="brightness-control">
                <label>Brightness:</label>
                <input
                  type="range"
                  min="0"
                  max="254"
                  value={light.state.bri}
                  onChange={(e) => 
                    onChangeBrightness(light.id, parseInt(e.target.value))
                  }
                />
                <span>{Math.round((light.state.bri / 254) * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};