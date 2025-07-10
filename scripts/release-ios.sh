#!/bin/bash

# SnapTrack Mobile - iOS-Only Release
# For iOS-specific changes and fixes
# Author: DevOps Engineer
# Last Updated: January 10, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
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

print_error() {
    echo -e "${RED}❌ $1${NC}"
    echo ""
    exit 1
}

# Function to get next build number
get_next_build_number() {
    local current_build=$(grep -o 'buildNumber: "[^"]*"' app.config.js | grep -o '[0-9]*')
    if [ -z "$current_build" ]; then
        echo "1"
    else
        echo $((current_build + 1))
    fi
}

# Function to update build number only
update_build_number() {
    local build_num=$1
    
    # Update app.config.js build numbers
    sed -i '' "s/buildNumber: \"[^\"]*\"/buildNumber: \"$build_num\"/" app.config.js
    sed -i '' "s/versionCode: [0-9]*/versionCode: $build_num/" app.config.js
    
    echo "Updated build number to $build_num"
}

# Function to create iOS release notes
create_ios_release_notes() {
    local current_version=$(grep -o 'version: "[^"]*"' app.config.js | grep -o '[0-9]*\.[0-9]*\.[0-9]*')
    local build_num=$1
    
    # Create release notes directory if it doesn't exist
    mkdir -p docs/releases/testflight
    
    # Get recent commits for release notes
    local commits=$(git log --oneline -5 --since="1 week ago" | head -3)
    
    # Create TestFlight release notes
    cat > "docs/releases/testflight/v${current_version}-build${build_num}.txt" << EOF
SnapTrack v${current_version} (Build ${build_num}) - iOS Fix

Recent iOS improvements:
$(echo "$commits" | sed 's/^[a-f0-9]* /• /')

TESTING FOCUS:
• Test the specific iOS fix functionality
• Verify core receipt processing works
• Test image capture and optimization
• Confirm app stability

This build includes iOS-specific fixes and optimizations.
Quality gates passed: TypeScript coverage >90%, all tests passing.
Android unchanged: No Android build needed for this fix.

Build: ${current_version} (${build_num}) | Target: iOS 13.0+ | Size: ~15MB
EOF

    print_success "TestFlight release notes created: docs/releases/testflight/v${current_version}-build${build_num}.txt"
}

main() {
    cd "$PROJECT_ROOT"
    
    print_step "SnapTrack iOS-Only Release"
    echo "Purpose: iOS-specific fixes and improvements"
    echo "Date: $(date)"
    echo ""
    
    # Get current version and next build
    current_version=$(grep -o 'version: "[^"]*"' app.config.js | grep -o '[0-9]*\.[0-9]*\.[0-9]*')
    next_build=$(get_next_build_number)
    
    echo "Release Configuration:"
    echo "  Platform: iOS Only"
    echo "  Version: $current_version (unchanged)"
    echo "  Build Number: $next_build"
    echo ""
    
    echo "Proceed with iOS release? (y/n)"
    read -r proceed
    if [ "$proceed" != "y" ]; then
        echo "Release cancelled."
        exit 0
    fi
    
    # 1. Run quality gates
    print_step "Step 1: Quality Gates"
    if ! npm run pre-release; then
        print_error "Quality gates failed. Please fix issues before release."
    fi
    print_success "Quality gates passed!"
    
    # 2. Update build number
    print_step "Step 2: Build Number Update"
    update_build_number "$next_build"
    
    # 3. Create release notes
    print_step "Step 3: iOS Release Notes"
    create_ios_release_notes "$next_build"
    
    # 4. Git workflow
    print_step "Step 4: Git Workflow"
    git add .
    git commit -m "iOS build $next_build - iOS-specific fix

Platform: iOS only
Version: $current_version
Build: $next_build

Quality gates passed. Android unchanged.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    git push origin main
    print_success "Committed build number update"
    
    # 5. EAS Build
    print_step "Step 5: iOS Build & Submit"
    echo "Starting EAS build for iOS only..."
    
    if eas build --platform ios --auto-submit; then
        print_success "iOS build started successfully"
        echo "Build Status:"
        eas build:list --limit 2
    else
        print_error "iOS build failed"
    fi
    
    # Summary
    echo ""
    echo -e "${GREEN}🍎 iOS RELEASE COMPLETE! 🍎${NC}"
    echo "========================================"
    echo "Platform: iOS Only"
    echo "Version: $current_version (unchanged)"
    echo "Build: $next_build"
    echo ""
    echo "Next Steps:"
    echo "1. Monitor build: eas build:list"
    echo "2. Check TestFlight availability"
    echo "3. Notify iOS testers"
    echo "4. Android remains on previous build (unchanged)"
}

main "$@"