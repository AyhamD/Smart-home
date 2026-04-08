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

interface DriveDeleteResponse {
  success: boolean;
  error?: string;
}

/**
 * Check if Google Drive storage is configured
 */
export const isDriveConfigured = (): boolean => {
  return !!DRIVE_SCRIPT_URL && DRIVE_SCRIPT_URL.length > 0;
};

/**
 * Check if a URL is a Google Drive URL
 */
export const isDriveUrl = (url: string): boolean => {
  return url?.includes('drive.google.com') || url?.includes('googleusercontent.com');
};

/**
 * Extract file ID from a Google Drive URL
 */
export const extractDriveFileId = (url: string): string | null => {
  if (!url) return null;
  // Format: https://drive.google.com/uc?export=view&id=FILE_ID
  const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Format: https://drive.google.com/file/d/FILE_ID/view
  const match2 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match2 ? match2[1] : null;
};

/**
 * Delete a receipt image from Google Drive
 * @param imageUrl - The Google Drive URL of the image to delete
 * @returns true if deleted successfully, false otherwise
 */
export const deleteReceiptImage = async (imageUrl: string): Promise<boolean> => {
  if (!isDriveConfigured()) {
    console.log('[Drive] Not configured, skipping delete');
    return false;
  }

  if (!isDriveUrl(imageUrl)) {
    console.log('[Drive] Not a Drive URL, skipping delete');
    return false;
  }

  const fileId = extractDriveFileId(imageUrl);
  if (!fileId) {
    console.warn('[Drive] Could not extract file ID from URL:', imageUrl);
    return false;
  }

  try {
    console.log(`[Drive] Deleting file ${fileId}...`);
    
    const response = await fetch(DRIVE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'delete',
        fileId,
      }),
    });

    if (response.ok) {
      const data: DriveDeleteResponse = await response.json();
      if (data.success) {
        console.log('[Drive] File deleted successfully');
        return true;
      } else {
        console.error('[Drive] Delete failed:', data.error);
        return false;
      }
    } else {
      console.error('[Drive] HTTP error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[Drive] Delete error:', error);
    return false;
  }
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
): Promise<{ url: string; fileId: string } | null> => {
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
        action: 'upload',
        image: base64Image,
        fileName,
        weekId,
      }),
    });

    if (response.ok) {
      const data: DriveUploadResponse = await response.json();
      if (data.success && data.directUrl && data.fileId) {
        console.log(`[Drive] Upload successful: ${data.directUrl}`);
        return { url: data.directUrl, fileId: data.fileId };
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
