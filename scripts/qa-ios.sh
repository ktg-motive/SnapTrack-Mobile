#!/bin/bash

# SnapTrack Mobile - iOS QA Testing
# Quick script to test iOS builds locally
# Author: DevOps Engineer
# Last Updated: January 10, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_step() {
    echo -e "${BLUE}🍎 $1${NC}"
    echo "========================================"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo ""
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo ""
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    echo ""
    exit 1
}

main() {
    cd "$PROJECT_ROOT"
    
    print_step "SnapTrack iOS - QA Testing"
    echo "Running quality gates and launching iOS simulator"
    echo ""
    
    # 1. Run quality gates
    print_step "Step 1: Quality Gates"
    if ! npm run pre-release; then
        print_error "Quality gates failed. Fix issues before proceeding."
    fi
    print_success "Quality gates passed!"
    
    # 2. Check iOS environment
    print_step "Step 2: iOS Environment Check"
    if ! command -v xcrun &> /dev/null; then
        print_error "Xcode not found. Please install Xcode from the App Store."
    fi
    
    # Check for available simulators
    local available_simulators=$(xcrun simctl list devices available | grep -c "iPhone" || true)
    if [ "$available_simulators" -eq 0 ]; then
        print_error "No iOS simulators available. Please install simulators in Xcode."
    fi
    
    print_success "iOS simulator available"
    
    # 3. Build and launch
    print_step "Step 3: Building and Launching"
    echo "Building iOS app..."
    if expo run:ios; then
        print_success "iOS app launched successfully!"
        echo ""
        echo "📱 QA Testing Checklist:"
        echo "  □ App launches without crashes"
        echo "  □ Test the specific bug fix"
        echo "  □ Camera functionality"
        echo "  □ Receipt processing"
        echo "  □ Navigation and gestures"
        echo "  □ iOS-specific UI elements"
        echo ""
        echo "Note: Apple Sign-In limited on simulator"
    else
        print_error "iOS build failed"
    fi
}

main "$@"