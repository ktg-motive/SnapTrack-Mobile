# Native Version Management Guide

**Critical for EAS Builds with Native Directories**

## The Problem

When you have native iOS/Android directories in your Expo project, EAS Build reads version numbers from the native files, NOT from app.config.js or app.json. This can cause version mismatches and failed submissions.

## Files That Need Updating

### iOS Version Files
1. **ios/[AppName].xcodeproj/project.pbxproj**
   - `MARKETING_VERSION` = Your app version (e.g., "1.3.0")
   - `CURRENT_PROJECT_VERSION` = Your build number (e.g., "7")

2. **ios/[AppName]/Info.plist**
   - `CFBundleShortVersionString` = Your app version
   - `CFBundleVersion` = Your build number

### Android Version Files
1. **android/app/build.gradle**
   - `versionName` = Your app version
   - `versionCode` = Your build number (must be integer)

### Expo Configuration Files
1. **app.config.js** or **app.json**
   - `version` = Your app version
   - `ios.buildNumber` = iOS build number (string)
   - `android.versionCode` = Android build number (integer)

2. **package.json**
   - `version` = Your app version (for consistency)

## Version Update Checklist

When releasing a new version:

1. ✅ Update app.config.js/app.json
2. ✅ Update package.json
3. ✅ Update iOS native files (if ios/ directory exists)
4. ✅ Update Android native files (if android/ directory exists)
5. ✅ Commit all changes before building

## Common Issues

### Issue: "Build already exists" error
**Cause:** Version/build number already used in App Store Connect
**Solution:** Increment build number in all files

### Issue: EAS shows wrong version
**Cause:** Native files have different version than app.config.js
**Solution:** Ensure all files are synchronized

### Issue: autoIncrement not working
**Cause:** `autoIncrement` doesn't work with app.config.js
**Solution:** Remove autoIncrement and manage versions manually

## EAS Configuration

For projects with native directories, use:
```json
{
  "cli": {
    "appVersionSource": "local"  // Read from local files
  }
}
```

Avoid:
```json
{
  "cli": {
    "appVersionSource": "remote",  // Can cause confusion
    "autoIncrement": true          // Doesn't work with app.config.js
  }
}
```

## Automated Solution

The release.sh script now automatically updates all version files. Manual updates should follow the same pattern.

## Verification

Before building, verify versions match:
```bash
# Check iOS versions
grep -E "MARKETING_VERSION|CFBundleShortVersionString" ios/**/*.{pbxproj,plist}

# Check Android versions
grep -E "versionName|versionCode" android/app/build.gradle

# Check Expo config
grep -E "version|buildNumber|versionCode" app.config.js
```

All values should be consistent across files!