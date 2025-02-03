// src/App.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.scss";
import GroupCard from "./Component/GroupCard/GroupCard";
import Header from "./Component/Header/Header";
// import { LightDetail } from "./Component/LightDetail/LightDetail";
import useHue from "./Hooks/UseHue";
import { HueBridgeConfig, LightGroup } from "./types";
import ImageUploader from "./Component/ImageUploader/ImageUploader";
import { HueBridgeManager } from "./services/hue-bridage-manager";
import BridgeCard from "./Component/BridgeCard";

const App = () => {
  const { lights, groups, loading, error, refreshData } = useHue();
  const [, setSelectedGroup] = useState<LightGroup | null>(null);
  // const [city, setCity] = useState<string | null>(null);
  const [userImages, setUserImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bridges, setBridges] = useState<HueBridgeConfig[]>([]);
  const [manager] = useState(() => new HueBridgeManager());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) =>
        userImages.length > 0 ? (prev + 1) % userImages.length : 0
      );
      manager.discoverBridges().then(setBridges);
    }, 5000);
    return () => clearInterval(timer);
  }, [userImages.length, manager]);

  // const handleBrightnessChange = async (lightId: string, bri: number) => {
  //   try {
  //     await axios.put(
  //       `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
  //         import.meta.env.VITE_HUE_USERNAME
  //       }/lights/${lightId}/state`,
  //       { bri }
  //     );
  //     refreshData();
  //   } catch (err) {
  //     console.error("Brightness update failed:", err);
  //   }
  // };

  // Add missing handleGroupToggle function
  const handleGroupToggle = async (groupId: string) => {
    try {
      const group = groups.find((g) => g.id === groupId);
      if (!group || !group.lights) return;

      const currentState = lights
        .filter((light) => group.lights?.includes(light.id))
        .some((light) => light.state.on);

      await axios.put(
        `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
          import.meta.env.VITE_HUE_USERNAME
        }/groups/${groupId}/action`,
        { on: !currentState }
      );

      refreshData();
    } catch (err) {
      console.error("Group toggle failed:", err);
      refreshData();
    }
  };

  // Add safety check for group.lights
  const isGroupActive = (group: LightGroup) => {
    if (!group.lights) return false;
    return lights
      .filter((light) => group.lights.includes(light.id))
      .some((light) => light.state.on);
  };

  if (loading) return <div className="loading-screen">Initializing...</div>;
  if (error) return <div className="error-screen">{error}</div>;

  return (
    <div className="app-container">
      <Header />
      <div className="bridge-discovery">
        <h1>Connect to Hue Bridge</h1>
        <div className="bridge-list">
          {bridges.map((bridge) => (
            <BridgeCard
              key={bridge.id}
              bridge={bridge}
              onConnect={() => manager.authenticateBridge(bridge.ip)}
            />
          ))}
        </div>
      </div>
      <div className="main-content">
        <div className="groups-panel">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isActive={isGroupActive(group)}
              onToggle={() => handleGroupToggle(group.id)}
              onClick={() => setSelectedGroup(group)}
            />
          ))}
        </div>

        <div className="controls-section">
          <ImageUploader onImagesSelected={setUserImages} />
          <div className="image-carousel">
            {userImages.length > 0 ? (
              userImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt="User uploaded"
                  className={`carousel-image ${
                    index === currentImageIndex ? "active" : ""
                  }`}
                />
              ))
            ) : (
              <div className="upload-prompt">
                <p>Select images from your device to display here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* {selectedGroup && (
        <LightDetail
          group={selectedGroup}
          lights={lights.filter((light) =>
            selectedGroup.lights?.includes(light.id)
          )}
          onClose={() => setSelectedGroup(null)}
          onChangeBrightness={handleBrightnessChange}
        />
      )} */}
    </div>
  );
};

export default App;
