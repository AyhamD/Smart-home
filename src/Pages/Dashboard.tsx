// src/pages/Dashboard.tsx
import axios from "axios";
import { FaHome, FaPowerOff } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import GroceryList from "../features/grocery/components/GroceryList/GroceryList";
import GroupCard from "../features/hue/components/GroupCard/GroupCard";
import { useBluetooth } from "../features/hue/context/BluetoothContext";
import useHue from "../features/hue/hooks/useHue";
import { useImageContext } from "../features/weather/context/ImageContext";
import Header from "../shared/components/Header/Header";
import ImageUploader from "../shared/components/ImageUploader/ImageUploader";
import { LightGroup } from "../shared/types";

const Dashboard = () => {
  const { lights, groups, loading, error, refreshData } = useHue();
  const { userImages, setUserImages, currentImageIndex } = useImageContext();
  const { devices: bluetoothDevices } = useBluetooth();
  const navigate = useNavigate();
  
  // Check if mobile (< 600px) - only hide Hue on mobile when away
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allDevices = [
    ...groups.map((g) => ({ ...g, type: "hue" })),
  ];

  const handleGroupToggle = async (
    groupId: string,
    type: "hue" | "bluetooth"
  ) => {
    if (type === "hue") {
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
    } else {
      const device = bluetoothDevices.find((d) => d.id === groupId);
      if (device) {
        console.log(`Toggling BRmesh device ${groupId}`);
      }
    }
  };

  const handleAllOff = async () => {
    try {
      await axios.put(
        `http://${import.meta.env.VITE_HUE_BRIDGE_IP}/api/${
          import.meta.env.VITE_HUE_USERNAME
        }/groups/0/action`,
        { on: false }
      );
      refreshData();
    } catch (err) {
      console.error("All off failed:", err);
    }
  };

  const OpenLights = (groupId: string) => {
    navigate(`/lights/${groupId}`);
  };

  const isGroupActive = (group: LightGroup) => {
    if (group.type === "hue") {
      if (!group.lights) return false;
      return lights
        .filter((light) => group.lights.includes(light.id))
        .some((light) => light.state.on);
    }
    return false;
  };

  const getActiveLightsCount = () => {
    return lights.filter(l => l.state.on).length;
  };

  // Mobile: Show only grocery list (no Hue controls)
  if (isMobile) {
    return (
      <div className="dashboard-container mobile-mode">
        <Header />
        <div className="dashboard-content">
          <GroceryList />
        </div>
      </div>
    );
  }

  // iPad/Laptop: Show full dashboard with Hue + Grocery
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Connecting to Hue Bridge...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-screen">
        <p>{error}</p>
        <button onClick={refreshData} className="retry-button">Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Header />

      <div className="dashboard-content">
        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-info">
            <FaHome className="status-icon" />
            <span className="status-text">
              {getActiveLightsCount()} of {lights.length} lights on
            </span>
          </div>
          <button 
            className="all-off-button"
            onClick={handleAllOff}
            title="Turn all lights off"
          >
            <FaPowerOff />
            <span>All Off</span>
          </button>
        </div>

        <div className="main-layout">
          {/* Rooms Grid - Hue App Style */}
          <div className="rooms-grid">
            {allDevices.map((group, index) => (
              <GroupCard
                key={group.id}
                group={group as any}
                isActive={isGroupActive(group as any)}
                onToggle={() => handleGroupToggle(group.id, group.type as any)}
                onClick={() => OpenLights(group.id)}
                type={group.type as any}
                colorIndex={index}
              />
            ))}
          </div>

          {/* Image Carousel - Ambient Display */}
          <div className="ambient-display">
            <div className="image-carousel">
              <ImageUploader onImagesSelected={setUserImages} />
              {userImages.length > 0 ? (
                userImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt="Ambient display"
                    className={`carousel-image ${
                      index === currentImageIndex ? "active" : ""
                    }`}
                  />
                ))
              ) : (
                <div className="upload-prompt">
                  <div className="upload-icon">🖼️</div>
                  <p>Add photos for ambient display</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grocery List Section */}
        <GroceryList />
      </div>
    </div>
  );
};

export default Dashboard;
