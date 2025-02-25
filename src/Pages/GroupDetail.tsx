import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router";
import Header from "../Component/Header/Header";
import { motion } from "framer-motion";
import ColorPicker from "../Component/ColorPicker/ColorPicker";
import LightCard from "../Component/lightCard/lightCard";
import PresetColors from "../Component/PresetColors/PresetColors";

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [groupLights, setGroupLights] = useState<any[]>([]);
  const [brightness, setBrightness] = useState(254);
  const [pickerPosition, setPickerPosition] = useState({ x: 100, y: 100 });
  const [color, setColor] = useState({
    hsl: { h: 0, s: 100, l: 50 },
    hex: "#ff0000",
    rgb: { r: 255, g: 0, b: 0 },
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const groupRes = await axios.get(
          `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
            import.meta.env.VITE_HUE_USERNAME
          }/groups/${groupId}`
        );

        const lightsRes = await axios.get(
          `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
            import.meta.env.VITE_HUE_USERNAME
          }/lights`
        );
        const lightsInGroup = groupRes.data.lights
          .map((lightId: string) => ({
            id: lightId,
            ...lightsRes.data[lightId],
          }))
          .filter((light: any) => light.state?.reachable);

        setGroup(groupRes.data);
        setGroupLights(lightsInGroup);

        if (lightsInGroup.length > 0) {
          const initialHue = lightsInGroup[0].state.hue || 0;
          const initialSat = lightsInGroup[0].state.sat || 0;
          setColor({
            hsl: {
              h: (initialHue / 65535) * 360,
              s: (initialSat / 254) * 100,
              l: 50,
            },
            hex: hslToHex(
              (initialHue / 65535) * 360,
              (initialSat / 254) * 100,
              50
            ),
            rgb: hslToRgb(
              (initialHue / 65535) * 360,
              (initialSat / 254) * 100,
              50
            ),
          });
          setBrightness(lightsInGroup[0].state.bri || 254);
        }
      } catch (error) {
        console.error("Failed to fetch group data:", error);
      }
    };

    fetchGroupData();
  }, [groupId]);

  const refreshData = async () => {
    try {
      const groupRes = await axios.get(
        `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
          import.meta.env.VITE_HUE_USERNAME
        }/groups/${groupId}`
      );
      setGroup(groupRes.data);

      const lightsRes = await axios.get(
        `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
          import.meta.env.VITE_HUE_USERNAME
        }/lights`
      );
      const lightsInGroup = groupRes.data.lights
        .map((lightId: string) => ({
          id: lightId,
          ...lightsRes.data[lightId],
        }))
        .filter((light: any) => light.state?.reachable);

      setGroupLights(lightsInGroup);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  const drawColorWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const radius = canvas.width / 2;
    const imgData = ctx.createImageData(canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
          const angle = Math.atan2(dy, dx);
          const hue = ((angle + Math.PI) / (2 * Math.PI)) * 360;
          const saturation = (distance / radius) * 100;
          const { r, g, b } = hslToRgb(hue, saturation, 50);

          const index = (y * canvas.width + x) * 4;
          imgData.data[index] = r;
          imgData.data[index + 1] = g;
          imgData.data[index + 2] = b;
          imgData.data[index + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  useEffect(() => {
    drawColorWheel();
  }, []);

  const updateGroupLights = async (payload: object) => {
    try {
      await axios.put(
        `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
          import.meta.env.VITE_HUE_USERNAME
        }/groups/${groupId}/action`,
        payload
      );

      setGroupLights((prev) =>
        prev.map((light) => ({
          ...light,
          state: { ...light.state, ...payload },
        }))
      );
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      const hsl = hexToHsl(hex);
      setColor({
        hex,
        hsl,
        rgb: hslToRgb(hsl.h, hsl.s, hsl.l),
      });
      updateGroupLights({
        hue: Math.round((hsl.h / 360) * 65535),
        sat: Math.round((hsl.s / 100) * 254),
      });
    }
  };

  const handleRgbChange = (channel: "r" | "g" | "b", value: number) => {
    const newRgb = {
      ...color.rgb,
      [channel]: Math.min(255, Math.max(0, value)),
    };
    const hsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setColor({ rgb: newRgb, hsl, hex });
    updateGroupLights({
      hue: Math.round((hsl.h / 360) * 65535),
      sat: Math.round((hsl.s / 100) * 254),
    });
  };

  // Handle color change from ColorPicker
  const handleColorChange = (
    hsl: { h: number; s: number; l: number },
    hex: string,
    rgb: { r: number; g: number; b: number }
  ) => {
    setColor({ hsl, hex, rgb });
    updateGroupLights({
      hue: Math.round((hsl.h / 360) * 65535),
      sat: Math.round((hsl.s / 100) * 254),
    });
  };

  const handleBrightnessChange = async (
    lightId: string,
    brightness: number
  ) => {
    try {
      await axios.put(
        `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
          import.meta.env.VITE_HUE_USERNAME
        }/lights/${lightId}/state`,
        { bri: brightness }
      );

      setGroupLights((prev) =>
        prev.map((l) =>
          l.id === lightId
            ? { ...l, state: { ...l.state, bri: brightness } }
            : l
        )
      );
    } catch (error) {
      console.error("Brightness update failed:", error);
    }
  };

  const handleColorPreset = (hsl: { h: number; s: number; l: number }) => {
    const hex = hslToHex(hsl.h, hsl.s, hsl.l);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    setColor({ hsl, hex, rgb });
    updateGroupLights({
      hue: Math.round((hsl.h / 360) * 65535),
      sat: Math.round((hsl.s / 100) * 254)
    });
  };

  const handleWhitePreset = (ct: number) => {
    // Clear color settings and set white temperature
    updateGroupLights({
      ct,
      hue: undefined,
      sat: undefined
    });
  };

  useEffect(() => {
    refreshData();
  }, [groupId]);

  const handleLightToggle = async (lightId: string) => {
    try {
      const light = groupLights.find((l) => l.id === lightId);
      if (!light) return;

      const newState = !light.state.on;

      await axios.put(
        `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
          import.meta.env.VITE_HUE_USERNAME
        }/lights/${lightId}/state`,
        { on: newState }
      );

      setGroupLights((prev) =>
        prev.map((l) =>
          l.id === lightId ? { ...l, state: { ...l.state, on: newState } } : l
        )
      );
    } catch (err) {
      console.error("Light toggle failed:", err);
      refreshData();
    }
  };

  if (!group) return <div className="loading">Loading group details...</div>;

  return (
    <motion.div className="group-detail">
      <Header showBackButton onBack={() => navigate("/hue-control")} />

      <div className="group-controls">
        <motion.div className="color-control-card">
          <div className="color-picker-container">
            <div className="color-wheel-wrapper">
              <ColorPicker
                color={color}
                pickerPosition={pickerPosition}
                onColorChange={(hsl, hex, rgb) => {
                  setColor({ hsl, hex, rgb });
                  groupLights.forEach((light) => {
                    axios.put(
                      `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
                        import.meta.env.VITE_HUE_USERNAME
                      }/lights/${light.id}/state`,
                      {
                        hue: Math.round((hsl.h / 360) * 65535),
                        sat: Math.round((hsl.s / 100) * 254),
                      }
                    );
                  });
                }}
                onPickerPositionChange={setPickerPosition}
              />
              <div
                className="color-thumb"
                style={{
                  left: `${pickerPosition.x}px`,
                  top: `${pickerPosition.y}px`,
                  backgroundColor: color.hex,
                }}
              />
            </div>

            <div className="color-inputs">
              <div className="input-group">
                <label>HEX</label>
                <input
                  type="text"
                  value={color.hex}
                  onChange={handleHexChange}
                />
              </div>

              <div className="input-group">
                <label>RGB</label>
                <div className="rgb-inputs">
                  <input
                    type="number"
                    value={color.rgb.r}
                    onChange={(e) => handleRgbChange("r", +e.target.value)}
                  />
                  <input
                    type="number"
                    value={color.rgb.g}
                    onChange={(e) => handleRgbChange("g", +e.target.value)}
                  />
                  <input
                    type="number"
                    value={color.rgb.b}
                    onChange={(e) => handleRgbChange("b", +e.target.value)}
                  />
                </div>
              </div>

              <div className="slider-container">
                <label>Brightness</label>
                <div className="slider-track">
                  <input
                    type="range"
                    min="0"
                    max="254"
                    value={brightness}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setBrightness(value);
                      updateGroupLights({ bri: value });
                    }}
                    style={{
                      background: `linear-gradient(to right, 
                    #f5f5f5 ${(brightness / 254) * 100}%, 
                    #2c3e50 ${(brightness / 254) * 100}%)`,
                    }}
                  />
                </div>
                <span className="percentage">
                  {Math.round((brightness / 254) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="color-control-card">
          <PresetColors
            onColorSelect={handleColorPreset}
            onWhiteSelect={handleWhitePreset}
          />
        </div>          
      {groupLights.length > 0 && (
        <div className="group-lights">
          {groupLights.map((light) => (
            <LightCard
              key={light.id}
              onToggle={() => handleLightToggle(light.id)}
              light={light}
              onBrightnessChange={(brightness) =>
                handleBrightnessChange(light.id, brightness)
              }
            />
          ))}
        </div>
      )}
      
    </motion.div>
  );
};

// Utility functions
const hslToHex = (h: number, s: number, l: number) => {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4)),
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

const hexToHsl = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgbToHsl(r * 255, g * 255, b * 255);
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export default GroupDetail;
