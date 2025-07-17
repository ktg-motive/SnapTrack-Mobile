#!/bin/bash

# SnapTrack Pre-Deployment Verification Script
# Run before executing any production builds

set -e

echo "🚀 SnapTrack Pre-Deployment Verification"
echo "========================================"
echo ""

# Check version synchronization
echo "1. Checking version synchronization..."
./scripts/get-release-version.sh | grep -q "✅ Versions are synchronized"
if [ $? -eq 0 ]; then
    echo "✅ All version files synchronized"
else
    echo "❌ Version files NOT synchronized!"
    echo "   Run: ./scripts/update-version.sh [version] [build]"
    exit 1
fi
echo ""

# Check credential files
echo "2. Checking credential files..."
if [ -f "AuthKey_4735TSMA98.p8" ]; then
    echo "✅ iOS App Store Connect API key present"
else
    echo "❌ iOS API key missing: AuthKey_4735TSMA98.p8"
    exit 1
fi

if [ -f "google-services.json" ]; then
    echo "✅ Firebase/Google services config present"
else
    echo "❌ Firebase config missing: google-services.json"
    exit 1
fi
echo ""

# Check EAS configuration
echo "3. Checking EAS configuration..."
if command -v eas &> /dev/null; then
    EAS_VERSION=$(eas --version 2>/dev/null | head -1)
    echo "✅ EAS CLI installed: $EAS_VERSION"
else
    echo "❌ EAS CLI not installed"
    echo "   Run: npm install -g eas-cli@latest"
    exit 1
fi

if [ -f "eas.json" ]; then
    echo "✅ EAS configuration file present"
else
    echo "❌ eas.json missing"
    exit 1
fi
echo ""

# Check project status
echo "4. Checking project status..."
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependencies not installed - run: npm install"
fi

if [ -d "ios" ] && [ -d "android" ]; then
    echo "✅ Native directories present"
else
    echo "⚠️  Native directories missing - may need prebuild"
fi
echo ""

# Display deployment commands
echo "5. Ready for deployment! 🎉"
echo ""
echo "Recommended build commands:"
echo ""
echo "For iOS TestFlight (with auto-submit):"
echo "  eas build --platform ios --profile production --auto-submit"
echo ""
echo "For Android Firebase Distribution:"
echo "  eas build --platform android --profile production"
echo ""
echo "For both platforms:"
echo "  eas build --platform all --profile production --auto-submit --wait"
echo ""
echo "Current version: $(./scripts/get-release-version.sh | grep 'iOS Versions' -A2 | tail -1 | sed 's/.*Version: //' | sed 's/, Build:.*//')"
echo "Current build: $(./scripts/get-release-version.sh | grep 'iOS Versions' -A2 | tail -1 | sed 's/.*Build: //')"
echo ""
echo "✅ All systems ready for deployment!"