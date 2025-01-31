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
  lights: string[]; // Now required array
  type: 'Room' | 'Zone' | 'LightGroup' | string;
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

export interface ImageCarouselProps {
  images: CarouselImage[];
  currentIndex: number;
  onIndexChange?: (index: number) => void;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
};