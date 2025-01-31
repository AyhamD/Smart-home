// src/hooks/useHue.ts
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Light, LightGroup } from '../types';

const useHue = () => {
  const bridgeIp = import.meta.env.VITE_HUE_BRIDGE_IP;
  const username = import.meta.env.VITE_HUE_USERNAME;

  const [lights, setLights] = useState<Light[]>([]);
  const [groups, setGroups] = useState<LightGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLights = async () => {
    try {
      const response = await axios.get<Record<string, Omit<Light, 'id'>>>(
        `http://${bridgeIp}/api/${username}/lights`
      );
      return Object.entries(response.data).map(([id, light]) => ({
        id,
        ...light
      }));
    } catch (err) {
      throw new Error('Failed to fetch lights');
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get<Record<string, any>>(
        `http://${bridgeIp}/api/${username}/groups`
      );
      
      return Object.entries(response.data).map(([id, group]) => ({
        id,
        name: group.name || 'Unnamed Group',
        lights: group.lights || [], // Ensure array exists
        type: group.type || 'LightGroup'
      }));
    } catch (err) {
      throw new Error('Failed to fetch groups');
    }
  };

  const refreshData = async () => {
    try {
      const [lightsData, groupsData] = await Promise.all([
        fetchLights(),
        fetchGroups()
      ]);
      setLights(lightsData);
      setGroups(groupsData);
      setLoading(false);
    } catch (err :any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return { lights, groups, loading, error, refreshData };
};

export default useHue;