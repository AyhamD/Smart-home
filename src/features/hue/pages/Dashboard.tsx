// src/features/hue/pages/Dashboard.tsx
import { LightGroup } from "../../../shared/types";
import GroupCard from "../components/GroupCard/GroupCard";
import Header from "../../../shared/components/Header/Header";
import ImageUploader from "../../../shared/components/ImageUploader/ImageUploader";
import useHue from "../hooks/useHue";
import { useImageContext } from "../../weather/context/ImageContext";
import { useNavigate } from "react-router";
import { useBluetooth } from "../context/BluetoothContext";
import { useGrocery } from "../../grocery/context/GroceryContext";
import { useHueAuth } from "../context/HueAuthContext";
import { FaHome, FaPowerOff, FaSignInAlt } from "react-icons/fa";
import GroceryList from "../../grocery/components/GroceryList/GroceryList";

const Dashboard = () => {
  const { lights, groups, loading, error, refreshData, setGroupAction, isRemoteMode } = useHue();
  const { userImages, setUserImages, currentImageIndex } = useImageContext();
  const { devices: bluetoothDevices } = useBluetooth();
  const { isAtHome, checkingNetwork } = useGrocery();
  const { isAuthenticated, isLoading: authLoading, login, error: authError } = useHueAuth();
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

        // Use setGroupAction which works for both local and remote
        await setGroupAction(groupId, { on: !currentState });
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
      await setGroupAction("0", { on: false });
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

  // Remote mode: Show login UI if not authenticated
  if (isRemoteMode && !isAuthenticated && !authLoading) {
    return (
      <div className="dashboard-container away-mode">
        <Header />
        <div className="dashboard-content">
          <div className="hue-login-prompt">
            <FaSignInAlt className="login-icon" />
            <h3>Connect to Hue</h3>
            <p>Sign in with your Philips Hue account to control your lights.</p>
            {authError && <p className="auth-error">{authError}</p>}
            <button onClick={login} className="hue-login-button">
              <FaSignInAlt />
              <span>Sign in with Hue</span>
            </button>
          </div>
          <GroceryList />
        </div>
      </div>
    );
  }

  // At home - wait for Hue to load
  if (loading || authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Connecting to Hue Bridge...</p>
      </div>
    );
  }
  
  // At home but Hue bridge unreachable (e.g., iPad mixed content blocking)
  // Show grocery with a note instead of hard error
  if (error) {
    // In remote mode, offer re-login option
    const needsLogin = isRemoteMode && error.includes("Not authenticated");
    
    return (
      <div className="dashboard-container away-mode">
        <Header />
        <div className="dashboard-content">
          <div className="hue-unavailable-notice">
            <FaHome className="notice-icon" />
            <p>{needsLogin ? "Session expired" : "Hue controls unavailable"}</p>
            {needsLogin ? (
              <button onClick={login} className="hue-login-button-small">
                <FaSignInAlt /> Sign in
              </button>
            ) : (
              <button onClick={refreshData} className="retry-button-small">Retry</button>
            )}
          </div>
          <GroceryList />
        </div>
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
