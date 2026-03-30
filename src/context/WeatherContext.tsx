// src/context/WeatherContext.tsx
import axios from "axios";
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

export interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  city: string;
  condition: string;
  humidity: number;
  feelsLike: number;
}

interface WeatherContextProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  fetchWeather: (latitude: number, longitude: number) => void;
  refetch: () => void;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const fetchWeather = useCallback(async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);
    setCoords({ lat: latitude, lon: longitude });
    
    try {
      const apiKey = import.meta.env.VITE_OWM_API_KEY;
      if (!apiKey) {
        throw new Error("Weather API key not configured");
      }
      
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`,
        { timeout: 10000 }
      );
      
      setWeather({
        city: response.data.name,
        condition: response.data.weather[0].main,
        temperature: Math.round(response.data.main.temp),
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        humidity: response.data.main.humidity,
        feelsLike: Math.round(response.data.main.feels_like),
      });
    } catch (err: any) {
      console.error("Weather fetch error:", err);
      setError(err.message || "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (coords) {
      fetchWeather(coords.lat, coords.lon);
    }
  }, [coords, fetchWeather]);

  // Auto-refresh weather every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (coords) {
        fetchWeather(coords.lat, coords.lon);
      }
    }, 600000); // 10 minutes

    return () => clearInterval(interval);
  }, [coords, fetchWeather]);

  return (
    <WeatherContext.Provider value={{ weather, loading, error, fetchWeather, refetch }}>
      {children}
    </WeatherContext.Provider>
  );
};
