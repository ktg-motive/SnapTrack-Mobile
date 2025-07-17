# EAS Automated Release Setup - Completion Guide

**Date:** January 8, 2025  
**Status:** Configuration Complete, API Key Setup Pending  
**Next Session:** Complete Apple App Store Connect API Key setup

## What's Already Configured ✅

### 1. EAS Submit Configuration (`eas.json`)
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "kai@motiveinc.com",
      "ascAppId": "6740468031",
      "sku": "snaptrack-mobile",
      "autoSubmit": true,
      "testFlight": {
        "skipBetaAppReview": true,
        "releaseNotes": {
          "en-US": "docs/releases/testflight/current.txt"
        }
      }
    },
    "android": {
      "track": "internal",
      "autoSubmit": true,
      "releaseNotes": {
        "en-US": "docs/releases/firebase/current.md"
      }
    }
  }
}
```

### 2. Release Notes System
- ✅ **TestFlight Release Notes:** `docs/releases/testflight/current.txt`
- ✅ **Firebase Release Notes:** `docs/releases/firebase/current.md`
- ✅ **Template Structure:** Clean, emoji-free format for TestFlight compliance

### 3. Version Update Script
- ✅ **Script Location:** `scripts/update-version.sh` (executable)
- ✅ **Auto-updates:** `app.config.js`, `package.json`, creates versioned release notes
- ✅ **Usage:** `./scripts/update-version.sh 1.2.2 6`

### 4. Documentation
- ✅ **Complete Release Plan:** `docs/EAS_RELEASE_PLAN.md`
- ✅ **Setup Guide:** This document

## Required Next Steps 🔑

### Apple App Store Connect API Key Setup

**1. Generate API Key in App Store Connect:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to Users and Access > Keys
3. Click "Generate API Key"
4. Name: "EAS SnapTrack Mobile"
5. Access: "Developer" role
6. Download the `.p8` file (keep it secure)
7. Note the Key ID and Issuer ID

**2. Add API Key to EAS Secrets:**
```bash
# Replace with your actual values
eas secret:create --scope project --name EXPO_APPLE_APP_STORE_CONNECT_API_KEY_ID --value YOUR_KEY_ID
eas secret:create --scope project --name EXPO_APPLE_APP_STORE_CONNECT_API_KEY_ISSUER_ID --value YOUR_ISSUER_ID
eas secret:create --scope project --name EXPO_APPLE_APP_STORE_CONNECT_API_KEY --value-file path/to/AuthKey_YOUR_KEY_ID.p8
```

**3. Optional: Android Service Account (for Google Play)**
- Only needed if you want to submit to Google Play instead of Firebase App Distribution
- Current configuration uses Firebase App Distribution (internal track)

## Test the Complete Workflow 🚀

Once API keys are set up, test with the next release:

### Step 1: Update Version
```bash
./scripts/update-version.sh 1.2.2 6
```

### Step 2: Update Release Notes
```bash
# Edit these files with new release info:
# docs/releases/testflight/current.txt
# docs/releases/firebase/current.md
```

### Step 3: Commit and Build
```bash
git add .
git commit -m "Release v1.2.2 - [Description]"
git tag v1.2.2
git push origin main --tags

# Build and auto-submit to TestFlight + Firebase
eas build --platform all --auto-submit
```

### Step 4: Monitor
```bash
# Check build status
eas build:list --limit 2

# Check TestFlight processing
# (Check App Store Connect TestFlight tab)
```

## Expected Results

### TestFlight (iOS)
- ✅ **No Beta App Review** - Direct to internal testing
- ✅ **Automatic Distribution** - Available to your 6 internal testers
- ✅ **Release Notes** - Auto-populated from `current.txt`
- ✅ **Build Time** - Available ~15-30 minutes after EAS build completes

### Firebase App Distribution (Android)
- ✅ **Internal Track** - Available to configured testers
- ✅ **Release Notes** - Auto-populated from `current.md`
- ✅ **Build Time** - Available ~5-10 minutes after EAS build completes

## Files Created/Modified

### New Files
- `docs/EAS_RELEASE_PLAN.md` - Complete release strategy
- `docs/EAS_SETUP_COMPLETION.md` - This document
- `docs/releases/testflight/current.txt` - TestFlight release notes template
- `docs/releases/firebase/current.md` - Firebase release notes template
- `scripts/update-version.sh` - Version update automation

### Modified Files
- `eas.json` - Added complete submit configuration

## Troubleshooting

### Common Issues After API Key Setup
1. **"Invalid API key"** - Check Key ID and Issuer ID match App Store Connect
2. **"App not found"** - Verify `ascAppId: "6740468031"` matches your app
3. **"Build already exists"** - Increment build number in `app.config.js`

### Quick Fixes
```bash
# Check EAS secrets
eas secret:list

# Delete and recreate secret if needed
eas secret:delete --name EXPO_APPLE_APP_STORE_CONNECT_API_KEY_ID
eas secret:create --scope project --name EXPO_APPLE_APP_STORE_CONNECT_API_KEY_ID --value NEW_VALUE
```

## Success Validation

### First Successful Release Will Show:
- ✅ EAS build completes without API key errors
- ✅ TestFlight shows new build in "SnapTrack Mobile" internal group
- ✅ Firebase App Distribution shows new build available
- ✅ Release notes appear correctly in both platforms
- ✅ No Beta App Review required (direct to internal testing)

## Next Session Tasks

1. **Generate Apple App Store Connect API Key**
2. **Add API Key to EAS Secrets**
3. **Test complete workflow with v1.2.2 or v1.2.3**
4. **Validate TestFlight distribution works without Beta App Review**
5. **Document any platform-specific edge cases**

---

**Ready for Production:** Once API key is set up, this system will handle all releases automatically with the simple workflow above.

**Benefits:**
- No manual TestFlight uploads
- No Beta App Review delays
- Consistent release notes across platforms
- Automated version management
- $19/month EAS subscription fully utilized