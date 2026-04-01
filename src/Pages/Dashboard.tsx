// src/pages/Dashboard.tsx
import axios from "axios";
import { FaHome, FaPowerOff, FaImage, FaLightbulb, FaShoppingCart, FaChevronDown, FaChevronUp } from "react-icons/fa";
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

type TabType = 'images' | 'lights' | 'grocery';

const Dashboard = () => {
  const { lights, groups, refreshData } = useHue();
  const { userImages, setUserImages, currentImageIndex } = useImageContext();
  const { devices: bluetoothDevices } = useBluetooth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
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
