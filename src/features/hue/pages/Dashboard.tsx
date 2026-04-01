// src/features/hue/pages/Dashboard.tsx
import { useState, useEffect } from "react";
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
import { FaHome, FaPowerOff, FaSignInAlt, FaImage, FaLightbulb, FaShoppingCart, FaChevronDown, FaChevronUp } from "react-icons/fa";
import GroceryList from "../../grocery/components/GroceryList/GroceryList";

type TabType = 'images' | 'lights' | 'grocery';

const Dashboard = () => {
  const { lights, groups, loading, error, refreshData, setGroupAction, isRemoteMode } = useHue();
  const { userImages, setUserImages, currentImageIndex } = useImageContext();
  const { devices: bluetoothDevices } = useBluetooth();
  const { isAtHome, checkingNetwork } = useGrocery();
  const { isAuthenticated, isLoading: authLoading, login, error: authError } = useHueAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Check if mobile phone (< 480px) - tablets always show tabs
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
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

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
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

  // Mobile: Show only grocery list
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

  // iPad/Tablet: Show tabbed dashboard
  return (
    <div className="dashboard-container tablet-mode">
      <Header />

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          <FaImage />
          <span>Images</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'lights' ? 'active' : ''}`}
          onClick={() => setActiveTab('lights')}
        >
          <FaLightbulb />
          <span>Lights</span>
          {getActiveLightsCount() > 0 && (
            <span className="tab-badge">{getActiveLightsCount()}</span>
          )}
        </button>
        <button 
          className={`tab-button ${activeTab === 'grocery' ? 'active' : ''}`}
          onClick={() => setActiveTab('grocery')}
        >
          <FaShoppingCart />
          <span>Grocery</span>
        </button>
      </div>

      <div className="dashboard-content">
        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="tab-content images-tab">
            <div className="ambient-display fullscreen">
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
        )}

        {/* Lights Tab */}
        {activeTab === 'lights' && (
          <div className="tab-content lights-tab">
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

            {/* Collapsible Room Cards */}
            <div className="rooms-list">
              {allDevices.map((group, index) => {
                const isExpanded = expandedGroups.has(group.id);
                const groupLights = lights.filter(l => 
                  (group as LightGroup).lights?.includes(l.id)
                );
                const activeLights = groupLights.filter(l => l.state.on).length;
                
                return (
                  <div key={group.id} className={`room-card-collapsible ${isExpanded ? 'expanded' : ''}`}>
                    <div className="room-card-header">
                      <div className="room-card-content" onClick={() => toggleGroupExpand(group.id)}>
                        <GroupCard
                          group={group as any}
                          isActive={isGroupActive(group as any)}
                          onToggle={() => handleGroupToggle(group.id, group.type as any)}
                          onClick={() => OpenLights(group.id)}
                          type={group.type as any}
                          colorIndex={index}
                        />
                      </div>
                      <button className="expand-toggle" onClick={() => toggleGroupExpand(group.id)}>
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        <span className="lights-count">{activeLights}/{groupLights.length}</span>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="room-card-details">
                        <div className="room-lights-list">
                          {groupLights.map(light => (
                            <div 
                              key={light.id} 
                              className={`light-item ${light.state.on ? 'on' : 'off'}`}
                            >
                              <span className="light-name">{light.name}</span>
                              <span className={`light-status ${light.state.on ? 'on' : 'off'}`}>
                                {light.state.on ? 'On' : 'Off'}
                              </span>
                            </div>
                          ))}
                        </div>
                        <button 
                          className="open-room-button"
                          onClick={() => OpenLights(group.id)}
                        >
                          Open Room Controls
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grocery Tab */}
        {activeTab === 'grocery' && (
          <div className="tab-content grocery-tab">
            <GroceryList />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
