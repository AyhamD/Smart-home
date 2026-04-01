// Hue Remote API Service - OAuth 2.0 based cloud access
// Docs: https://developers.meethue.com/develop/hue-api-v2/

const HUE_AUTH_URL = "https://api.meethue.com/v2/oauth2/authorize";
// Use our serverless proxies to avoid CORS issues
const HUE_TOKEN_PROXY = "/api/hue-token";
const HUE_API_PROXY = "/api/hue"; // Proxy for all API calls

// Storage keys
const ACCESS_TOKEN_KEY = "hue_access_token";
const REFRESH_TOKEN_KEY = "hue_refresh_token";
const TOKEN_EXPIRY_KEY = "hue_token_expiry";

interface HueTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

interface HueRemoteConfig {
  clientId: string;
  clientSecret: string;
  appId: string;
  redirectUri: string;
}

class HueRemoteAPI {
  private config: HueRemoteConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_HUE_CLIENT_ID || "",
      clientSecret: import.meta.env.VITE_HUE_CLIENT_SECRET || "",
      appId: import.meta.env.VITE_HUE_APP_ID || "",
      redirectUri: import.meta.env.VITE_HUE_REDIRECT_URI || `${window.location.origin}/oauth/callback`,
    };

    // Load tokens from storage
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    this.tokenExpiry = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY) || "0", 10);
  }

  private saveTokens(tokens: HueTokens) {
    const expiry = Date.now() + tokens.expires_in * 1000;
    
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiry = expiry;

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  isAuthenticated(): boolean {
    return !!(this.accessToken && this.tokenExpiry > Date.now());
  }

  hasRefreshToken(): boolean {
    return !!this.refreshToken;
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(): string {
    const state = crypto.randomUUID();
    sessionStorage.setItem("hue_oauth_state", state);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      state: state,
      redirect_uri: this.config.redirectUri,
    });

    console.log("[HueRemote] Auth URL:", `${HUE_AUTH_URL}?${params.toString()}`);
    console.log("[HueRemote] Redirect URI:", this.config.redirectUri);
    
    return `${HUE_AUTH_URL}?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, state: string): Promise<boolean> {
    const savedState = sessionStorage.getItem("hue_oauth_state");
    if (state !== savedState) {
      console.error("[HueRemote] State mismatch - possible CSRF attack");
      return false;
    }
    sessionStorage.removeItem("hue_oauth_state");

    try {
      console.log("[HueRemote] Exchanging code for tokens via proxy...");
      console.log("[HueRemote] Redirect URI:", this.config.redirectUri);

      // Use our serverless proxy to avoid CORS issues
      const response = await fetch(HUE_TOKEN_PROXY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("[HueRemote] Token exchange failed:", response.status, error);
        return false;
      }

      const tokens: HueTokens = await response.json();
      
      if (tokens.error) {
        console.error("[HueRemote] Token error:", tokens);
        return false;
      }
      
      console.log("[HueRemote] Token exchange successful");
      this.saveTokens(tokens);
      console.log("[HueRemote] Successfully authenticated");
      return true;
    } catch (err) {
      console.error("[HueRemote] Token exchange error:", err);
      return false;
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      console.error("[HueRemote] No refresh token available");
      return false;
    }

    try {
      // Use our serverless proxy to avoid CORS issues
      const response = await fetch(HUE_TOKEN_PROXY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        console.error("[HueRemote] Token refresh failed, clearing tokens");
        this.clearTokens();
        return false;
      }

      const tokens: HueTokens = await response.json();
      
      if (tokens.error) {
        console.error("[HueRemote] Token refresh error:", tokens);
        this.clearTokens();
        return false;
      }
      
      this.saveTokens(tokens);
      console.log("[HueRemote] Token refreshed successfully");
      return true;
    } catch (err) {
      console.error("[HueRemote] Token refresh error:", err);
      return false;
    }
  }

  // Ensure valid token before API calls
  private async ensureValidToken(): Promise<boolean> {
    if (this.isAuthenticated()) {
      return true;
    }

    if (this.hasRefreshToken()) {
      return await this.refreshAccessToken();
    }

    return false;
  }

  // Make authenticated API request via proxy
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!await this.ensureValidToken()) {
      throw new Error("Not authenticated");
    }

    // Use proxy to avoid CORS - endpoint like "/lights" becomes "/api/hue/lights"
    const url = `${HUE_API_PROXY}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      // Token might have expired, try refresh
      if (await this.refreshAccessToken()) {
        // Retry request with new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        return retryResponse.json();
      }
      throw new Error("Authentication failed");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[HueRemote] API error:", response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  // Hue API methods
  async getLights(): Promise<Record<string, any>> {
    return this.request("/lights");
  }

  async getGroups(): Promise<Record<string, any>> {
    return this.request("/groups");
  }

  async setLightState(lightId: string, state: Record<string, any>): Promise<any> {
    return this.request(`/lights/${lightId}/state`, {
      method: "PUT",
      body: JSON.stringify(state),
    });
  }

  async setGroupAction(groupId: string, action: Record<string, any>): Promise<any> {
    return this.request(`/groups/${groupId}/action`, {
      method: "PUT",
      body: JSON.stringify(action),
    });
  }

  async getConfig(): Promise<Record<string, any>> {
    return this.request("/config");
  }
}

// Singleton instance
export const hueRemoteAPI = new HueRemoteAPI();
export default hueRemoteAPI;
