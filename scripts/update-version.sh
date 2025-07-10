#!/bin/bash

# SnapTrack Mobile - Version Update Script
# Usage: ./scripts/update-version.sh <version> <build_number>
# Example: ./scripts/update-version.sh 1.2.2 6

set -e

VERSION=$1
BUILD_NUM=$2

if [ -z "$VERSION" ] || [ -z "$BUILD_NUM" ]; then
    echo "Usage: $0 <version> <build_number>"
    echo "Example: $0 1.2.2 6"
    exit 1
fi

echo "Updating SnapTrack Mobile to version $VERSION build $BUILD_NUM"

# Update app.config.js
if [ -f "app.config.js" ]; then
    # Update version
    sed -i '' "s/version: \"[^\"]*\"/version: \"$VERSION\"/" app.config.js
    
    # Update iOS buildNumber
    sed -i '' "s/buildNumber: \"[^\"]*\"/buildNumber: \"$BUILD_NUM\"/" app.config.js
    
    # Update Android versionCode
    sed -i '' "s/versionCode: [0-9]*/versionCode: $BUILD_NUM/" app.config.js
    
    echo "✅ Updated app.config.js"
else
    echo "❌ app.config.js not found"
    exit 1
fi

# Update package.json version
if [ -f "package.json" ]; then
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" package.json
    echo "✅ Updated package.json"
else
    echo "⚠️  package.json not found, skipping"
fi

# Create release notes files
RELEASE_DIR="docs/releases"
mkdir -p "$RELEASE_DIR/testflight"
mkdir -p "$RELEASE_DIR/firebase"

# Create versioned release notes (copy from templates)
if [ -f "$RELEASE_DIR/testflight/current.txt" ]; then
    cp "$RELEASE_DIR/testflight/current.txt" "$RELEASE_DIR/testflight/v$VERSION.txt"
    echo "✅ Created TestFlight release notes: v$VERSION.txt"
fi

if [ -f "$RELEASE_DIR/firebase/current.md" ]; then
    cp "$RELEASE_DIR/firebase/current.md" "$RELEASE_DIR/firebase/v$VERSION.md"
    # Update version in the new file
    sed -i '' "s/v[0-9]*\.[0-9]*\.[0-9]*/v$VERSION/g" "$RELEASE_DIR/firebase/v$VERSION.md"
    sed -i '' "s/Version Code [0-9]*/Version Code $BUILD_NUM/g" "$RELEASE_DIR/firebase/v$VERSION.md"
    echo "✅ Created Firebase release notes: v$VERSION.md"
fi

echo ""
echo "🎉 Version update complete!"
echo "Version: $VERSION"
echo "Build Number: $BUILD_NUM"
echo ""
echo "Next steps:"
echo "1. Update release notes in docs/releases/testflight/current.txt"
echo "2. Update release notes in docs/releases/firebase/current.md"
echo "3. Commit changes: git add . && git commit -m 'Release v$VERSION'"
echo "4. Create tag: git tag v$VERSION"
echo "5. Build: eas build --platform all --auto-submit"