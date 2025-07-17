#!/bin/bash

# SnapTrack Mobile - Android Build Script (Firebase)
# For when version management is already complete
# Author: DevOps Engineer

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print step headers
print_step() {
    echo -e "${BLUE}🚀 $1${NC}"
    echo "=============================================="
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo ""
}

# Function to print error and exit
print_error() {
    echo -e "${RED}❌ $1${NC}"
    echo ""
    exit 1
}

# Function to get current version info
get_current_version() {
    local version=$(node -p "require('./app.config.js').expo.version" 2>/dev/null || echo "unknown")
    local build=$(node -p "require('./app.config.js').expo.android.versionCode" 2>/dev/null || echo "unknown")
    echo "Current Version: $version (Version Code $build)"
}

# Main execution
main() {
    print_step "SnapTrack Mobile - Android Production Build"
    echo "Platform: Android (Firebase App Distribution)"
    echo "Date: $(date)"
    echo ""
    
    # Show current version
    print_step "Current Version Information"
    get_current_version
    echo ""
    
    # Verify we're ready
    echo "This will build Android for Firebase App Distribution (no Play Store)."
    echo "Continue? (y/n)"
    read -r proceed
    if [ "$proceed" != "y" ]; then
        echo "Build cancelled."
        exit 0
    fi
    
    # Run comprehensive quality gates
    print_step "Comprehensive Quality Gates"
    echo "Running comprehensive pre-release validation..."
    
    if [ -f "./scripts/pre-release-checks.sh" ]; then
        if ./scripts/pre-release-checks.sh; then
            print_success "All quality gates passed!"
        else
            print_error "Quality gates failed - review output above and fix issues before building"
        fi
    else
        print_error "Pre-release checks script not found at ./scripts/pre-release-checks.sh"
    fi
    
    # Build Android
    print_step "EAS Build Android (Firebase)"
    echo "Starting Android production build for Firebase distribution..."
    
    # Build Android with production profile
    if eas build --platform android --profile production; then
        print_success "Android build started successfully"
        
        # Show build status
        echo "Build Status:"
        eas build:list --platform android --limit 2
    else
        print_error "Android build failed"
    fi
    
    # Final summary
    echo ""
    echo -e "${GREEN}🎉 ANDROID BUILD STARTED! 🎉${NC}"
    echo "========================================"
    get_current_version
    echo ""
    echo "Next Steps:"
    echo "1. Monitor build progress: eas build:list --platform android"
    echo "2. Download APK when build completes"
    echo "3. Upload to Firebase App Distribution manually"
    echo "4. Notify Android testers when ready"
    echo ""
    echo "Track Progress: eas build:list --platform android --limit 2"
}

# Run main function
main "$@"