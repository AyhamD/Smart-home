// src/context/BluetoothContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { BluetoothContextType, BluetoothDevice, BRmeshDevice } from '../types';

const BluetoothContext = createContext<BluetoothContextType>({} as BluetoothContextType);
declare global {
    interface Navigator {
      bluetooth: {
        requestDevice: (options: { filters: { services: string[] }[], optionalServices: string[] }) => Promise<BluetoothDevice>;
      };
    }
  }
export const BluetoothProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [devices, setDevices] = useState<BRmeshDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const hasConnectedDevices = devices.some(device => device.connected);

  const scanDevices = async () => {
    setIsScanning(true);
    try {
      // BRmesh-specific scanning logic
      const bluetoothDevices = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }], // BRmesh service UUID
        optionalServices: ['battery_service']
      });
      
      // Add discovered devices to state
      setDevices(prev => [
        ...prev,
        {
          id: bluetoothDevices.id,
          name: bluetoothDevices.name || 'BRmesh Device',
          connected: bluetoothDevices.gatt?.connected || false,
          brightness: 100,
          on: false
        }
      ]);
      console.log('Bluetooth scan complete:', devices);
    } catch (error) {
      console.error('Bluetooth scan failed:', error);
    }
    setIsScanning(false);
  };

  const toggleDevice = async (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId ? { ...device, on: !device.on } : device
    ));
    // Implement actual Bluetooth command here
  };

  const setBrightness = async (deviceId: string, brightness: number) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId ? { ...device, brightness } : device
    ));
    // Implement actual Bluetooth command here
  };

  return (
    <BluetoothContext.Provider value={{ devices, isScanning,hasConnectedDevices, scanDevices, toggleDevice, setBrightness }}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => useContext(BluetoothContext);