import { useEffect, useRef } from "react";
import { ColorPickerProps } from "../../types";

const ColorPicker = ({ color, pickerPosition, onColorChange, onPickerPositionChange }: ColorPickerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = canvas.width / 2;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > radius) continue;

        const angle = Math.atan2(dy, dx);
        const hue = ((angle + Math.PI) / (2 * Math.PI)) * 360;
        const saturation = (distance / radius) * 100;

        const rgb = hslToRgb(hue, saturation, 50);
        ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    updateColorFromPosition(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    updateColorFromPosition(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const updateColorFromPosition = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const radius = canvas.width / 2;
    const dx = x - radius;
    const dy = y - radius;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > radius) return;

    const angle = Math.atan2(dy, dx);
    const hue = ((angle + Math.PI) / (2 * Math.PI)) * 360;
    const saturation = (distance / radius) * 100;

    onPickerPositionChange({ x, y });
    const newHsl = { h: hue, s: saturation, l: color.hsl.l };
    const hex = hslToHex(hue, saturation, newHsl.l);
    const rgb = hslToRgb(hue, saturation, newHsl.l);

    onColorChange(newHsl, hex, rgb);
  };

  return (
    <canvas
      ref={canvasRef}
      width="300"
      height="300"
      defaultValue={color.hex}  
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={() => onPickerPositionChange(pickerPosition)}
      onMouseLeave={() => onPickerPositionChange(pickerPosition)}
    />
  );
};

// Utility functions (same as before)
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

export default ColorPicker;