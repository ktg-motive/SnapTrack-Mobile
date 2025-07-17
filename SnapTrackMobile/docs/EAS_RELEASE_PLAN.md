# SnapTrack Mobile - EAS Release Plan

**Last Updated:** January 8, 2025  
**EAS Subscription:** $19/month  
**Goal:** Automated releases without Beta App Review

## Release Workflow Overview

### 1. Pre-Release Preparation & Quality Gates
```bash
# Run comprehensive quality gates (REQUIRED)
npm run pre-release

# Quality gates include:
# - Environment validation (Node.js, Expo CLI, EAS CLI)
# - Dependency security audit
# - TypeScript type checking (>90% coverage required)
# - ESLint code quality (<10 warnings, 0 errors)
# - Jest test execution (all tests must pass)
# - Build validation and bundle size checks (<20MB)
# - Security validation (no hardcoded secrets)
# - Performance benchmarks and optimization analysis

# Update version numbers (after quality gates pass)
./scripts/update-version.sh 1.2.2 6

# Update release notes
# Commit changes
# Create git tag
```

### 2. EAS Build & Deploy
```bash
# Build both platforms
eas build --platform all --auto-submit

# Or individual platforms
eas build --platform ios --auto-submit
eas build --platform android --auto-submit
```

### 3. Post-Release
```bash
# Update memory-bank with completion
# Monitor TestFlight/Firebase for availability
# Send notification to testers
```

## Version Management

### Semantic Versioning
- **Major.Minor.Patch** (e.g., 1.2.1)
- **Major:** Breaking changes or major feature releases
- **Minor:** New features, backwards compatible
- **Patch:** Bug fixes, small improvements

### Build Numbers
- **iOS:** Sequential integer (5, 6, 7, etc.)
- **Android:** Sequential version code (5, 6, 7, etc.)
- **Must be higher than previous build for same version**

### Auto-Update Script
```bash
#!/bin/bash
# scripts/update-version.sh
VERSION=$1
BUILD_NUM=$2

# Update app.config.js
sed -i '' "s/version: \".*\"/version: \"$VERSION\"/" app.config.js
sed -i '' "s/buildNumber: \".*\"/buildNumber: \"$BUILD_NUM\"/" app.config.js
sed -i '' "s/versionCode: .*/versionCode: $BUILD_NUM,/" app.config.js

echo "Updated to version $VERSION build $BUILD_NUM"
```

## Release Notes Strategy

### Three-Tier Release Notes
1. **Technical Release Notes** (`docs/releases/vX.X.X.md`)
   - Complete changelog
   - Technical details
   - Developer-focused information

2. **TestFlight Release Notes** (`docs/releases/testflight/vX.X.X.txt`)
   - User-friendly language
   - No emojis or special characters
   - Focus on what testers should test

3. **Firebase Release Notes** (`docs/releases/firebase/vX.X.X.md`)
   - Android-specific details
   - Installation instructions
   - Testing focus areas

### Release Notes Templates

#### TestFlight Template
```
SnapTrack vX.X.X - [Release Type]

[MAIN FEATURE/FIX DESCRIPTION]
- Key improvement 1
- Key improvement 2
- Key improvement 3

TESTING FOCUS:
- Test specific area 1
- Test specific area 2
- Test specific area 3

[Additional context for testers]

Build: X.X.X | Target: iOS 13.0+ | Size: ~15MB
```

#### Firebase Template
```
# SnapTrack Android vX.X.X - Firebase App Distribution

**Release Date:** [Date]
**Version:** X.X.X (Version Code X)
**Platform:** Android
**Distribution:** Firebase App Distribution

## [Release Type Emoji] [Release Type]

### [Main Feature/Fix Title]
**Issue Resolved:** [Description]

**What was happening:**
- Problem description 1
- Problem description 2

**What's fixed:**
- Solution 1
- Solution 2

## 🧪 Testing Instructions
[Detailed testing steps]

## 🔧 Technical Details
[Technical implementation details]

## 📱 Installation Notes
[Installation and compatibility info]
```

## EAS Configuration for TestFlight

### Skip Beta App Review
To avoid external review, configure EAS to submit directly to internal testing:

#### eas.json Configuration
```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "autoSubmit": true
      },
      "android": {
        "buildConfiguration": "Release",
        "autoSubmit": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_ASC_APP_ID",
        "sku": "snaptrack-mobile",
        "testFlight": {
          "skipBetaAppReview": true,
          "releaseNotes": {
            "en-US": "docs/releases/testflight/current.txt"
          }
        }
      },
      "android": {
        "serviceAccountKeyPath": "path/to/service-account.json",
        "track": "internal",
        "releaseNotes": {
          "en-US": "docs/releases/firebase/current.md"
        }
      }
    }
  }
}
```

### Required Setup
1. **Apple App Store Connect API Key**
   - Generate in App Store Connect
   - Add to EAS secrets: `eas secret:create --scope project --name EXPO_APPLE_APP_STORE_CONNECT_API_KEY_ID --value YOUR_KEY_ID`

2. **Android Service Account**
   - Create in Google Play Console
   - Add to EAS secrets: `eas secret:create --scope project --name EXPO_ANDROID_SERVICE_ACCOUNT --value-file path/to/service-account.json`

## Release Process Steps

### 1. Prepare Release
```bash
# Create release branch
git checkout -b release/v1.2.2

# CRITICAL: Run quality gates FIRST (blocks release if fails)
npm run pre-release

# Only proceed if quality gates pass
echo "✅ Quality gates passed - proceeding with release preparation"

# Update version numbers
./scripts/update-version.sh 1.2.2 6

# Create release notes
cp docs/releases/testflight/template.txt docs/releases/testflight/v1.2.2.txt
# Edit release notes

# Commit changes
git add .
git commit -m "Release v1.2.2 - [Description]"
git tag v1.2.2
git push origin release/v1.2.2 --tags
```

### 2. Build and Submit
```bash
# Build both platforms and auto-submit
eas build --platform all --auto-submit

# Monitor build status
eas build:list --limit 2
```

### 3. Post-Release
```bash
# Merge release branch
git checkout main
git merge release/v1.2.2
git push origin main

# Update memory-bank
# Update activeContext.md with release completion
# Update mobileProgress.md with version status
```

## TestFlight Distribution Settings

### Internal Testing (Skip Beta App Review)
- **Automatic Distribution:** Enabled
- **Internal Groups:** SnapTrack Mobile (6 testers)
- **Release Notes:** Auto-populated from EAS config
- **Build Processing:** 5-10 minutes after EAS completion

### External Testing (If Needed)
- **Manual approval required**
- **Beta App Review:** 24-48 hours
- **Use only for major releases**

## Monitoring & Notifications

### Build Status Monitoring
```bash
# Check build status
eas build:list --limit 5

# Get specific build info
eas build:view [BUILD_ID]
```

### Tester Notifications
- **TestFlight:** Automatic notification on new build
- **Firebase:** Manual notification via Firebase Console
- **Slack/Email:** Optional webhook notifications

## Troubleshooting

### Quality Gate Issues
1. **TypeScript compilation fails:** Fix type errors before proceeding
2. **ESLint errors/warnings exceed limits:** Run `npm run lint:fix` or fix manually
3. **Tests failing:** Fix failing tests - all tests must pass
4. **Bundle size exceeds limits:** Optimize images, remove unused dependencies
5. **Security vulnerabilities:** Run `npm audit fix` to resolve
6. **Performance benchmarks fail:** Check bundle size and image optimization

### Common Build Issues
1. **Version already exists:** Increment build number
2. **TestFlight processing stuck:** Check Apple Developer status
3. **Firebase upload fails:** Verify service account permissions
4. **EAS build fails:** Check expo-cli and EAS CLI versions
5. **Quality gates block build:** Review quality gate output and fix issues

### Emergency Rollback
```bash
# Revert to previous version
git revert v1.2.2
./scripts/update-version.sh 1.2.1 7
eas build --platform all --auto-submit
```

## Success Metrics

### Quality Gate Standards
- **TypeScript Coverage:** > 90% of source files
- **ESLint Warnings:** < 10 warnings, 0 errors
- **Test Coverage:** > 70% line coverage
- **Bundle Size:** < 20MB total
- **Build Compilation:** < 30 seconds TypeScript, < 15 seconds ESLint
- **Security:** 0 high-severity vulnerabilities
- **Performance:** No images > 1MB, < 100MB estimated memory usage

### Release Efficiency
- **Quality Gate Time:** Target < 3 minutes
- **Build Time:** Target < 15 minutes
- **TestFlight Availability:** Target < 30 minutes post-build
- **Firebase Availability:** Target < 10 minutes post-build

### Quality Metrics
- **Crash Rate:** < 0.1% on new builds
- **Tester Adoption:** > 80% within 24 hours
- **Feedback Response:** < 2 hours for critical issues
- **Quality Gate Pass Rate:** > 95% on first attempt

---

**Next Steps:**
1. Configure EAS submission settings
2. Set up Apple App Store Connect API key
3. Test the automated workflow with a minor release
4. Document any platform-specific edge cases