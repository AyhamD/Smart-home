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

const Dashboard = () => {
  const { lights, groups, loading, error, refreshData } = useHue();
  const { userImages, setUserImages, currentImageIndex } = useImageContext();
  const {
    devices: bluetoothDevices,
    isScanning,
    scanDevices,
    hasConnectedDevices,
  } = useBluetooth();
  const navigate = useNavigate();

  const allDevices = [
    ...groups.map((g) => ({ ...g, type: "hue" })),
    // ...bluetoothDevices.map(d => ({ ...d, type: 'bluetooth' }))
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
        // Implement BRmesh Bluetooth command here
        console.log(`Toggling BRmesh device ${groupId}`);
      }
    }
  };

  const OpenLights = (groupId: string) => {
    navigate(`/hue-control/lights/${groupId}`);
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

  if (loading) return <div className="loading-screen">Initializing...</div>;
  if (error) return <div className="error-screen">{error}</div>;
  // console.log(bluetoothDevices);
  return (
    <div className="dashboard-container">
      <Header />

      <div className="main-content">
        <div className="lights-grid">
          {/* {!hasConnectedDevices && (
            <div className="bluetooth-controls">
              <button
                onClick={scanDevices}
                disabled={isScanning}
                className="scan-button"
              >
                {isScanning ? "Scanning..." : "Scan BRmesh Devices"}
              </button>
              {bluetoothError && (
                <div className="error-message">{bluetoothError}</div>
              )}
            </div>
          )} */}
          {allDevices.map((group) => (
            <GroupCard
              key={group.id}
              group={group as any}
              isActive={isGroupActive(group as any)}
              onToggle={() => handleGroupToggle(group.id, group.type as any)}
              onClick={() => OpenLights(group.id)}
              type={group.type as any}
            />
          ))}
        </div>

        <div className="image-carousel">
          <ImageUploader onImagesSelected={setUserImages} />
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
  );
};

export default Dashboard;
