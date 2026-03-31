// GitHub Gist Storage Service for syncing data across devices

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GIST_ID = import.meta.env.VITE_GIST_ID;
const GIST_FILENAME = 'grocery.json';

interface GistFile {
  content: string;
}

interface GistResponse {
  files: {
    [key: string]: GistFile;
  };
}

export const gistStorage = {
  /**
   * Load data from GitHub Gist
   */
  async load<T>(): Promise<T | null> {
    if (!GITHUB_TOKEN || !GIST_ID) {
      console.warn('GitHub Gist credentials not configured');
      return null;
    }

    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load gist: ${response.status}`);
      }

      const data: GistResponse = await response.json();
      const file = data.files[GIST_FILENAME];

      if (!file) {
        console.warn('Grocery file not found in gist');
        return null;
      }

      return JSON.parse(file.content) as T;
    } catch (error) {
      console.error('Error loading from gist:', error);
      return null;
    }
  },

  /**
   * Save data to GitHub Gist
   */
  async save<T>(data: T): Promise<boolean> {
    if (!GITHUB_TOKEN || !GIST_ID) {
      console.warn('GitHub Gist credentials not configured');
      return false;
    }

    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(data, null, 2),
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save gist: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error saving to gist:', error);
      return false;
    }
  },

  /**
   * Check if gist storage is configured
   */
  isConfigured(): boolean {
    return Boolean(GITHUB_TOKEN && GIST_ID);
  },
};
