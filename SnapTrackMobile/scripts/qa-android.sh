#!/bin/bash

# SnapTrack Mobile - Android QA Testing
# Quick script to test Android builds locally
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
    echo -e "${BLUE}🤖 $1${NC}"
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
    
    print_step "SnapTrack Android - QA Testing"
    echo "Running quality gates and launching Android emulator"
    echo ""
    
    # 1. Run quality gates
    print_step "Step 1: Quality Gates"
    if ! npm run pre-release; then
        print_error "Quality gates failed. Fix issues before proceeding."
    fi
    print_success "Quality gates passed!"
    
    # 2. Check Android emulator
    print_step "Step 2: Android Environment Check"
    if ! command -v adb &> /dev/null; then
        print_error "Android SDK/adb not found. Make sure Android Studio is installed."
    fi
    
    # Check if emulator is running
    local running_devices=$(adb devices | grep -c emulator || true)
    if [ "$running_devices" -eq 0 ]; then
        print_warning "No Android emulator running."
        echo "Please start an emulator from Android Studio first."
        echo ""
        echo "Available emulators:"
        emulator -list-avds 2>/dev/null || echo "Run 'emulator -list-avds' to see available devices"
        exit 1
    fi
    
    print_success "Android emulator detected"
    
    # 3. Build and launch
    print_step "Step 3: Building and Launching"
    echo "Building Android app..."
    if expo run:android; then
        print_success "Android app launched successfully!"
        echo ""
        echo "📱 QA Testing Checklist:"
        echo "  □ App launches without crashes"
        echo "  □ Test the specific bug fix"
        echo "  □ Camera functionality"
        echo "  □ Receipt processing"
        echo "  □ Navigation and UI responsiveness"
        echo "  □ Android back button behavior"
        echo ""
        echo "Note: Google Sign-In may not work on emulator"
    else
        print_error "Android build failed"
    fi
}

main "$@"