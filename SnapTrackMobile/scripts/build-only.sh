#!/bin/bash

# SnapTrack Mobile - Build Only Script
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
    print_step "SnapTrack Mobile - Production Build"
    echo "Date: $(date)"
    echo ""
    
    # Show current version
    print_step "Current Version Information"
    get_current_version
    echo ""
    
    # Verify we're ready
    echo "This will build for TestFlight and Firebase distribution (no auto-submit to stores)."
    echo "Continue? (y/n)"
    read -r proceed
    if [ "$proceed" != "y" ]; then
        echo "Build cancelled."
        exit 0
    fi
    
    # Run quality gates first
    print_step "Quality Gates Validation"
    echo "Running pre-release checks..."
    
    if command -v npm &> /dev/null && npm run pre-release &> /dev/null; then
        print_success "Quality gates passed!"
    else
        echo "⚠️  Pre-release script not found or failed, continuing anyway..."
    fi
    
    # Build for distribution
    print_step "EAS Build (TestFlight & Firebase)"
    echo "Starting production builds for TestFlight and Firebase distribution..."
    
    # Build both platforms for TestFlight and Firebase distribution
    if eas build --platform all --profile production; then
        print_success "EAS builds started successfully"
        
        # Show build status
        echo "Build Status:"
        eas build:list --limit 3
    else
        print_error "EAS build failed"
    fi
    
    # Final summary
    echo ""
    echo -e "${GREEN}🎉 BUILDS STARTED! 🎉${NC}"
    echo "========================================"
    get_current_version
    echo ""
    echo "Next Steps:"
    echo "1. Monitor EAS build progress: eas build:list"
    echo "2. iOS will auto-submit to TestFlight when ready"
    echo "3. Android will be available for Firebase distribution"
    echo "4. Notify testers when builds are ready"
    echo ""
    echo "Track Progress: eas build:list --limit 3"
}

# Run main function
main "$@"