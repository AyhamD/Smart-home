// src/shared/components/Header/Header.tsx
import { useNavigate } from "react-router";
import { useWeatherContext } from "../../../features/weather/context/WeatherContext";
import { useEffect, useState, useRef } from "react";
import { FaArrowLeft, FaCloudSun, FaMapMarkerAlt } from "react-icons/fa";
import { WiHumidity } from "react-icons/wi";

// Default location - change to your city
const DEFAULT_LOCATION = {
  lat: 52.52, // Berlin - change these coordinates to your location
  lon: 13.405,
  name: "Berlin"
};

// Storage key for caching location
const LOCATION_CACHE_KEY = "hue_control_last_location";

type HeaderProps = {
  showBackButton?: boolean;
  onBack?: () => void;
};

const Header = ({ showBackButton, onBack }: HeaderProps) => {
  const { weather, loading, error, fetchWeather } = useWeatherContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get cached location from localStorage
  const getCachedLocation = () => {
    try {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // Valid if less than 24 hours old
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (e) {
      console.error("Error reading cached location:", e);
    }
    return null;
  };

  // Save location to localStorage
  const cacheLocation = (lat: number, lon: number) => {
    try {
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ lat, lon, timestamp: Date.now() }));
    } catch (e) {
      console.error("Error caching location:", e);
    }
  };

  // Fetch weather on mount - simple approach with cached/default fallback
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Check for cached location first
    const cached = getCachedLocation();
    if (cached) {
      fetchWeather(cached.lat, cached.lon);
      return;
    }

    // Try browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          cacheLocation(position.coords.latitude, position.coords.longitude);
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Geolocation failed - use default location
          console.log("Using default location:", DEFAULT_LOCATION.name);
          fetchWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    } else {
      // No geolocation support - use default
      fetchWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
    }
  }, [fetchWeather]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {showBackButton && (
          <button className="back-button" onClick={handleBack}>
            <FaArrowLeft />
          </button>
        )}
        <div className="weather-widget">
          {loading ? (
            <div className="weather-loading">
              <FaCloudSun className="weather-icon-placeholder" />
              <span>Loading weather...</span>
            </div>
          ) : error ? (
            <div className="weather-error">
              <FaCloudSun className="weather-icon-placeholder" />
              <span>Weather unavailable</span>
            </div>
          ) : weather ? (
            <>
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                className="weather-icon"
              />
              <div className="weather-details">
                <div className="weather-temp">{weather.temperature}°C</div>
                <div className="weather-condition">{weather.condition}</div>
                <div className="weather-location">
                  <FaMapMarkerAlt /> {weather.city}
                </div>
              </div>
              <div className="weather-extra">
                <div className="humidity">
                  <WiHumidity /> {weather.humidity}%
                </div>
                <div className="feels-like">
                  Feels {weather.feelsLike}°C
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      
      <div className="header-center">
        <h1 className="app-title">Hue Control</h1>
      </div>

      <div className="header-right">
        <div className="datetime-widget">
          <div className="time">{formatTime(currentTime)}</div>
          <div className="date">{formatDate(currentTime)}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
