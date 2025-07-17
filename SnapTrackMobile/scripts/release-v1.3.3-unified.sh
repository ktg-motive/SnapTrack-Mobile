#!/bin/bash

# SnapTrack Mobile - Unified v1.3.3 Release Script
# Deploys both iOS (TestFlight) and Android (Firebase) with paid signup flow
# Author: DevOps Engineer

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Function to print step headers
print_step() {
    echo ""
    echo -e "${BLUE}🚀 $1${NC}"
    echo "=============================================="
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo ""
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo ""
}

# Function to print error and exit
print_error() {
    echo -e "${RED}❌ $1${NC}"
    echo ""
    exit 1
}

# Function to print info
print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

print_step "SnapTrack Mobile v1.3.3 Unified Release"
print_info "Release includes:"
print_info "• Paid-only signup flow with Stripe integration"
print_info "• Emergency Android crash fixes (Text component & FormData)"
print_info "• iOS encryption compliance (ITSAppUsesNonExemptEncryption: false)"
print_info "• Deep linking for payment completion"
print_info "• Cleaned up version displays"
echo ""

# Verify we're in the right directory
if [ ! -f "app.config.js" ]; then
    print_error "Must run from SnapTrackMobile project root directory"
fi

# Check if user wants to proceed
echo -e "${YELLOW}This will build and deploy:${NC}"
echo "  📱 iOS v1.3.3 (build 11) → TestFlight"
echo "  🤖 Android v1.3.3 (versionCode 11) → Firebase App Distribution"
echo ""
read -p "Continue with unified release? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Release cancelled by user"
    exit 0
fi

print_step "Pre-Release Validation"

# Check for required files
print_info "Checking required configuration files..."
required_files=(
    "app.config.js"
    "GoogleService-Info.plist"
    "google-services.json"
    ".easignore"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found: $file"
    else
        print_error "Missing required file: $file"
    fi
done

# Verify version and build numbers
print_info "Verifying version configuration..."
if grep -q 'version: "1.3.3"' app.config.js; then
    print_success "Version: 1.3.3 ✓"
else
    print_error "Version is not 1.3.3 in app.config.js"
fi

if grep -q 'buildNumber: "11"' app.config.js; then
    print_success "iOS buildNumber: 11 ✓"
else
    print_error "iOS buildNumber is not 11 in app.config.js"
fi

if grep -q 'versionCode: 11' app.config.js; then
    print_success "Android versionCode: 11 ✓"
else
    print_error "Android versionCode is not 11 in app.config.js"
fi

# Check EAS authentication
print_info "Checking EAS authentication..."
if eas whoami > /dev/null 2>&1; then
    EAS_USER=$(eas whoami)
    print_success "EAS authenticated as: $EAS_USER"
else
    print_error "Not authenticated with EAS. Run: eas login"
fi

# Quick dependency check
print_info "Checking dependencies..."
if [ -d "node_modules" ]; then
    print_success "Node modules installed"
else
    print_warning "Installing dependencies..."
    npm install
fi

# TypeScript compilation check
print_info "Running TypeScript compilation check..."
if npx tsc --noEmit; then
    print_success "TypeScript compilation passed"
else
    print_error "TypeScript compilation failed. Fix errors before release."
fi

print_step "Building iOS v1.3.3 for TestFlight"

print_info "Starting iOS build with:"
print_info "• Version: 1.3.3"
print_info "• Build Number: 11"
print_info "• Profile: production"
print_info "• Target: TestFlight (automatic submission)"
print_info "• Features: Paid signup + encryption compliance"

# Build iOS with production profile
if eas build --platform ios --profile production --auto-submit; then
    print_success "iOS build submitted successfully to EAS and TestFlight"
else
    print_error "iOS build failed"
fi

print_step "Building Android v1.3.3 for Firebase App Distribution"

print_info "Starting Android build with:"
print_info "• Version: 1.3.3"
print_info "• Version Code: 11"
print_info "• Profile: production"
print_info "• Target: Firebase App Distribution (automatic submission)"
print_info "• Features: Paid signup + crash fixes"

# Build Android with production profile and auto-submit to Firebase
if eas build --platform android --profile production --auto-submit; then
    print_success "Android build submitted successfully to EAS and Firebase App Distribution"
else
    print_error "Android build failed"
fi

print_step "Release Summary"

print_success "🎉 SnapTrack Mobile v1.3.3 Unified Release Complete!"
echo ""
print_info "📱 iOS Status:"
print_info "   • Build submitted to TestFlight"
print_info "   • Beta testers will receive update notification"
print_info "   • Includes paid signup flow and encryption compliance"
echo ""
print_info "🤖 Android Status:"
print_info "   • Build submitted to Firebase App Distribution"
print_info "   • Beta testers will receive update notification"
print_info "   • Includes crash fixes and paid signup flow"
echo ""
print_info "🔗 Key Features in v1.3.3:"
print_info "   ✅ Paid-only signup with Stripe integration"
print_info "   ✅ Deep linking: snaptrack:// and https://snaptrack.bot/mobile/*"
print_info "   ✅ App Store compliance (no in-app purchases)"
print_info "   ✅ Emergency Android crash fixes (Text component)"
print_info "   ✅ API client FormData fixes"
print_info "   ✅ Cleaned up version displays"
print_info "   ✅ iOS encryption compliance declaration"
echo ""
print_info "📋 Next Steps:"
print_info "   1. Monitor EAS build dashboard for completion status"
print_info "   2. Test paid signup flow with beta testers"
print_info "   3. Verify deep linking from web signup to mobile app"
print_info "   4. Update release notes and documentation"
print_info "   5. Prepare for App Store submission after beta validation"
echo ""
print_success "Release deployment initiated. Check EAS dashboard for build progress."

# Update memory bank with deployment timestamp
echo "$(date): v1.3.3 unified release deployed by DevOps - iOS build 11 + Android versionCode 11" >> memory-bank/activeContext.md