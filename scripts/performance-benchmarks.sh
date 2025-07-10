#!/bin/bash

# SnapTrack Mobile - Performance Benchmarks
# Validates app performance metrics before release
# Author: DevOps Engineer
# Last Updated: January 9, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Performance thresholds
MAX_BUNDLE_SIZE_MB=20
MAX_ASSETS_SIZE_MB=10
MAX_SOURCE_SIZE_MB=5
MIN_COMPRESSION_RATIO=70

# Function to print step headers
print_step() {
    echo -e "${BLUE}📊 $1${NC}"
    echo "----------------------------------------"
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

# Function to format file sizes
format_size() {
    local size_bytes=$1
    if [ $size_bytes -lt 1024 ]; then
        echo "${size_bytes}B"
    elif [ $size_bytes -lt 1048576 ]; then
        echo "$((size_bytes / 1024))KB"
    else
        echo "$((size_bytes / 1048576))MB"
    fi
}

echo -e "${BLUE}🚀 SnapTrack Mobile - Performance Benchmarks${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# 1. Bundle size analysis
print_step "Bundle Size Analysis"

# Create test build for analysis
echo "Creating test build for analysis..."
if expo export --platform ios --output-dir ./perf-test --experimental-bundle; then
    print_success "Test build created successfully"
else
    print_error "Failed to create test build"
fi

# Analyze bundle size
if [ -d "perf-test" ]; then
    TOTAL_SIZE=$(du -sm perf-test | cut -f1)
    BUNDLE_SIZE=$(du -sm perf-test/_expo/static/js 2>/dev/null | cut -f1 || echo "0")
    ASSETS_SIZE=$(du -sm perf-test/assets 2>/dev/null | cut -f1 || echo "0")
    
    echo "📦 Bundle Analysis Results:"
    echo "  Total Export Size: ${TOTAL_SIZE}MB"
    echo "  JavaScript Bundle: ${BUNDLE_SIZE}MB"
    echo "  Assets Size: ${ASSETS_SIZE}MB"
    echo ""
    
    # Check thresholds
    if [ "$TOTAL_SIZE" -gt "$MAX_BUNDLE_SIZE_MB" ]; then
        print_error "Total bundle size ${TOTAL_SIZE}MB exceeds limit of ${MAX_BUNDLE_SIZE_MB}MB"
    fi
    
    if [ "$ASSETS_SIZE" -gt "$MAX_ASSETS_SIZE_MB" ]; then
        print_warning "Assets size ${ASSETS_SIZE}MB exceeds recommended limit of ${MAX_ASSETS_SIZE_MB}MB"
    fi
    
    print_success "Bundle size analysis completed"
    
    # Cleanup
    rm -rf perf-test
else
    print_error "Test build directory not found"
fi

# 2. Source code analysis
print_step "Source Code Analysis"

# Count TypeScript/JavaScript files and total size
TS_TSX_COUNT=$(find src -name "*.ts" -o -name "*.tsx" | wc -l)
JS_JSX_COUNT=$(find src -name "*.js" -o -name "*.jsx" | wc -l)
TOTAL_FILES=$((TS_TSX_COUNT + JS_JSX_COUNT))

SOURCE_SIZE_KB=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -exec wc -c {} + | tail -n 1 | awk '{print $1}')
SOURCE_SIZE_MB=$((SOURCE_SIZE_KB / 1048576))

echo "📝 Source Code Analysis:"
echo "  TypeScript files: $TS_TSX_COUNT"
echo "  JavaScript files: $JS_JSX_COUNT" 
echo "  Total files: $TOTAL_FILES"
echo "  Source size: ${SOURCE_SIZE_MB}MB"
echo ""

if [ "$SOURCE_SIZE_MB" -gt "$MAX_SOURCE_SIZE_MB" ]; then
    print_warning "Source code size ${SOURCE_SIZE_MB}MB exceeds recommended limit of ${MAX_SOURCE_SIZE_MB}MB"
fi

# TypeScript adoption rate
TS_ADOPTION_RATE=$((TS_TSX_COUNT * 100 / TOTAL_FILES))
echo "  TypeScript adoption: ${TS_ADOPTION_RATE}%"

if [ "$TS_ADOPTION_RATE" -lt 90 ]; then
    print_warning "TypeScript adoption rate ${TS_ADOPTION_RATE}% is below recommended 90%"
fi

print_success "Source code analysis completed"

# 3. Asset optimization analysis  
print_step "Asset Optimization Analysis"

if [ -d "assets" ]; then
    # Find large images
    echo "🖼️  Asset Analysis:"
    
    LARGE_IMAGES=()
    while IFS= read -r -d '' file; do
        SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        SIZE_MB=$((SIZE / 1048576))
        if [ "$SIZE_MB" -gt 1 ]; then
            LARGE_IMAGES+=("$(basename "$file"): ${SIZE_MB}MB")
        fi
    done < <(find assets -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -print0 2>/dev/null)
    
    if [ ${#LARGE_IMAGES[@]} -gt 0 ]; then
        echo "  Large images found (>1MB):"
        for img in "${LARGE_IMAGES[@]}"; do
            echo "    - $img"
        done
        print_warning "Consider optimizing large images for better performance"
    else
        print_success "No large images found"
    fi
    
    # Total assets size
    ASSETS_TOTAL_SIZE=$(du -sm assets 2>/dev/null | cut -f1 || echo "0")
    echo "  Total assets size: ${ASSETS_TOTAL_SIZE}MB"
    
    if [ "$ASSETS_TOTAL_SIZE" -gt "$MAX_ASSETS_SIZE_MB" ]; then
        print_warning "Assets directory size ${ASSETS_TOTAL_SIZE}MB exceeds recommended ${MAX_ASSETS_SIZE_MB}MB"
    fi
else
    print_warning "Assets directory not found"
fi

# 4. Dependency analysis
print_step "Dependency Analysis"

echo "📦 Dependency Analysis:"

# Count dependencies
DEPS_COUNT=$(jq '.dependencies | length' package.json)
DEV_DEPS_COUNT=$(jq '.devDependencies | length' package.json)
TOTAL_DEPS=$((DEPS_COUNT + DEV_DEPS_COUNT))

echo "  Production dependencies: $DEPS_COUNT"
echo "  Development dependencies: $DEV_DEPS_COUNT"
echo "  Total dependencies: $TOTAL_DEPS"

# Check for commonly problematic large dependencies
LARGE_DEPS=("lodash" "moment" "rxjs" "antd" "material-ui")
FOUND_LARGE_DEPS=()

for dep in "${LARGE_DEPS[@]}"; do
    if jq -e ".dependencies.\"$dep\"" package.json >/dev/null 2>&1; then
        FOUND_LARGE_DEPS+=("$dep")
    fi
done

if [ ${#FOUND_LARGE_DEPS[@]} -gt 0 ]; then
    print_warning "Large dependencies detected: ${FOUND_LARGE_DEPS[*]} - consider alternatives"
else
    print_success "No commonly problematic large dependencies found"
fi

# 5. Build performance metrics
print_step "Build Performance Metrics"

echo "⏱️  Build Performance:"

# Measure TypeScript compilation time
echo "  Measuring TypeScript compilation..."
TS_START=$(date +%s%N)
if npx tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
    TS_END=$(date +%s%N)
    TS_TIME=$(( (TS_END - TS_START) / 1000000 ))
    echo "  TypeScript compilation: ${TS_TIME}ms"
    
    if [ "$TS_TIME" -gt 30000 ]; then
        print_warning "TypeScript compilation took ${TS_TIME}ms (>30s) - consider optimization"
    fi
else
    print_error "TypeScript compilation failed"
fi

# Measure ESLint performance (if available)
if [ -f ".eslintrc.js" ]; then
    echo "  Measuring ESLint performance..."
    ESLINT_START=$(date +%s%N)
    if npx eslint src/ --ext .ts,.tsx,.js,.jsx >/dev/null 2>&1; then
        ESLINT_END=$(date +%s%N)
        ESLINT_TIME=$(( (ESLINT_END - ESLINT_START) / 1000000 ))
        echo "  ESLint analysis: ${ESLINT_TIME}ms"
        
        if [ "$ESLINT_TIME" -gt 15000 ]; then
            print_warning "ESLint took ${ESLINT_TIME}ms (>15s) - consider rule optimization"
        fi
    fi
fi

print_success "Build performance analysis completed"

# 6. Memory usage estimation
print_step "Memory Usage Estimation"

echo "🧠 Memory Usage Estimation:"

# Estimate based on source code size and complexity
COMPLEXITY_SCORE=0

# Add points for various complexity factors
COMPONENT_COUNT=$(find src -name "*.tsx" | wc -l)
COMPLEXITY_SCORE=$((COMPLEXITY_SCORE + COMPONENT_COUNT))

# Navigation complexity
NAV_COUNT=$(find src -name "*Navigation*" -o -name "*Navigator*" | wc -l)
COMPLEXITY_SCORE=$((COMPLEXITY_SCORE + NAV_COUNT * 2))

# State management complexity  
STATE_COUNT=$(grep -r "useState\|useReducer\|zustand\|redux" src/ 2>/dev/null | wc -l)
COMPLEXITY_SCORE=$((COMPLEXITY_SCORE + STATE_COUNT / 5))

# Estimated memory usage (rough calculation)
ESTIMATED_MEMORY_MB=$((20 + COMPLEXITY_SCORE / 10 + SOURCE_SIZE_MB))

echo "  Components: $COMPONENT_COUNT"
echo "  Navigation complexity: $NAV_COUNT"
echo "  State operations: $STATE_COUNT"
echo "  Complexity score: $COMPLEXITY_SCORE"
echo "  Estimated memory usage: ${ESTIMATED_MEMORY_MB}MB"

if [ "$ESTIMATED_MEMORY_MB" -gt 100 ]; then
    print_warning "Estimated memory usage ${ESTIMATED_MEMORY_MB}MB may be high for mobile devices"
else
    print_success "Estimated memory usage within acceptable range"
fi

# 7. Performance recommendations
print_step "Performance Recommendations"

echo "💡 Performance Optimization Recommendations:"

# Bundle splitting recommendations
if [ "$BUNDLE_SIZE" -gt 10 ]; then
    echo "  • Consider implementing code splitting for large bundles"
fi

# Image optimization
if [ ${#LARGE_IMAGES[@]} -gt 0 ]; then
    echo "  • Optimize large images using tools like ImageOptim or TinyPNG"
    echo "  • Consider using WebP format for better compression"
fi

# Dependency optimization
if [ "$TOTAL_DEPS" -gt 50 ]; then
    echo "  • Review dependencies - $TOTAL_DEPS packages may be excessive"
    echo "  • Consider using tools like webpack-bundle-analyzer for analysis"
fi

# Source code optimization
if [ "$TS_ADOPTION_RATE" -lt 90 ]; then
    echo "  • Convert remaining JavaScript files to TypeScript for better optimization"
fi

if [ "$COMPONENT_COUNT" -gt 100 ]; then
    echo "  • Consider implementing lazy loading for large component counts"
fi

echo ""
echo -e "${GREEN}🎯 Performance Benchmark Complete! 🎯${NC}"
echo "=============================================="
echo "Summary:"
echo "  Bundle Size: ${TOTAL_SIZE}MB / ${MAX_BUNDLE_SIZE_MB}MB limit"
echo "  Source Size: ${SOURCE_SIZE_MB}MB / ${MAX_SOURCE_SIZE_MB}MB limit"
echo "  Dependencies: $TOTAL_DEPS packages"
echo "  TypeScript Adoption: ${TS_ADOPTION_RATE}%"
echo "  Estimated Memory: ${ESTIMATED_MEMORY_MB}MB"
echo ""