// Google Drive storage service for receipt images
// Uses a Google Apps Script web app as the backend

const DRIVE_SCRIPT_URL = import.meta.env.VITE_DRIVE_SCRIPT_URL;

interface DriveUploadResponse {
  success: boolean;
  fileId?: string;
  url?: string;
  directUrl?: string;
  error?: string;
}

/**
 * Check if Google Drive storage is configured
 */
export const isDriveConfigured = (): boolean => {
  return !!DRIVE_SCRIPT_URL && DRIVE_SCRIPT_URL.length > 0;
};

/**
 * Upload a receipt image to Google Drive
 * @param base64Image - The base64-encoded image data
 * @param weekId - The week ID for organizing images (e.g., "2026-W15")
 * @param receiptNumber - The receipt number for the filename
 * @returns The direct URL to view the image, or null if upload failed
 */
export const uploadReceiptImage = async (
  base64Image: string,
  weekId: string,
  receiptNumber: number
): Promise<string | null> => {
  if (!isDriveConfigured()) {
    console.log('[Drive] Google Drive not configured - VITE_DRIVE_SCRIPT_URL missing');
    return null;
  }

  if (!base64Image || !base64Image.startsWith('data:image')) {
    console.warn('[Drive] Invalid image data');
    return null;
  }

  try {
    const fileName = `receipt_${receiptNumber}_${Date.now()}.jpg`;
    
    console.log(`[Drive] Uploading ${fileName} to folder ${weekId}...`);
    
    const response = await fetch(DRIVE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', // Avoid CORS preflight
      },
      body: JSON.stringify({
        image: base64Image,
        fileName,
        weekId,
      }),
    });

    if (response.ok) {
      const data: DriveUploadResponse = await response.json();
      if (data.success && data.directUrl) {
        console.log(`[Drive] Upload successful: ${data.directUrl}`);
        return data.directUrl;
      } else {
        console.error('[Drive] Upload failed:', data.error);
        return null;
      }
    } else {
      console.error('[Drive] HTTP error:', response.status);
      return null;
    }
  } catch (error) {
    console.error('[Drive] Upload error:', error);
    return null;
  }
};
