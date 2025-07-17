#!/bin/bash

# SnapTrack Mobile - Enhanced Version Update Script
# Updates version across all configuration files and validates consistency
# Usage: ./scripts/update-version-enhanced.sh <version> <build_number>
# Example: ./scripts/update-version-enhanced.sh 1.3.1 8

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VERSION=$1
BUILD_NUM=$2

if [ -z "$VERSION" ] || [ -z "$BUILD_NUM" ]; then
    echo "Usage: $0 <version> <build_number>"
    echo "Example: $0 1.3.1 8"
    exit 1
fi

echo -e "${BLUE}🚀 Updating SnapTrack Mobile to version $VERSION build $BUILD_NUM${NC}"
echo "=============================================="

# Validate version format (X.Y.Z)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid version format. Use X.Y.Z (e.g., 1.3.1)${NC}"
    exit 1
fi

# Validate build number is numeric
if ! [[ "$BUILD_NUM" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}❌ Build number must be numeric${NC}"
    exit 1
fi

# Function to update and verify a file
update_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${BLUE}Updating $description...${NC}"
        echo "  File: $file"
        return 0
    else
        echo -e "${RED}❌ $description not found at: $file${NC}"
        return 1
    fi
}

# Track success
ERRORS=0

# 1. Update app.config.js
if update_file "app.config.js" "Expo configuration"; then
    # Update version
    sed -i '' "s/version: \"[^\"]*\"/version: \"$VERSION\"/" app.config.js
    
    # Update iOS buildNumber
    sed -i '' "s/buildNumber: \"[^\"]*\"/buildNumber: \"$BUILD_NUM\"/" app.config.js
    
    # Update Android versionCode
    sed -i '' "s/versionCode: [0-9]*/versionCode: $BUILD_NUM/" app.config.js
    
    echo -e "${GREEN}  ✅ Updated version, iOS buildNumber, Android versionCode${NC}"
else
    ((ERRORS++))
fi

# 2. Update package.json version
if update_file "package.json" "Package configuration"; then
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" package.json
    echo -e "${GREEN}  ✅ Updated version${NC}"
else
    ((ERRORS++))
fi

# 3. Update native iOS files when they exist
if [ -d "ios" ]; then
    echo -e "${BLUE}Updating iOS native files...${NC}"
    
    # Update Info.plist
    if update_file "ios/SnapTrack/Info.plist" "iOS Info.plist"; then
        sed -i '' "/<key>CFBundleShortVersionString<\/key>/{n;s/<string>[^<]*<\/string>/<string>$VERSION<\/string>/;}" ios/SnapTrack/Info.plist
        sed -i '' "/<key>CFBundleVersion<\/key>/{n;s/<string>[^<]*<\/string>/<string>$BUILD_NUM<\/string>/;}" ios/SnapTrack/Info.plist
        echo -e "${GREEN}  ✅ Updated CFBundleShortVersionString and CFBundleVersion${NC}"
    else
        ((ERRORS++))
    fi
    
    # Update project.pbxproj
    if [ -f "ios/SnapTrack.xcodeproj/project.pbxproj" ]; then
        echo "  Updating Xcode project..."
        sed -i '' "s/MARKETING_VERSION = [^;]*/MARKETING_VERSION = $VERSION/g" ios/SnapTrack.xcodeproj/project.pbxproj
        sed -i '' "s/CURRENT_PROJECT_VERSION = [^;]*/CURRENT_PROJECT_VERSION = $BUILD_NUM/g" ios/SnapTrack.xcodeproj/project.pbxproj
        echo -e "${GREEN}  ✅ Updated MARKETING_VERSION and CURRENT_PROJECT_VERSION${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  iOS directory not found - skipping native iOS updates${NC}"
fi

# 4. Update native Android files when they exist
if [ -d "android" ]; then
    echo -e "${BLUE}Updating Android native files...${NC}"
    
    if update_file "android/app/build.gradle" "Android build.gradle"; then
        sed -i '' "s/versionName \"[^\"]*\"/versionName \"$VERSION\"/" android/app/build.gradle
        sed -i '' "s/versionCode [0-9]*/versionCode $BUILD_NUM/" android/app/build.gradle
        echo -e "${GREEN}  ✅ Updated versionName and versionCode${NC}"
    else
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠️  Android directory not found - skipping native Android updates${NC}"
fi

# 5. Create/Update release notes templates
echo -e "${BLUE}Setting up release notes...${NC}"
RELEASE_DIR="docs/releases"
mkdir -p "$RELEASE_DIR/testflight"
mkdir -p "$RELEASE_DIR/firebase"

# Update current release notes templates with new version
if [ -f "$RELEASE_DIR/testflight/current.txt" ]; then
    # Update version in current TestFlight template
    sed -i '' "s/SnapTrack v[0-9]*\.[0-9]*\.[0-9]*/SnapTrack v$VERSION/" "$RELEASE_DIR/testflight/current.txt"
    sed -i '' "s/Build: [0-9]*\.[0-9]*\.[0-9]*/Build: $VERSION/" "$RELEASE_DIR/testflight/current.txt"
    echo -e "${GREEN}  ✅ Updated TestFlight template${NC}"
else
    # Create default TestFlight template
    cat > "$RELEASE_DIR/testflight/current.txt" << EOF
SnapTrack v$VERSION - Release

WHAT'S NEW:
- [Add your changes here]

IMPROVEMENTS:
- Performance optimizations
- Bug fixes and stability improvements

TESTING FOCUS:
- Test core receipt processing functionality
- Verify image capture and optimization
- Test data synchronization across devices

Build: $VERSION | Target: iOS 13.0+ | Size: ~15MB
EOF
    echo -e "${GREEN}  ✅ Created TestFlight template${NC}"
fi

if [ -f "$RELEASE_DIR/firebase/current.md" ]; then
    # Update version in current Firebase template
    sed -i '' "s/# SnapTrack Android v[0-9]*\.[0-9]*\.[0-9]*/# SnapTrack Android v$VERSION/" "$RELEASE_DIR/firebase/current.md"
    sed -i '' "s/\*\*Version:\*\* [0-9]*\.[0-9]*\.[0-9]*/\*\*Version:\*\* $VERSION/" "$RELEASE_DIR/firebase/current.md"
    sed -i '' "s/Version Code [0-9]*/Version Code $BUILD_NUM/" "$RELEASE_DIR/firebase/current.md"
    sed -i '' "s/- Version: [0-9]*\.[0-9]*\.[0-9]*/- Version: $VERSION/" "$RELEASE_DIR/firebase/current.md"
    sed -i '' "s/- Version Code: [0-9]*/- Version Code: $BUILD_NUM/" "$RELEASE_DIR/firebase/current.md"
    echo -e "${GREEN}  ✅ Updated Firebase template${NC}"
else
    # Create default Firebase template
    cat > "$RELEASE_DIR/firebase/current.md" << EOF
# SnapTrack Android v$VERSION - Firebase App Distribution

**Release Date:** $(date +"%B %d, %Y")  
**Version:** $VERSION (Version Code $BUILD_NUM)  
**Platform:** Android  
**Distribution:** Firebase App Distribution

## 🔧 What's New

### Features & Improvements
- [Add your changes here]

## 🧪 Testing Instructions

1. Install the app from the Firebase link
2. Test core receipt processing features
3. Verify image capture works correctly
4. Test data synchronization
5. Report any issues via the feedback form

## 📱 Installation Notes

- **Min Android Version:** 6.0 (API 23)
- **Target Android Version:** 14 (API 34)
- **App Size:** ~15MB
- **Permissions:** Camera, Storage

## 🔧 Technical Details

- Version: $VERSION
- Version Code: $BUILD_NUM
- Built with: EAS Build
- React Native: 0.79.5
- Expo SDK: 53
EOF
    echo -e "${GREEN}  ✅ Created Firebase template${NC}"
fi

# 6. Verify all versions match
echo ""
echo -e "${BLUE}Verifying version consistency...${NC}"
echo "=============================================="

VERIFICATION_ERRORS=0

# Check app.config.js
if [ -f "app.config.js" ]; then
    APP_CONFIG_VERSION=$(grep -o 'version: "[^"]*"' app.config.js | grep -o '[0-9]*\.[0-9]*\.[0-9]*' | head -1)
    APP_CONFIG_BUILD=$(grep -o 'buildNumber: "[^"]*"' app.config.js | grep -o '[0-9]*' | head -1)
    APP_CONFIG_VCODE=$(grep -o 'versionCode: [0-9]*' app.config.js | grep -o '[0-9]*' | head -1)
    
    echo "app.config.js:"
    echo "  Version: $APP_CONFIG_VERSION $([ "$APP_CONFIG_VERSION" = "$VERSION" ] && echo -e "${GREEN}✓${NC}" || (echo -e "${RED}✗${NC}" && ((VERIFICATION_ERRORS++))))"
    echo "  iOS Build: $APP_CONFIG_BUILD $([ "$APP_CONFIG_BUILD" = "$BUILD_NUM" ] && echo -e "${GREEN}✓${NC}" || (echo -e "${RED}✗${NC}" && ((VERIFICATION_ERRORS++))))"
    echo "  Android Code: $APP_CONFIG_VCODE $([ "$APP_CONFIG_VCODE" = "$BUILD_NUM" ] && echo -e "${GREEN}✓${NC}" || (echo -e "${RED}✗${NC}" && ((VERIFICATION_ERRORS++))))"
fi

# Check package.json
if [ -f "package.json" ]; then
    PACKAGE_VERSION=$(grep -o '"version": "[^"]*"' package.json | grep -o '[0-9]*\.[0-9]*\.[0-9]*' | head -1)
    echo ""
    echo "package.json:"
    echo "  Version: $PACKAGE_VERSION $([ "$PACKAGE_VERSION" = "$VERSION" ] && echo -e "${GREEN}✓${NC}" || (echo -e "${RED}✗${NC}" && ((VERIFICATION_ERRORS++))))"
fi

# Check iOS Info.plist
if [ -f "ios/SnapTrack/Info.plist" ]; then
    IOS_VERSION=$(grep -A1 'CFBundleShortVersionString' ios/SnapTrack/Info.plist | grep '<string>' | sed 's/.*<string>\(.*\)<\/string>.*/\1/' | tr -d '[:space:]')
    IOS_BUILD=$(grep -A1 'CFBundleVersion' ios/SnapTrack/Info.plist | grep '<string>' | sed 's/.*<string>\(.*\)<\/string>.*/\1/' | tr -d '[:space:]')
    echo ""
    echo "iOS Info.plist:"
    echo "  Version: $IOS_VERSION $([ "$IOS_VERSION" = "$VERSION" ] && echo -e "${GREEN}✓${NC}" || (echo -e "${RED}✗${NC}" && ((VERIFICATION_ERRORS++))))"
    echo "  Build: $IOS_BUILD $([ "$IOS_BUILD" = "$BUILD_NUM" ] && echo -e "${GREEN}✓${NC}" || (echo -e "${RED}✗${NC}" && ((VERIFICATION_ERRORS++))))"
fi

# Check Android build.gradle
if [ -f "android/app/build.gradle" ]; then
    ANDROID_VERSION=$(grep -o 'versionName "[^"]*"' android/app/build.gradle | grep -o '[0-9]*\.[0-9]*\.[0-9]*' | head -1)
    ANDROID_CODE=$(grep -o 'versionCode [0-9]*' android/app/build.gradle | grep -o '[0-9]*' | head -1)
    echo ""
    echo "Android build.gradle:"
    echo "  Version: $ANDROID_VERSION $([ "$ANDROID_VERSION" = "$VERSION" ] && echo -e "${GREEN}✓${NC}" || (echo -e "${RED}✗${NC}" && ((VERIFICATION_ERRORS++))))"
    echo "  Code: $ANDROID_CODE $([ "$ANDROID_CODE" = "$BUILD_NUM" ] && echo -e "${GREEN}✓${NC}" || (echo -e "${RED}✗${NC}" && ((VERIFICATION_ERRORS++))))"
fi

# Summary
echo ""
echo "=============================================="
if [ $ERRORS -eq 0 ] && [ $VERIFICATION_ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Version update complete!${NC}"
    echo ""
    echo "Version: $VERSION"
    echo "Build Number: $BUILD_NUM"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Update release notes in docs/releases/testflight/current.txt"
    echo "2. Update release notes in docs/releases/firebase/current.md" 
    echo "3. Test the app locally: npm run ios / npm run android"
    echo "4. Commit changes: git add . && git commit -m 'Bump version to v$VERSION'"
    echo "5. Create tag: git tag v$VERSION"
    echo "6. Build: eas build --platform all --auto-submit"
    echo ""
    echo -e "${YELLOW}Pro tip:${NC} Use './scripts/release.sh' for automated release workflow"
else
    echo -e "${RED}❌ Version update completed with errors${NC}"
    echo "Update errors: $ERRORS"
    echo "Verification errors: $VERIFICATION_ERRORS"
    echo ""
    echo "Please fix the errors above and run again."
    exit 1
fi