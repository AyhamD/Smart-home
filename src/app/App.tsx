// src/app/App.tsx

import Dashboard from "../features/hue/pages/Dashboard";
import OAuthCallback from "../features/hue/pages/OAuthCallback";

import "./App.scss";
import { BrowserRouter, Route, Routes } from "react-router";
import BridgeSetup from "../features/hue/pages/BridgeSetup";
import { ImagesProvider } from "../features/weather/context/ImageContext";
import { WeatherProvider } from "../features/weather/context/WeatherContext";
import GroupDetail from "../features/hue/pages/GroupDetail";
import { BluetoothProvider } from "../features/hue/context/BluetoothContext";
import { GroceryProvider } from "../features/grocery/context/GroceryContext";
import { HueAuthProvider } from "../features/hue/context/HueAuthContext";

const App = () => {
  return (
    <WeatherProvider>
      <ImagesProvider>
        <BluetoothProvider>
          <GroceryProvider>
            <HueAuthProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/setup" element={<BridgeSetup />} />
                  <Route path="/oauth/callback" element={<OAuthCallback />} />
                  <Route
                    path="/lights/:groupId"
                    element={<GroupDetail />}
                  />
                </Routes>
              </BrowserRouter>
            </HueAuthProvider>
          </GroceryProvider>
        </BluetoothProvider>
      </ImagesProvider>
    </WeatherProvider>
  );
};

export default App;
