// src/context/WeatherContext.tsx
import axios from "axios";
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  city: string;
  condition: string;
}

interface WeatherContextProps {
  weather: WeatherData | null;
  fetchWeather: (latitude: number, longitude: number) => void;
}

const WeatherContext = createContext<WeatherContextProps | undefined>(
  undefined
);

export const useWeatherContext = (): WeatherContextProps => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeatherContext must be used within a WeatherProvider");
  }
  return context;
};

export const WeatherProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const fetchWeather = async (latitude: number, longitude: number) => {
    const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${
          import.meta.env.VITE_OWM_API_KEY
        }&units=metric`
      );
    setWeather({
      city: response.data.name,
      condition:  response.data.weather[0].main,
      temperature:  response.data.main.temp,
      description:  response.data.weather[0].description,
      icon:  response.data.weather[0].icon,
    });
  };

  return (
    <WeatherContext.Provider value={{ weather, fetchWeather }}>
      {children}
    </WeatherContext.Provider>
  );
};
