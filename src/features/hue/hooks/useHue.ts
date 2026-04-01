// src/features/hue/hooks/useHue.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Light, LightGroup } from '../../../shared/types';
import { hueRemoteAPI } from '../services/hue-remote-api';

// Determine API mode: remote (cloud) or local (bridge)
const isRemoteMode = (): boolean => {
  return hueRemoteAPI.isConfigured() && window.location.protocol === "https:";
};

const useHue = () => {
  const bridgeIp = import.meta.env.VITE_HUE_BRIDGE_IP;
  const username = import.meta.env.VITE_HUE_USERNAME;
  const remoteMode = isRemoteMode();

  const [lights, setLights] = useState<Light[]>([]);
  const [groups, setGroups] = useState<LightGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ========== LOCAL API (HTTP to bridge) ==========
  const fetchLightsLocal = async () => {
    const response = await axios.get<Record<string, Omit<Light, 'id'>>>(
      `http://${bridgeIp}/api/${username}/lights`
    );
    return Object.entries(response.data).map(([id, light]) => ({
      id,
      ...light
    }));
  };

  const fetchGroupsLocal = async () => {
    const response = await axios.get<Record<string, any>>(
      `http://${bridgeIp}/api/${username}/groups`
    );
    
    return Object.entries(response.data).map(([id, group]) => ({
      id,
      name: group.name || 'Unnamed Group',
      lights: group.lights || [],
      type: group.type || 'LightGroup',
      state: {
        all_on: group.state?.all_on || false,
        any_on: group.state?.any_on || false
      },
      action: {
        on: group.action?.on || false,
        bri: group.action?.bri || 254,
        hue: group.action?.hue || 0,
        sat: group.action?.sat || 0,
        effect: group.action?.effect || 'none',
        xy: group.action?.xy || [0, 0],
        ct: group.action?.ct || 0,
        alert: group.action?.alert || 'none',
        colormode: group.action?.colormode || 'none'
      }
    }));
  };

  // ========== REMOTE API (HTTPS cloud) ==========
  const fetchLightsRemote = async () => {
    const data = await hueRemoteAPI.getLights();
    return Object.entries(data).map(([id, light]: [string, any]) => ({
      id,
      ...light
    }));
  };

  const fetchGroupsRemote = async () => {
    const data = await hueRemoteAPI.getGroups();
    
    return Object.entries(data).map(([id, group]: [string, any]) => ({
      id,
      name: group.name || 'Unnamed Group',
      lights: group.lights || [],
      type: group.type || 'LightGroup',
      state: {
        all_on: group.state?.all_on || false,
        any_on: group.state?.any_on || false
      },
      action: {
        on: group.action?.on || false,
        bri: group.action?.bri || 254,
        hue: group.action?.hue || 0,
        sat: group.action?.sat || 0,
        effect: group.action?.effect || 'none',
        xy: group.action?.xy || [0, 0],
        ct: group.action?.ct || 0,
        alert: group.action?.alert || 'none',
        colormode: group.action?.colormode || 'none'
      }
    }));
  };

  // ========== UNIFIED METHODS ==========
  const fetchLights = useCallback(async () => {
    try {
      return remoteMode ? await fetchLightsRemote() : await fetchLightsLocal();
    } catch (err) {
      throw new Error('Failed to fetch lights');
    }
  }, [remoteMode, bridgeIp, username]);

  const fetchGroups = useCallback(async () => {
    try {
      return remoteMode ? await fetchGroupsRemote() : await fetchGroupsLocal();
    } catch (err) {
      throw new Error('Failed to fetch groups');
    }
  }, [remoteMode, bridgeIp, username]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Check remote auth first
      if (remoteMode && !hueRemoteAPI.isAuthenticated()) {
        if (hueRemoteAPI.hasRefreshToken()) {
          await hueRemoteAPI.refreshAccessToken();
        }
        if (!hueRemoteAPI.isAuthenticated()) {
          throw new Error('Not authenticated with Hue Cloud');
        }
      }

      const [lightsData, groupsData] = await Promise.all([
        fetchLights(),
        fetchGroups()
      ]);
      setLights(lightsData);
      setGroups(groupsData);
    } catch (err: any) {
      console.error('[useHue] Error:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchLights, fetchGroups, remoteMode]);

  // Set light state
  const setLightState = useCallback(async (lightId: string, state: Record<string, any>) => {
    try {
      if (remoteMode) {
        await hueRemoteAPI.setLightState(lightId, state);
      } else {
        await axios.put(`http://${bridgeIp}/api/${username}/lights/${lightId}/state`, state);
      }
    } catch (err) {
      console.error('[useHue] setLightState error:', err);
      throw err;
    }
  }, [remoteMode, bridgeIp, username]);

  // Set group action
  const setGroupAction = useCallback(async (groupId: string, action: Record<string, any>) => {
    try {
      if (remoteMode) {
        await hueRemoteAPI.setGroupAction(groupId, action);
      } else {
        await axios.put(`http://${bridgeIp}/api/${username}/groups/${groupId}/action`, action);
      }
    } catch (err) {
      console.error('[useHue] setGroupAction error:', err);
      throw err;
    }
  }, [remoteMode, bridgeIp, username]);

  useEffect(() => {
    // Only auto-fetch if we can (local mode or already authenticated)
    if (!remoteMode || hueRemoteAPI.isAuthenticated() || hueRemoteAPI.hasRefreshToken()) {
      refreshData();
    } else {
      setLoading(false);
    }
  }, []);

  return { 
    lights, 
    groups, 
    loading, 
    error, 
    refreshData,
    setLightState,
    setGroupAction,
    isRemoteMode: remoteMode,
  };
};

export default useHue;