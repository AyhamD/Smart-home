// components/PresetColors/PresetColors.tsx
import React from "react";

interface PresetColorsProps {
  onColorSelect: (hsl: { h: number; s: number; l: number }) => void;
  onWhiteSelect: (ct: number) => void;
}

const PresetColors: React.FC<PresetColorsProps> = ({ onColorSelect, onWhiteSelect }) => {
  const presets = [
    // Color Presets
    { name: "Red", hsl: { h: 0, s: 100, l: 50 }, color: "#ff0000" },
    { name: "Green", hsl: { h: 120, s: 100, l: 50 }, color: "#00ff00" },
    { name: "Blue", hsl: { h: 240, s: 100, l: 50 }, color: "#0000ff" },
    // White Temperatures (in Mireds)
    { name: "Warm White", ct: 500, color: "#fff4e6" },
    { name: "Cool White", ct: 153, color: "#f0f8ff" }
  ];

  return (
    <div className="preset-colors">
      {presets.map((preset) => (
        <button
          key={preset.name}
          className="preset-button"
          style={{ backgroundColor: preset.color }}
          onClick={() => {
            if (preset.ct) {
              onWhiteSelect(preset.ct);
            } else if (preset.hsl) {
              onColorSelect(preset.hsl);
            }
          }}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
};

export default PresetColors;