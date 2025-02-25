// src/services/hue-bridge-manager.ts
interface HueBridgeConfig {
  id: string;
  ip: string;
  username?: string;
  friendlyName: string;
  lastConnected: Date;
}

export class HueBridgeManager {
  private static STORAGE_KEY = "hueBridges";
  private bridges: HueBridgeConfig[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private mergeDiscoveredBridges(newBridges: HueBridgeConfig[]): void {
    this.bridges = [...this.bridges, ...newBridges].filter(
      (bridge, index, self) =>
        index === self.findIndex((b) => b.id === bridge.id)
    );
  }

  private async showModal(options: {
    title: string;
    message: string;
    confirmText?: string;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      // Create modal elements
      const modal = document.createElement("div");
      modal.className = "link-button-modal";

      modal.innerHTML = `
            <div class="modal-content">
              <h2>${options.title}</h2>
              <p>${options.message}</p>
              <button id="confirm">I pressed it</button>
              <button id="cancel">Cancel</button>
            </div>
          `;

      // Handle events
      modal.querySelector("#confirm")?.addEventListener("click", () => {
        document.body.removeChild(modal);
        resolve(true);
      });

      modal.querySelector("#cancel")?.addEventListener("click", () => {
        document.body.removeChild(modal);
        resolve(false);
      });

      document.body.appendChild(modal);
    });
  }
  
  async discoverBridges(): Promise<HueBridgeConfig[]> {
    try {
      // Use Philips Hue's official discovery endpoint
      const response = await fetch('https://discovery.meethue.com/');
      const data = await response.json();
      
      const discoveredBridges: HueBridgeConfig[] = data.map((bridge: any) => ({
        id: bridge.id,
        ip: bridge.internalipaddress,
        friendlyName: bridge.name || 'Philips Hue Bridge',
        lastConnected: new Date()
      }));
  
      this.mergeDiscoveredBridges(discoveredBridges);
      return this.bridges;
    } catch (error) {
      console.error('Discovery failed:', error);
      return [];
    }
  }

  // Authenticate with a bridge
  async authenticateBridge(bridgeIp: string): Promise<string> {
    const linkButtonPressed = await this.promptLinkButton();
    if (!linkButtonPressed) throw new Error("Link button not pressed");

    const response = await fetch(`http://${bridgeIp}/api`, {
      method: "POST",
      body: JSON.stringify({ devicetype: "my_hue_app#user" }),
    });

    const data = await response.json();
    if (data[0]?.error) throw new Error(data[0].error.description);

    return data[0].success.username;
  }

  // Store bridge configuration
  async addBridge(config: HueBridgeConfig): Promise<void> {
    const existing = this.bridges.find((b) => b.id === config.id);
    if (!existing) {
      this.bridges.push(config);
    } else {
      Object.assign(existing, config);
    }
    this.saveToStorage();
  }
  async promptLinkButton(): Promise<boolean> {
    return new Promise((resolve) => {
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = `
        <div class="link-button-modal">
          <div class="modal-content">
            <h2>Press Link Button</h2>
            <p>Please press the link button on your Hue Bridge within 30 seconds</p>
            <div class="button-group">
              <button id="confirm">I Pressed It</button>
              <button id="cancel">Cancel</button>
            </div>
          </div>
        </div>
      `;

      const confirm = modalContainer.querySelector('#confirm');
      const cancel = modalContainer.querySelector('#cancel');

      const cleanup = () => {
        document.body.removeChild(modalContainer);
      };

      confirm?.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      cancel?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      document.body.appendChild(modalContainer);
    });
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(HueBridgeManager.STORAGE_KEY);
    this.bridges = stored ? JSON.parse(stored) : [];
  }

  private saveToStorage() {
    localStorage.setItem(
      HueBridgeManager.STORAGE_KEY,
      JSON.stringify(this.bridges)
    );
  }
}
