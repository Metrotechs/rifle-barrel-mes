# Multi-Tablet Sync Setup Guide

## Current Status
🟡 **LOCAL MODE ACTIVE** - Each tablet operates independently

## Enable Real-Time Multi-Tablet Sync

### Step 1: Install Firebase
```bash
npm install firebase
```

### Step 2: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Create a new project
3. Enable Realtime Database
4. Set rules to allow read/write:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Step 3: Get Firebase Config
1. Go to Project Settings > General
2. Add a web app or find existing config
3. Copy the Firebase config object

### Step 4: Update App Configuration
1. Open `src/App.tsx`
2. Find the `syncConfig` section (around line 65)
3. Replace with your Firebase config:
```typescript
const syncConfig: SyncConfig = {
  enabled: true, // Change to true
  firebaseConfig: {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id"
  }
};
```

### Step 5: Deploy to All Tablets
- Build and deploy the updated app to all tablets
- All tablets will automatically sync in real-time
- Changes on any tablet instantly appear on all others

## What Gets Synced
- ✅ Barrel creation/updates
- ✅ Operation start/complete status
- ✅ Station progression
- ✅ Timer states
- ✅ All manufacturing data

## Benefits
- 📱 Work on any tablet, see updates everywhere
- ⚡ Real-time synchronization
- 🔄 Automatic conflict resolution
- 💾 Cloud backup of all data
- 👥 Multi-operator support

## Troubleshooting
- Check Firebase console for database activity
- Verify internet connection on all tablets
- Ensure Firebase rules allow read/write access
