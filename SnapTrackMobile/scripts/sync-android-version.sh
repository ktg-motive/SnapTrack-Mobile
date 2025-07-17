#!/bin/bash

# Quick script to sync Android build.gradle with current app.config.js versions
# This fixes the current mismatch where Android shows 1.2.1 but should be 1.3.0

set -e

echo "Syncing Android version with app.config.js..."

# Get current version from app.config.js
VERSION=$(grep -o 'version: "[^"]*"' app.config.js | grep -o '[0-9]*\.[0-9]*\.[0-9]*')
BUILD_NUM=$(grep -o 'versionCode: [0-9]*' app.config.js | grep -o '[0-9]*')

echo "Current app.config.js version: $VERSION (build $BUILD_NUM)"

# Update Android build.gradle
if [ -f "android/app/build.gradle" ]; then
    sed -i '' "s/versionName \"[^\"]*\"/versionName \"$VERSION\"/" android/app/build.gradle
    sed -i '' "s/versionCode [0-9]*/versionCode $BUILD_NUM/" android/app/build.gradle
    echo "✅ Updated Android build.gradle to version $VERSION (build $BUILD_NUM)"
else
    echo "❌ Android build.gradle not found"
    exit 1
fi

echo "Done! Android version is now in sync."