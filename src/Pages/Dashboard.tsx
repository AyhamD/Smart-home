// src/pages/Dashboard.tsx
import { LightGroup } from "../types";
import axios from "axios";
import GroupCard from "../Component/GroupCard/GroupCard";
import Header from "../Component/Header/Header";
import ImageUploader from "../Component/ImageUploader/ImageUploader";
import useHue from "../Hooks/UseHue";
import { useImageContext } from "../context/ImageContext";
import { useNavigate } from "react-router";
import { useBluetooth } from "../context/BluetoothContext";
import { useGrocery } from "../context/GroceryContext";
import { FaHome, FaPowerOff } from "react-icons/fa";
import GroceryList from "../Component/GroceryList/GroceryList";

const Dashboard = () => {
  const { lights, groups, loading, error, refreshData } = useHue();
  const { userImages, setUserImages, currentImageIndex } = useImageContext();
  const { devices: bluetoothDevices } = useBluetooth();
  const { isAtHome, checkingNetwork } = useGrocery();
  const navigate = useNavigate();

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

  // Show loading only when checking network status
  if (checkingNetwork) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Checking network...</p>
      </div>
    );
  }

  // When not at home, only show grocery list (don't wait for Hue)
  if (!isAtHome) {
    return (
      <div className="dashboard-container away-mode">
        <Header />
        <div className="dashboard-content">
          <GroceryList />
        </div>
      </div>
    );
  }

  // At home - wait for Hue to load
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
