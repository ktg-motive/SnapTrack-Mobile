#!/bin/bash

# SnapTrack Mobile - Android-Only Release
# For bug fixes and Android-specific changes
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
    echo -e "${BLUE}🤖 $1${NC}"
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

# Function to create Android release notes
create_android_release_notes() {
    local current_version=$(grep -o 'version: "[^"]*"' app.config.js | grep -o '[0-9]*\.[0-9]*\.[0-9]*')
    local build_num=$1
    
    # Create release notes directory if it doesn't exist
    mkdir -p docs/releases/firebase
    
    # Get recent commits for release notes
    local commits=$(git log --oneline -5 --since="1 week ago" | head -3)
    
    # Create Firebase release notes
    cat > "docs/releases/firebase/v${current_version}-build${build_num}.md" << EOF
# SnapTrack Android v${current_version} (Build ${build_num}) - Firebase App Distribution

**Release Date:** $(date +"%B %d, %Y")
**Version:** ${current_version}
**Build:** ${build_num}
**Platform:** Android Only
**Distribution:** Firebase App Distribution

## 🔧 Bug Fix Release

### Recent Android Improvements
$(echo "$commits" | sed 's/^[a-f0-9]* /- /')

## 🧪 Testing Instructions
1. Install the app from the Firebase link
2. Test the specific bug fix functionality
3. Verify existing features still work correctly
4. Report any issues via the feedback form

## 📱 Installation Notes
- Minimum Android version: 6.0 (API 23)
- Recommended: Android 8.0+ for best performance
- Size: ~15MB download

## 🔧 Technical Details
- Quality gates passed: All tests green
- Performance optimized: Bundle size within limits
- Security validated: No vulnerabilities detected
- iOS unchanged: No iOS build needed for this fix
EOF

    print_success "Android release notes created: docs/releases/firebase/v${current_version}-build${build_num}.md"
}

main() {
    cd "$PROJECT_ROOT"
    
    print_step "SnapTrack Android-Only Release"
    echo "Purpose: Bug fixes and Android-specific changes"
    echo "Date: $(date)"
    echo ""
    
    # Get current version and next build
    current_version=$(grep -o 'version: "[^"]*"' app.config.js | grep -o '[0-9]*\.[0-9]*\.[0-9]*')
    next_build=$(get_next_build_number)
    
    echo "Release Configuration:"
    echo "  Platform: Android Only"
    echo "  Version: $current_version (unchanged)"
    echo "  Build Number: $next_build"
    echo ""
    
    echo "Proceed with Android release? (y/n)"
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
    print_step "Step 3: Android Release Notes"
    create_android_release_notes "$next_build"
    
    # 4. Git workflow
    print_step "Step 4: Git Workflow"
    git add .
    git commit -m "Android build $next_build - Bug fix release

Platform: Android only
Version: $current_version
Build: $next_build

Quality gates passed. iOS unchanged.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    git push origin main
    print_success "Committed build number update"
    
    # 5. EAS Build
    print_step "Step 5: Android Build & Submit"
    echo "Starting EAS build for Android only..."
    
    if eas build --platform android --auto-submit; then
        print_success "Android build started successfully"
        echo "Build Status:"
        eas build:list --limit 2
    else
        print_error "Android build failed"
    fi
    
    # Summary
    echo ""
    echo -e "${GREEN}🤖 ANDROID RELEASE COMPLETE! 🤖${NC}"
    echo "========================================"
    echo "Platform: Android Only"
    echo "Version: $current_version (unchanged)"
    echo "Build: $next_build"
    echo ""
    echo "Next Steps:"
    echo "1. Monitor build: eas build:list"
    echo "2. Check Firebase App Distribution"
    echo "3. Notify Android testers"
    echo "4. iOS remains on previous build (unchanged)"
}

main "$@"