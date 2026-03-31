import { ReactNode } from "react";

// src/types.ts
export interface Light {
  id: string;
  name: string;
  type: string;
  state: {
    on: boolean;
    bri: number;
    reachable: boolean;
  };
}

export interface LightGroup {
  id: string;
  name: string;
  lights: string[];
  type: string;
  state: {
    all_on: boolean;
    any_on: boolean;
  };
  action: {
    on: boolean;
    bri: number;
    hue?: number;
    sat?: number;
    effect?: string;
    xy?: [number, number];
    ct?: number;
    alert?: string;
    colormode?: string;
  };
}

export type BRmeshDevice = {
  id: string;
  name: string;
  connected: boolean;
  brightness: number;
  on: boolean;
};

export type BluetoothContextType = {
  devices: BRmeshDevice[];
  isScanning: boolean;
  hasConnectedDevices: boolean;
  scanDevices: () => Promise<void>;
  toggleDevice: (deviceId: string) => Promise<void>;
  setBrightness: (deviceId: string, brightness: number) => Promise<void>;
};

export interface Navigator {
  bluetooth: {
    requestDevice: (options: { filters: { services: string[] }[], optionalServices: string[] }) => Promise<BluetoothDevice>;
  };
}

export interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
  };
}

export interface ColorPickerProps {
  color: { hsl: { h: number; s: number; l: number }; hex: string; rgb: { r: number; g: number; b: number } };
  pickerPosition: { x: number; y: number };
  onColorChange: (hsl: { h: number; s: number; l: number }, hex: string, rgb: { r: number; g: number; b: number }) => void;
  onPickerPositionChange: (position: { x: number; y: number }) => void;
}

export interface CarouselImage {
  id: string;
  url: string;
  alt: string;
}

export interface LightDetailProps {
  group: LightGroup;
  lights: Light[];
  onClose: () => void;
  onChangeBrightness: (lightId: string, bri: number) => void;
}

export interface BridgeContextProps {
  bridges: HueBridgeConfig[];
  loading: boolean;
  error: string;
  discoverBridges: () => Promise<void>;
  connectBridge: (bridgeIp: string) => Promise<void>;
}

export interface ImageCarouselProps {
  images: CarouselImage[];
  currentIndex: number;
  onIndexChange?: (index: number) => void;
}

export interface BridgeDiscoveryProps {

  bridges: HueBridgeConfig[];

  loading: boolean;

  error: string;

  onDiscover: () => Promise<void>;

  onConnect: (bridgeIp: string) => Promise<void>;

}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
};

export interface HueBridgeConfig {
  id: string;
  ip: string;
  username?: string;
  friendlyName: string;
  lastConnected: Date;
}

export interface ImagesContextType {
  userImages: string[];
  setUserImages: React.Dispatch<React.SetStateAction<string[]>>;
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
}

export interface ImageProviderProps {
  children: ReactNode;
}

export interface ImageUploaderProps {
  onImagesSelected: (images: string[]) => void;
}