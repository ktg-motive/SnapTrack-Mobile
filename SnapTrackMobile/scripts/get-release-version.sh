#!/bin/bash

# Get accurate version information for release notes
# This script reads from the ACTUAL sources that EAS uses

echo "=== SnapTrack Version Information ==="
echo "Generated: $(date)"
echo ""

# Function to extract iOS versions
get_ios_versions() {
    echo "iOS Versions (from native files):"
    
    # Check project.pbxproj
    if [ -f "ios/SnapTrack.xcodeproj/project.pbxproj" ]; then
        MARKETING_VERSION=$(grep -m1 "MARKETING_VERSION = " ios/SnapTrack.xcodeproj/project.pbxproj | sed 's/.*MARKETING_VERSION = \(.*\);/\1/')
        PROJECT_VERSION=$(grep -m1 "CURRENT_PROJECT_VERSION = " ios/SnapTrack.xcodeproj/project.pbxproj | sed 's/.*CURRENT_PROJECT_VERSION = \(.*\);/\1/')
        echo "  Version: $MARKETING_VERSION"
        echo "  Build: $PROJECT_VERSION"
    else
        echo "  ❌ Native iOS files not found"
    fi
    
    # Verify with Info.plist
    if [ -f "ios/SnapTrack/Info.plist" ]; then
        echo "  Info.plist verification:"
        plutil -p ios/SnapTrack/Info.plist | grep -E "CFBundleShortVersionString|CFBundleVersion" | sed 's/^/    /'
    fi
    echo ""
}

# Function to extract Android versions
get_android_versions() {
    echo "Android Versions (from native files):"
    
    if [ -f "android/app/build.gradle" ]; then
        VERSION_NAME=$(grep "versionName " android/app/build.gradle | head -1 | sed 's/.*versionName "\(.*\)"/\1/')
        VERSION_CODE=$(grep "versionCode " android/app/build.gradle | head -1 | sed 's/.*versionCode \(.*\)/\1/')
        echo "  Version: $VERSION_NAME"
        echo "  Build: $VERSION_CODE"
    else
        echo "  ❌ Native Android files not found"
    fi
    echo ""
}

# Function to extract Expo config versions
get_expo_versions() {
    echo "Expo Config Versions (from app.config.js):"
    
    if [ -f "app.config.js" ]; then
        # Check if config uses 'expo' wrapper
        HAS_EXPO=$(node -p "typeof require('./app.config.js').expo !== 'undefined'" 2>/dev/null)
        
        if [ "$HAS_EXPO" = "true" ]; then
            # Config wrapped in expo object
            VERSION=$(node -p "require('./app.config.js').expo.version" 2>/dev/null || echo "Not found")
            IOS_BUILD=$(node -p "require('./app.config.js').expo.ios?.buildNumber" 2>/dev/null || echo "Not found")
            ANDROID_CODE=$(node -p "require('./app.config.js').expo.android?.versionCode" 2>/dev/null || echo "Not found")
        else
            # Direct config format
            VERSION=$(node -p "require('./app.config.js').version" 2>/dev/null || echo "Not found")
            IOS_BUILD=$(node -p "require('./app.config.js').ios?.buildNumber" 2>/dev/null || echo "Not found")
            ANDROID_CODE=$(node -p "require('./app.config.js').android?.versionCode" 2>/dev/null || echo "Not found")
        fi
        
        echo "  Version: $VERSION"
        echo "  iOS Build: $IOS_BUILD"
        echo "  Android Build: $ANDROID_CODE"
    else
        echo "  ❌ app.config.js not found"
    fi
    echo ""
}

# Main execution
echo "⚠️  IMPORTANT: When native directories exist, EAS uses native file versions!"
echo "⚠️  The values below from native files are what will be in the actual build."
echo ""

get_ios_versions
get_android_versions
get_expo_versions

echo "=== Version Summary ==="
echo "For release notes, use the versions from NATIVE FILES above."
echo "The Expo config versions may be outdated if not synchronized."
echo ""

# Check if versions match
if [ -f "ios/SnapTrack/Info.plist" ] && [ -f "app.config.js" ]; then
    # Get Info.plist version (authoritative for iOS)
    PLIST_VERSION=$(plutil -p ios/SnapTrack/Info.plist | grep "CFBundleShortVersionString" | sed 's/.*"CFBundleShortVersionString" => "\(.*\)"/\1/')
    
    # Get Expo config version
    HAS_EXPO=$(node -p "typeof require('./app.config.js').expo !== 'undefined'" 2>/dev/null)
    if [ "$HAS_EXPO" = "true" ]; then
        EXPO_VERSION=$(node -p "require('./app.config.js').expo.version" 2>/dev/null)
    else
        EXPO_VERSION=$(node -p "require('./app.config.js').version" 2>/dev/null)
    fi
    
    if [ "$PLIST_VERSION" != "$EXPO_VERSION" ]; then
        echo "⚠️  WARNING: Version mismatch detected!"
        echo "   Info.plist (iOS): $PLIST_VERSION"
        echo "   Expo Config: $EXPO_VERSION"
        echo "   Release notes should use: $PLIST_VERSION"
    else
        echo "✅ Versions are synchronized"
    fi
fi

# Additional warning about project.pbxproj mismatch
if [ -f "ios/SnapTrack.xcodeproj/project.pbxproj" ] && [ -f "ios/SnapTrack/Info.plist" ]; then
    PBXPROJ_VERSION=$(grep -m1 "MARKETING_VERSION = " ios/SnapTrack.xcodeproj/project.pbxproj | sed 's/.*MARKETING_VERSION = \(.*\);/\1/')
    PLIST_VERSION=$(plutil -p ios/SnapTrack/Info.plist | grep "CFBundleShortVersionString" | sed 's/.*"CFBundleShortVersionString" => "\(.*\)"/\1/')
    
    if [ "$PBXPROJ_VERSION" != "$PLIST_VERSION" ]; then
        echo ""
        echo "⚠️  CRITICAL: iOS native file mismatch!"
        echo "   project.pbxproj: $PBXPROJ_VERSION (outdated)"
        echo "   Info.plist: $PLIST_VERSION (authoritative)"
        echo "   EAS will use Info.plist version: $PLIST_VERSION"
        echo "   Run update-version.sh to synchronize all files!"
    fi
fi