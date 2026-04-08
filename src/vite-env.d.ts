/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUE_BRIDGE_IP: string;
  readonly VITE_HUE_USERNAME: string;
  readonly VITE_MY_IP_ADDRESS: string;
  readonly VITE_GIST_ID: string;
  readonly VITE_GITHUB_TOKEN: string;
  readonly VITE_DRIVE_SCRIPT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}