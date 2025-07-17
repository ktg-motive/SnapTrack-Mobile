#!/bin/bash

# SnapTrack Mobile - iOS Build Script (TestFlight)
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
    local build=$(node -p "require('./app.config.js').expo.ios.buildNumber" 2>/dev/null || echo "unknown")
    echo "Current Version: $version (Build $build)"
}

# Main execution
main() {
    print_step "SnapTrack Mobile - iOS Production Build"
    echo "Platform: iOS (TestFlight)"
    echo "Date: $(date)"
    echo ""
    
    # Show current version
    print_step "Current Version Information"
    get_current_version
    echo ""
    
    # Verify we're ready
    echo "This will build iOS and submit to TestFlight."
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
    
    # Build iOS
    print_step "EAS Build iOS (TestFlight)"
    echo "Starting iOS production build for TestFlight..."
    
    # Build iOS with production profile
    if eas build --platform ios --profile production; then
        print_success "iOS build started successfully"
        
        # Show build status
        echo "Build Status:"
        eas build:list --platform ios --limit 2
    else
        print_error "iOS build failed"
    fi
    
    # Final summary
    echo ""
    echo -e "${GREEN}🎉 iOS BUILD STARTED! 🎉${NC}"
    echo "========================================"
    get_current_version
    echo ""
    echo "Next Steps:"
    echo "1. Monitor build progress: eas build:list --platform ios"
    echo "2. Build will auto-submit to TestFlight when complete"
    echo "3. Check TestFlight for availability (~15-30 minutes)"
    echo "4. Notify iOS testers when ready"
    echo ""
    echo "Track Progress: eas build:list --platform ios --limit 2"
}

# Run main function
main "$@"