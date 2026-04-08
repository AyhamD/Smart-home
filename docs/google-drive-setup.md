# Google Drive Receipt Storage Setup

This guide helps you set up Google Drive storage for receipt images.

## Step 1: Create Google Apps Script

1. Go to https://script.google.com
2. Click **New Project**
3. Replace the code with the following:

```javascript
// Google Apps Script - Receipt Image Storage
// Deploy this as a Web App to save receipt images to your Google Drive

// IMPORTANT: Replace this with YOUR folder ID from the URL
// https://drive.google.com/drive/folders/1QpWtXFqAZbLzpqxO_2pd4nl7H8sFFJZJ
const FOLDER_ID = '1QpWtXFqAZbLzpqxO_2pd4nl7H8sFFJZJ';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const base64Image = data.image;
    const fileName = data.fileName || `receipt_${new Date().getTime()}.jpg`;
    const weekId = data.weekId || 'unknown';
    
    // Get the folder
    const folder = DriveApp.getFolderById(FOLDER_ID);
    
    // Create a subfolder for the week if it doesn't exist
    let weekFolder;
    const weekFolders = folder.getFoldersByName(weekId);
    if (weekFolders.hasNext()) {
      weekFolder = weekFolders.next();
    } else {
      weekFolder = folder.createFolder(weekId);
    }
    
    // Decode base64 and create the file
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const blob = Utilities.newBlob(Utilities.base64Decode(imageData), 'image/jpeg', fileName);
    const file = weekFolder.createFile(blob);
    
    // Make it accessible via link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const result = {
      success: true,
      fileId: file.getId(),
      url: file.getUrl(),
      directUrl: `https://drive.google.com/uc?export=view&id=${file.getId()}`
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Receipt storage API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Save** (Ctrl+S)
5. Name the project: "Receipt Storage"

## Step 2: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Configure:
   - **Description**: Receipt Storage API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Click **Authorize access** and allow permissions
6. **Copy the Web app URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

## Step 3: Add URL to Your App

Create or edit your `.env` file in the project root and add:

```
VITE_DRIVE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Then restart your dev server or redeploy to Vercel.

For **Vercel deployment**, add the environment variable in:
- Vercel Dashboard → Your Project → Settings → Environment Variables
- Name: `VITE_DRIVE_SCRIPT_URL`
- Value: Your Apps Script URL

## How It Works

- Receipt images are uploaded to Google Drive when you scan them
- Images are organized in folders by week (e.g., "2026-W15")
- A direct link URL is saved in your app data instead of the base64 image
- This completely avoids iOS localStorage limits
- Images are accessible via shareable Google Drive links

## Troubleshooting

- **Authorization error**: Re-deploy the script and authorize again
- **Folder not found**: Make sure the FOLDER_ID in the script matches your folder URL
- **Upload fails silently**: Check the Apps Script execution logs (View → Execution log)
- **Need to redeploy?**: Click Deploy → Manage deployments → Edit → Version: New version → Deploy
