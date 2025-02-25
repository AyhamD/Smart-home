// src/App.tsx

import Dashboard from "./Pages/Dashboard.tsx";

import "./App.scss";
import { BrowserRouter, Route, Routes } from "react-router";
import BridgeSetup from "./Pages/BridgeSetup.tsx";
import { ImagesProvider } from "./context/ImageContext.tsx";
import { WeatherProvider } from "./context/WeatherContext.tsx";
import GroupDetail from "./Pages/GroupDetail.tsx";
import { BluetoothProvider } from "./context/BluetoothContext.tsx";

const App = () => {
  return (
    <WeatherProvider>
      <ImagesProvider>
        <BluetoothProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/hue-control" element={<Dashboard />} />
              <Route path="/hue-control/setup" element={<BridgeSetup />} />
              <Route
                path="/hue-control/lights/:groupId"
                element={<GroupDetail />}
              />
            </Routes>
          </BrowserRouter>
        </BluetoothProvider>
      </ImagesProvider>
    </WeatherProvider>
  );
};

export default App;
