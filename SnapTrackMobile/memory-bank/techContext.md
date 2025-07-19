# Technical Context

**Last Updated:** 2025-07-19 15:45:00 - Sentry Error Tracking Integration - Impacts: [Error Monitoring, App Stability, Developer Experience]

## Technical Architecture

### Core Technology Stack
- **React Native 0.79.5** with Expo SDK 53 for cross-platform mobile development
- **TypeScript** with strict type checking for enhanced code quality and developer experience
- **React Navigation 7.x** with bottom tabs and stack navigation
- **Firebase Authentication** with Google OAuth, Apple Sign-In, and email/password support
- **expo-apple-authentication** for native iOS Apple Sign-In integration
- **AsyncStorage** for offline data persistence and queue management
- **@sentry/react-native** for error tracking and performance monitoring (Added July 19, 2025)

### Error Monitoring & Observability (July 19, 2025)
- **Sentry Integration** with free tier optimizations (10K events/month)
- **Performance Monitoring** with 10% sampling rate (50% for critical operations)
- **User Context Tracking** with automatic session management
- **Breadcrumb Tracking** for user journey before errors
- **Platform-Specific Tracking** for iOS and Android differences
- **Smart Filtering** to conserve event quota (production only, no dev errors)

### Backend Integration
- **SnapTrack API** for receipt processing and OCR functionality
- **Multipart Form Data** uploads for receipt images with progress tracking
- **RESTful API Client** with comprehensive error handling and retry logic
- **Offline-First Architecture** with automatic sync when network restored

### Critical iOS Bug Fixes (July 19, 2025)

#### processReceiptWithAPI Unreachable Code Fix
**Issue**: iOS upload working on first attempt but timing out on second attempt
**Root Cause**: processReceiptWithAPI() was placed after return statement in useEffect hook
**Solution**: Moved function call before return statement in ReviewScreen.tsx
**Impact**: Fixed iOS upload reliability issues

#### React Native Crash Fixes
**Issue**: App crashing with "Text strings must be rendered within a <Text> component"
**Root Cause**: Template strings with undefined values (e.g., aiTriggers?.length)
**Solution**: Added null checks for all template string variables
**Files Modified**: `src/screens/ReviewScreen.tsx`

#### Formatting Regressions
**Issue 1**: Dollar amounts showing "12" instead of "12.00"
**Solution**: Changed from .toString() to parseFloat().toFixed(2)
**Issue 2**: AI confidence showing "9,500%" instead of "95%"
**Solution**: Fixed percentage calculation using getConfidencePercentage() helper

#### expo-file-system Crash
**Issue**: App crashing on launch with "cannot read property 'getInfoAsync' of undefined"
**Root Cause**: Dynamic import of expo-file-system was failing
**Solution**: Removed the file existence check entirely (was added for debugging)
**Impact**: App launches successfully without crashes

### Emergency Technical Fixes (v1.3.3 - July 15, 2025)

#### Android Crash Resolution
**Issue**: Android app crashes during receipt processing with "Text strings must be rendered within a <Text> component" error
**Root Cause**: React Native Android is stricter about conditional style rendering than iOS
**Solution**: Replaced all `condition && styles.style` patterns with `...(condition ? [styles.style] : [])`
**Files Modified**: `src/screens/ReviewScreen.tsx` (6 style fixes)

#### API FormData Fix
**Issue**: Network error "multipart != application/json" when uploading receipts on Android
**Root Cause**: API client was setting Content-Type: application/json for all requests including FormData
**Solution**: Added FormData detection to conditionally skip Content-Type header
**Files Modified**: `src/services/apiClient.ts` (makeRequest method)
**Impact**: Improves reliability on both Android and iOS platforms

#### Version Management
**Emergency Release**: v1.3.3 deployed to Firebase App Distribution for Android
**Next Steps**: Test iOS compatibility and coordinate cross-platform release

## Project Structure

### Directory Organization
```
SnapTrackMobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── HomeScreenFooter.tsx     # Smart footer with 4 states
│   │   ├── QuickStats.tsx           # Financial summary cards
│   │   ├── SleekReceiptCard.tsx     # Receipt list items
│   │   └── ReceiptPreviewModal.tsx  # Full-screen image preview
│   ├── screens/             # Screen components
│   │   ├── HomeScreen.tsx           # Main dashboard with fixed layout
│   │   ├── CameraScreen.tsx         # Receipt capture interface
│   │   ├── ReviewScreen.tsx         # Expense review and editing
│   │   └── AuthScreen.tsx           # Authentication flow
│   ├── services/            # Business logic and API clients
│   │   ├── api.ts                   # Backend API integration
│   │   ├── auth.ts                  # Firebase authentication
│   │   └── storage.ts               # Offline storage management
│   ├── styles/              # Design system and theming
│   │   └── theme.ts                 # Colors, typography, spacing
│   └── types/               # TypeScript type definitions
│       └── index.ts                 # Receipt, User, API types
├── assets/                  # Static assets and images
├── app.json                 # Expo configuration
└── package.json             # Dependencies and scripts
```

### Key Components Architecture

#### HomeScreen Layout Pattern
```typescript
// Fixed elements that don't scroll
<SafeAreaView>
  <Header />
  <QuickStats />                    // Fixed at top
  <CaptureSection />               // Fixed in middle
  
  // Scrollable content area
  <FlatList data={receipts}>       // Only receipts scroll
    <SleekReceiptCard />
    <HomeScreenFooter />           // Smart footer with states
  </FlatList>
</SafeAreaView>
```

#### Smart Footer State Management
```typescript
export enum ReceiptsState {
  hasMore = 'hasMore',     // More receipts available
  loading = 'loading',     // Loading new receipts
  endOfList = 'endOfList', // All receipts loaded
  empty = 'empty',         // No receipts exist
}
```

## Development Environment

### Setup Requirements
- **Node.js 18+** for JavaScript runtime and package management
- **Expo CLI 6+** for development tooling and build management
- **iOS Simulator** (Xcode 15+) for development and testing
- **Firebase Project** with authentication and storage configured

### Installation Commands
```bash
npm install -g @expo/cli
npm install
npx expo prebuild --clean
npm run ios
```

### Development Scripts
```json
{
  "start": "expo start",
  "ios": "expo run:ios",
  "android": "expo run:android",
  "prebuild": "expo prebuild --clean",
  "build:ios": "eas build --platform ios"
}
```

## Authentication Flow

### Firebase Configuration
- **GoogleService-Info.plist** configured for iOS authentication
- **Google OAuth** for seamless sign-in experience
- **Email/Password** fallback authentication method
- **AsyncStorage Persistence** for session management across app launches

### User Management
```typescript
interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  initials: string;     // Generated for avatar display
  colorIndex: number;   // For avatar background color
}
```

## API Integration

### SnapTrack Backend Integration
- **Base URL:** Production SnapTrack API endpoint
- **Authentication:** Bearer token with automatic refresh
- **Upload Endpoint:** `/api/receipts/upload` with multipart form data
- **OCR Processing:** Real-time status polling with confidence scoring

### Request/Response Patterns
```typescript
// Receipt upload with progress tracking
interface ReceiptUploadResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  extracted_data?: {
    vendor?: string;
    amount?: number;
    date?: string;
    confidence?: number;
  };
}
```

### Error Handling Strategy
- **Network Errors:** Automatic retry with exponential backoff
- **API Errors:** User-friendly error messages with recovery actions
- **Offline Mode:** Queue operations and sync when network restored
- **Validation Errors:** Real-time form validation with clear feedback

## Offline Architecture

### Storage Strategy
```typescript
// AsyncStorage keys for offline data
const STORAGE_KEYS = {
  PENDING_RECEIPTS: '@pending_receipts',
  USER_SESSION: '@user_session',
  CACHED_ENTITIES: '@cached_entities',
  CACHED_TAGS: '@cached_tags',
};
```

### Sync Management
- **Queue System:** Store failed operations locally with timestamps
- **Background Sync:** Automatic retry when network connectivity restored
- **Conflict Resolution:** Last-write-wins strategy for simplicity
- **Progress Feedback:** Visual indicators for sync status and queue length

## Design System

### Typography Hierarchy
```typescript
export const typography = {
  title1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  title3: { fontSize: 20, fontWeight: '600', lineHeight: 25 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  money: { fontSize: 16, fontWeight: '600', fontFamily: 'Menlo' },
};
```

### Color Palette
```typescript
export const colors = {
  primary: '#1C65C9',      // Primary blue for CTAs
  secondary: '#019C89',    // Secondary teal for accents
  success: '#10B981',      // Green for success states
  warning: '#F59E0B',      // Orange for warnings
  error: '#EF4444',        // Red for errors
  textPrimary: '#1F2937',  // Dark gray for primary text
  textSecondary: '#6B7280', // Medium gray for secondary text
};
```

### Spacing System
```typescript
export const spacing = {
  xs: 4,    // Extra small spacing
  sm: 8,    // Small spacing
  md: 16,   // Medium spacing (base unit)
  lg: 24,   // Large spacing
  xl: 32,   // Extra large spacing
};
```

## Build and Deployment

### iOS Configuration
```json
// app.json key sections
{
  "expo": {
    "name": "SnapTrack",
    "slug": "snaptrack-mobile",
    "platforms": ["ios"],
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png" },
    "ios": {
      "bundleIdentifier": "com.motive.snaptrack",
      "buildNumber": "1"
    }
  }
}
```

### EAS Build Configuration
```json
// eas.json
{
  "build": {
    "preview": {
      "ios": { "simulator": true }
    },
    "production": {
      "ios": { "distribution": "store" }
    }
  }
}
```

### Deployment Commands
```bash
# Development build for testing
eas build --platform ios --profile preview

# Production build for App Store
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios
```

## Performance Optimization

### React Native Optimizations
- **FlatList** with proper `getItemLayout` for consistent performance
- **Image Optimization** with appropriate `resizeMode` and caching
- **Memory Management** with proper component cleanup and useEffect dependencies
- **Bundle Splitting** with dynamic imports for non-critical features

### Network Optimization
- **Request Batching** for multiple API calls
- **Image Compression** before upload to reduce bandwidth
- **Caching Strategy** for frequently accessed data (entities, tags)
- **Progress Indicators** for all long-running operations

## Security Considerations

### Data Protection
- **HTTPS Only** for all API communications
- **Token Security** with secure storage using Expo SecureStore
- **Image Security** with proper URI validation and sanitization
- **User Privacy** with minimal data collection and clear permissions

### Authentication Security
- **Firebase Security Rules** configured for user data isolation
- **Token Expiration** with automatic refresh handling
- **OAuth Security** following Google's best practices for mobile apps
- **Session Management** with proper cleanup on sign-out

## Testing Strategy

### Development Testing
- **iOS Simulator Testing** for all core functionality
- **Real Device Testing** for camera and performance validation
- **Network Condition Testing** including offline scenarios
- **Error Scenario Testing** for all failure modes

### Automated Testing Considerations
- **Unit Tests** for business logic and utility functions
- **Integration Tests** for API client and authentication flows
- **E2E Tests** for critical user journeys (capture → review → save)
- **Performance Tests** for memory usage and render performance

## Known Technical Limitations

### Current Constraints
- **iOS Only:** Android support planned for Phase 2
- **Expo Limitations:** Google Sign-In only works in development builds
- **Network Dependency:** OCR processing requires internet connectivity
- **Storage Limits:** AsyncStorage has size limitations for large image queues

### Future Technical Improvements
- **Background Processing:** iOS background app refresh for sync operations
- **Image Processing:** On-device image optimization and compression
- **Offline OCR:** Edge-based text extraction for immediate feedback
- **Performance Monitoring:** Crash reporting and analytics integration