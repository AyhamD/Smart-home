// src/components/Header.tsx
import { useState, useEffect } from 'react';
import { WiDaySunny, WiRain, WiCloudy } from 'react-icons/wi';
import axios from 'axios';

type WeatherData = {
  city: string;
  temp: number;
  condition: string;
};

const Header = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${
            import.meta.env.VITE_OWM_API_KEY
          }&units=metric`
        );
        
        setWeather({
          city: response.data.name,
          temp: Math.round(response.data.main.temp),
          condition: response.data.weather[0].main
        });
      } catch (err) {
        setError('Failed to fetch weather data');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          setError('Location access denied');
        }
      );
    } else {
      setError('Geolocation is not supported');
    }
  }, []);

  const getWeatherIcon = () => {
    if (!weather) return <WiDaySunny />;
    switch (weather.condition.toLowerCase()) {
      case 'rain': return <WiRain />;
      case 'clouds': return <WiCloudy />;
      default: return <WiDaySunny />;
    }
  };

  return (
    <header className="app-header">
      <div className="weather-info">
        {getWeatherIcon()}
        <div>
          <h2>{weather?.city || 'Loading...'}</h2>
          <p>{weather ? `${weather.temp}°C` : error || '--'}</p>
        </div>
      </div>
      <div className="time-display">
        {new Date().toLocaleTimeString()}
        <br />
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
    </header>
  );
};

export default Header;