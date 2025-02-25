// src/components/Header.tsx
import { useNavigate } from "react-router";
import { useWeatherContext } from "../../context/WeatherContext";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

type HeaderProps = {
  showBackButton?: boolean;
  onBack?: () => void;
};

const Header = ({ showBackButton, onBack }: HeaderProps) => {
  const { weather, fetchWeather } = useWeatherContext();
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const setupBridge = () => {
    navigate("/hue-control/setup");
  };
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          setError("Location access denied");
        }
      );
    }
  }, []);

  return (
    <header className="app-header">
      {showBackButton && (
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft></FaArrowLeft>
        </button>
      )}
      <div className="weather-info">
        <img
          src={`https://openweathermap.org/img/wn/${weather?.icon}.png`}
        ></img>
        <div>
          <h2>{weather?.city || "Loading..."}</h2>
          <p>{weather ? `${weather.temperature}°C` : error || "--"}</p>
        </div>
      </div>
      <div className="left-side">
        <div className="time-display">
          <div>{new Date().toLocaleTimeString()}</div>
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
        {/* future development */}
        {/* <div onClick={setupBridge} className="bridge-icon">
          <FaBridge></FaBridge>
        </div> */}
      </div>
    </header>
  );
};

export default Header;
