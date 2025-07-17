# Firebase App Distribution Auto-Submit Setup

## Overview
EAS is now configured to automatically submit Android builds to Firebase App Distribution.

## Required Setup (One-time)

### 1. Firebase Service Account Key
You need to create and download a Firebase service account JSON file:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `snaptrack-expense`
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Save as `firebase-service-account.json`

### 2. EAS Secret Configuration
Store the service account key as an EAS secret (recommended) or place the file locally:

**Option A: EAS Secret (Recommended)**
```bash
eas secret:create --scope project --name FIREBASE_SERVICE_ACCOUNT --type file --value ./firebase-service-account.json
```

Then update `eas.json`:
```json
"android": {
  "serviceAccountKeyPath": "FIREBASE_SERVICE_ACCOUNT",
  "firebaseAppId": "1:925529316912:android:a9701abee558e46d6d57f5"
}
```

**Option B: Local File**
- Place `firebase-service-account.json` in the project root
- File is excluded from builds via `.easignore`

### 3. Firebase App Distribution Setup
Ensure Firebase App Distribution is enabled for your project:
1. Go to Firebase Console → App Distribution
2. Enable the service
3. Add testers and groups as needed

## Current Configuration

### EAS Configuration (`eas.json`)
- **Firebase App ID**: `1:925529316912:android:a9701abee558e46d6d57f5`
- **Service Account**: `./firebase-service-account.json`
- **Auto-submit**: Enabled for Android production builds

### Build Script Updates
- `build-android-fast.sh` now uses `--auto-submit` flag
- Builds will automatically upload to Firebase App Distribution
- No manual upload needed

### Build Optimization
Updated `.easignore` to exclude:
- Security files (API keys, certificates)
- Documentation files
- Test files and coverage reports
- Development artifacts
- IDE files and logs

## Usage
```bash
# Android build with auto-Firebase submission
./scripts/build-android-fast.sh
```

The build will:
1. Run quality gates
2. Build Android APK
3. Automatically submit to Firebase App Distribution
4. Notify testers (if configured in Firebase)

## Troubleshooting
If auto-submit fails:
1. Check Firebase service account permissions
2. Verify Firebase App Distribution is enabled
3. Check EAS build logs for submission errors
4. Fall back to manual upload if needed