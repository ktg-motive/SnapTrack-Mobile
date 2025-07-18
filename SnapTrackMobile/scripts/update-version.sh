#!/bin/bash

# SnapTrack Mobile - Enhanced Version Update Script with API Integration
# Usage: ./scripts/update-version.sh <version> <build_number> [release_notes_file]
# Example: ./scripts/update-version.sh 1.2.2 6 docs/releases/v1.2.2.md

set -e

VERSION=$1
BUILD_NUM=$2
RELEASE_NOTES_FILE=$3

if [ -z "$VERSION" ] || [ -z "$BUILD_NUM" ]; then
    echo "Usage: $0 <version> <build_number> [release_notes_file]"
    echo "Example: $0 1.2.2 6 docs/releases/v1.2.2.md"
    exit 1
fi

echo "🚀 Updating SnapTrack Mobile to version $VERSION build $BUILD_NUM"

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

# NEW: API Integration Section
echo ""
echo "📡 Updating Version API..."

# Function to update version via API
update_version_api() {
    local platform=$1
    local release_notes_content=""
    local highlights_json="[]"
    
    # Read release notes if file provided
    if [ -n "$RELEASE_NOTES_FILE" ] && [ -f "$RELEASE_NOTES_FILE" ]; then
        # Extract content based on platform
        if [ "$platform" = "ios" ] && [ -f "docs/releases/testflight/v$VERSION.txt" ]; then
            release_notes_content=$(cat "docs/releases/testflight/v$VERSION.txt")
        elif [ "$platform" = "android" ] && [ -f "docs/releases/firebase/v$VERSION.md" ]; then
            release_notes_content=$(cat "docs/releases/firebase/v$VERSION.md")
        elif [ -f "$RELEASE_NOTES_FILE" ]; then
            release_notes_content=$(cat "$RELEASE_NOTES_FILE")
        fi
        
        # Extract highlights (lines starting with ▸ or • or -)
        if [ -n "$release_notes_content" ]; then
            highlights=$(echo "$release_notes_content" | grep -E '^[▸•-]' | sed 's/^[▸•-] *//' | head -5)
            if [ -n "$highlights" ]; then
                # Convert to JSON array (requires jq if available)
                if command -v jq >/dev/null 2>&1; then
                    highlights_json=$(echo "$highlights" | jq -R -s 'split("\n")[:-1]')
                else
                    # Simple JSON array creation without jq
                    highlights_json='["'$(echo "$highlights" | sed 's/$/","/g' | tr -d '\n' | sed 's/,"$//')'""]'
                fi
            fi
        fi
    fi
    
    # Prepare API payload
    local api_payload=$(cat <<EOF
{
    "version": "$VERSION",
    "buildNumber": "$BUILD_NUM",
    "platform": "$platform",
    "releaseNotes": {
        "content": $(echo "$release_notes_content" | jq -R -s '.' 2>/dev/null || echo "\"$release_notes_content\""),
        "highlights": $highlights_json,
        "releaseType": "minor",
        "type": "$([ "$platform" = "ios" ] && echo "plain" || echo "markdown")"
    }
}
EOF
)
    
    # Make API call
    local api_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SNAPTRACK_ADMIN_TOKEN" \
        -d "$api_payload" \
        "$SNAPTRACK_API_BASE_URL/api/admin/version-update" 2>/dev/null || echo '{"error": "API call failed"}')
    
    echo "  $platform API response: $api_response"
}

# Check for required environment variables
if [ -z "$SNAPTRACK_API_BASE_URL" ] || [ -z "$SNAPTRACK_ADMIN_TOKEN" ]; then
    echo "⚠️  Warning: SNAPTRACK_API_BASE_URL or SNAPTRACK_ADMIN_TOKEN not set"
    echo "   API version update skipped. Set these environment variables for full automation."
    echo ""
    echo "   To enable API integration:"
    echo "   export SNAPTRACK_API_BASE_URL=https://snaptrack-receipts-6b4ae7a14b3e.herokuapp.com"
    echo "   export SNAPTRACK_ADMIN_TOKEN=your-admin-token"
else
    # Update both platforms
    update_version_api "ios"
    update_version_api "android"
    echo "✅ Version API updated successfully"
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
if [ -n "$SNAPTRACK_API_BASE_URL" ]; then
    echo "6. ✅ API version already updated automatically"
else
    echo "6. Update version API manually (configure environment variables for automation)"
fi