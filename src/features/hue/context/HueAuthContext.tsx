// Hue OAuth Context - manages authentication state
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { hueRemoteAPI } from "../services/hue-remote-api";

interface HueAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isRemoteMode: boolean; // true = cloud API, false = local bridge
  error: string | null;
  login: () => void;
  logout: () => void;
  handleOAuthCallback: (code: string, state: string) => Promise<boolean>;
}

const HueAuthContext = createContext<HueAuthContextType | undefined>(undefined);

export const HueAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if we should use remote mode
  // Remote mode is used when: 1) Remote API is configured, AND 2) we're on HTTPS (Vercel)
  const isRemoteMode = hueRemoteAPI.isConfigured() && window.location.protocol === "https:";

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      if (!isRemoteMode) {
        // Local mode - no OAuth needed
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Remote mode - check if we have valid tokens
      if (hueRemoteAPI.isAuthenticated()) {
        setIsAuthenticated(true);
      } else if (hueRemoteAPI.hasRefreshToken()) {
        // Try to refresh token
        const refreshed = await hueRemoteAPI.refreshAccessToken();
        setIsAuthenticated(refreshed);
        if (!refreshed) {
          setError("Session expired. Please login again.");
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [isRemoteMode]);

  const login = useCallback(() => {
    if (!hueRemoteAPI.isConfigured()) {
      setError("Hue Remote API not configured. Please add VITE_HUE_CLIENT_ID and VITE_HUE_CLIENT_SECRET to .env");
      return;
    }
    
    const authUrl = hueRemoteAPI.getAuthorizationUrl();
    window.location.href = authUrl;
  }, []);

  const logout = useCallback(() => {
    hueRemoteAPI.clearTokens();
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const handleOAuthCallback = useCallback(async (code: string, state: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const success = await hueRemoteAPI.exchangeCodeForTokens(code, state);
    
    if (success) {
      setIsAuthenticated(true);
    } else {
      setError("Failed to complete authentication. Please try again.");
    }

    setIsLoading(false);
    return success;
  }, []);

  return (
    <HueAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isRemoteMode,
        error,
        login,
        logout,
        handleOAuthCallback,
      }}
    >
      {children}
    </HueAuthContext.Provider>
  );
};

export const useHueAuth = () => {
  const context = useContext(HueAuthContext);
  if (!context) {
    throw new Error("useHueAuth must be used within a HueAuthProvider");
  }
  return context;
};
