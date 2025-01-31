// src/hooks/useLights.ts
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Light } from '../types';

export const useLights = () => {
  const bridgeIp = import.meta.env.VITE_HUE_BRIDGE_IP;
  const username = import.meta.env.VITE_HUE_USERNAME;

  const [lights, setLights] = useState<Light[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLights = async () => {
      try {
        const response = await axios.get<Record<string, Omit<Light, 'id'>>>(
          `http://${bridgeIp}/api/${username}/lights`
        );
        
        const lightsArray = Object.entries(response.data).map(([id, light]) => ({
          id,
          ...light
        }));
        
        setLights(lightsArray);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch lights');
        setLoading(false);
      }
    };

    fetchLights();
  }, [bridgeIp, username]);

  return { lights, loading, error, setLights };
};