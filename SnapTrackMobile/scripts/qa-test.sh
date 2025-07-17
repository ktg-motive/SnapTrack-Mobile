#!/bin/bash

# SnapTrack Mobile - QA Testing Script
# Runs quality gates + local builds + emulators for pre-release testing
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
    echo -e "${BLUE}🧪 $1${NC}"
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

# Function to get platform selection
get_platform_selection() {
    # Check if stdin is available
    if [ -t 0 ]; then
        while true; do
            echo "Select platform for QA testing:"
            echo "1) Android emulator"
            echo "2) iOS simulator"
            echo "3) Both platforms"
            echo -n "Enter choice (1-3): "
            read -r choice
            
            case $choice in
                1) 
                    echo "android"
                    return
                    ;;
                2) 
                    echo "ios"
                    return
                    ;;
                3) 
                    echo "both"
                    return
                    ;;
                *) 
                    echo "Invalid choice. Please enter 1, 2, or 3."
                    echo ""
                    ;;
            esac
        done
    else
        # Default to both if no stdin available
        echo "No interactive input available, defaulting to both platforms"
        echo "both"
    fi
}

# Function to check if Android emulator is available
check_android_emulator() {
    if ! command -v adb &> /dev/null; then
        print_warning "Android SDK/adb not found. Make sure Android Studio is installed."
        return 1
    fi
    
    # Check if any emulator is running
    local running_devices=$(adb devices | grep emulator | wc -l)
    if [ "$running_devices" -eq 0 ]; then
        print_warning "No Android emulator running. Please start an emulator from Android Studio."
        echo "Available emulators:"
        emulator -list-avds 2>/dev/null || echo "  Run 'emulator -list-avds' to see available devices"
        return 1
    fi
    
    print_success "Android emulator detected and running"
    return 0
}

# Function to check if iOS simulator is available
check_ios_simulator() {
    if ! command -v xcrun &> /dev/null; then
        print_warning "Xcode not found. iOS simulator not available."
        return 1
    fi
    
    # Check if simulator is available
    local available_simulators=$(xcrun simctl list devices ios | grep "iPhone" | grep "Booted\|Shutdown" | wc -l)
    if [ "$available_simulators" -eq 0 ]; then
        print_warning "No iOS simulators available. Make sure Xcode is installed."
        return 1
    fi
    
    print_success "iOS simulator available"
    return 0
}

# Function to start emulators/simulators
start_platforms() {
    local platform=$1
    
    if [ "$platform" = "android" ] || [ "$platform" = "both" ]; then
        print_step "Starting Android Build"
        
        if check_android_emulator; then
            echo "Building and launching on Android emulator..."
            if expo run:android; then
                print_success "Android app launched successfully"
            else
                print_error "Android build failed"
            fi
        else
            print_warning "Skipping Android - emulator not ready"
        fi
    fi
    
    if [ "$platform" = "ios" ] || [ "$platform" = "both" ]; then
        print_step "Starting iOS Build"
        
        if check_ios_simulator; then
            echo "Building and launching on iOS simulator..."
            if expo run:ios; then
                print_success "iOS app launched successfully"
            else
                print_error "iOS build failed"
            fi
        else
            print_warning "Skipping iOS - simulator not ready"
        fi
    fi
}

main() {
    cd "$PROJECT_ROOT"
    
    print_step "SnapTrack Mobile - QA Testing Workflow"
    echo "Purpose: Pre-release quality assurance and local testing"
    echo "Date: $(date)"
    echo ""
    echo "This script will:"
    echo "• Run all quality gates (same as release)"
    echo "• Build locally (no version changes)"
    echo "• Launch on emulators/simulators"
    echo "• Allow manual QA testing"
    echo ""
    echo "⚠️  Note: Some features may have limitations in local builds:"
    echo "• Google Sign-In may not work on emulators"
    echo "• Apple Sign-In limited on iOS simulator"
    echo "• Push notifications require physical devices"
    echo "• Core app functionality will work for most testing"
    echo ""
    
    # Get platform selection
    echo ""
    platform_selection=$(get_platform_selection)
    
    echo ""
    echo "QA Test Configuration:"
    echo "  Platform(s): $platform_selection"
    echo "  Build Type: Local development"
    echo "  Version: No changes (QA only)"
    echo ""
    
    echo "Proceed with QA testing? (y/n)"
    read -r proceed
    if [ "$proceed" != "y" ]; then
        echo "QA testing cancelled."
        exit 0
    fi
    
    # 1. Run quality gates (same as release)
    print_step "Step 1: Quality Gates Validation"
    echo "Running comprehensive pre-release checks..."
    
    if ! npm run pre-release; then
        print_error "Quality gates failed. Fix issues before proceeding with QA."
    fi
    
    print_success "Quality gates passed! Code ready for QA testing."
    
    # 2. Check development environment
    print_step "Step 2: Development Environment Check"
    
    echo "Checking Expo development server..."
    if ! command -v expo &> /dev/null; then
        print_error "Expo CLI not found. Run: npm install -g @expo/cli"
    fi
    
    print_success "Development environment ready"
    
    # 3. Platform-specific builds and launches
    print_step "Step 3: Local Build & Launch"
    start_platforms "$platform_selection"
    
    # 4. QA Instructions
    print_step "Step 4: QA Testing Instructions"
    
    echo -e "${BLUE}📱 QA Testing Checklist:${NC}"
    echo ""
    echo "Core Functionality:"
    echo "  □ App launches without crashes"
    echo "  □ Camera functionality works"
    echo "  □ Receipt capture and processing"
    echo "  □ Data synchronization"
    echo "  □ Navigation between screens"
    echo ""
    echo "Recent Changes:"
    echo "  □ Test the specific bug fix/feature"
    echo "  □ Verify no regressions in existing functionality"
    echo "  □ Check performance and responsiveness"
    echo ""
    echo "Device-Specific:"
    if [ "$platform_selection" = "android" ] || [ "$platform_selection" = "both" ]; then
        echo "  □ Android: Test back button behavior"
        echo "  □ Android: Check permissions (camera, storage)"
    fi
    if [ "$platform_selection" = "ios" ] || [ "$platform_selection" = "both" ]; then
        echo "  □ iOS: Test gesture navigation"
        echo "  □ iOS: Check biometric authentication"
    fi
    echo ""
    
    # 5. Next steps
    print_step "Step 5: Post-QA Actions"
    
    echo "After QA testing:"
    echo ""
    echo "✅ If everything works:"
    echo "   → Run 'npm run release:android' for Android release"
    echo "   → Run 'npm run release:ios' for iOS release"
    echo "   → Run 'npm run release' for full release"
    echo ""
    echo "❌ If issues found:"
    echo "   → Fix issues in code"
    echo "   → Re-run 'npm run qa-test' to verify fixes"
    echo "   → Repeat until QA passes"
    echo ""
    echo "📊 Quality gates already passed, so release should work!"
    echo ""
    
    # Summary
    echo -e "${GREEN}🧪 QA TESTING READY! 🧪${NC}"
    echo "========================================"
    echo "Platform(s): $platform_selection"
    echo "Quality Gates: ✅ PASSED"
    echo "Local Build: ✅ LAUNCHED"
    echo ""
    echo "The app is now running on your emulator(s)/simulator(s)."
    echo "Perform manual QA testing, then proceed with release if ready!"
}

main "$@"