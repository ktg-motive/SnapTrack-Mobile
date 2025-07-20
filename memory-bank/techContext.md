# Technical Context

**Last Updated:** 2025-07-20 18:00:00 - Phase 3 UUID Authentication Complete - Impacts: [Cross-Platform Auth, UUID Service Integration, App Store Deployment]

## Technical Architecture

### Core Technology Stack
- **React Native 0.79.5** with Expo SDK 53 for cross-platform mobile development
- **TypeScript** with strict type checking for enhanced code quality and developer experience
- **React Navigation 7.x** with bottom tabs and stack navigation
- **Firebase Authentication** with Google OAuth, Apple Sign-In, and email/password support
- **UUID Authentication Service** for cross-platform user coordination and identification
- **expo-apple-authentication** for native iOS Apple Sign-In integration
- **AsyncStorage** for offline data persistence and queue management
- **Cross-Platform Sync** with real-time coordination between mobile and web platforms

### Backend Integration
- **SnapTrack API** for receipt processing and OCR functionality
- **UUID Authentication API** for cross-platform user management and coordination
- **Username Validation API** for real-time availability checking and registration
- **Multipart Form Data** uploads for receipt images with progress tracking
- **RESTful API Client** with comprehensive error handling and retry logic
- **Offline-First Architecture** with automatic sync when network restored
- **Cross-Platform Data Sync** with UUID-based user identification

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
│   │   ├── AuthScreen.tsx           # Authentication flow
│   │   ├── UsernameScreen.tsx       # Username collection and validation
│   │   └── EmailScreen.tsx          # Email collection (optional)
│   ├── services/            # Business logic and API clients
│   │   ├── api.ts                   # Backend API integration
│   │   ├── auth.ts                  # Firebase authentication
│   │   ├── uuidAuth.ts              # UUID authentication service
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

### UUID Authentication System
- **UUID Service Integration** for cross-platform user identification
- **Username Collection** with real-time availability validation
- **Email Collection** with App Store compliant optional flow
- **Firebase Configuration** with GoogleService-Info.plist for iOS authentication
- **Google OAuth** for seamless sign-in experience
- **Email/Password** fallback authentication method
- **AsyncStorage Persistence** for session management across app launches
- **Cross-Platform Coordination** with web platform UUID synchronization

### User Management
```typescript
interface User {
  uid: string;
  uuid: string;         // Cross-platform UUID identifier
  username: string;     // User-selected username
  email?: string;       // Optional email (App Store compliance)
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
- **UUID Authentication:** `/api/auth/uuid` endpoints for user management
- **Username Validation:** `/api/auth/username/check` for availability checking
- **Upload Endpoint:** `/api/receipts/upload` with multipart form data
- **OCR Processing:** Real-time status polling with confidence scoring
- **Cross-Platform Sync:** UUID-based data coordination endpoints

### Request/Response Patterns
```typescript
// UUID Authentication Flow
interface UUIDAuthResponse {
  uuid: string;
  username: string;
  email?: string;
  token: string;
  expires_at: string;
}

// Username Validation
interface UsernameCheckResponse {
  available: boolean;
  suggestions?: string[];
  message?: string;
}

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
  USER_UUID: '@user_uuid',
  USERNAME: '@username',
  CACHED_ENTITIES: '@cached_entities',
  CACHED_TAGS: '@cached_tags',
  CROSS_PLATFORM_SYNC: '@cross_platform_sync',
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
    "version": "1.4.0",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png" },
    "ios": {
      "bundleIdentifier": "com.motive.snaptrack",
      "buildNumber": "13"
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
- **iOS Only:** Android support planned for Phase 4
- **Network Dependency:** OCR processing and UUID authentication require internet connectivity
- **Storage Limits:** AsyncStorage has size limitations for large image queues
- **Cross-Platform Sync:** Real-time synchronization requires active network connection

### Phase 3 Achievements
- ✅ **UUID Authentication:** Complete cross-platform authentication system
- ✅ **Username Collection:** Real-time validation and availability checking
- ✅ **Email Optional Flow:** App Store compliant onboarding process
- ✅ **Cross-Platform Coordination:** Seamless data sync with web platform
- ✅ **Production Deployment:** App Store submission ready configuration

### Future Technical Improvements
- **Background Processing:** iOS background app refresh for sync operations
- **Image Processing:** On-device image optimization and compression
- **Offline OCR:** Edge-based text extraction for immediate feedback
- **Performance Monitoring:** Crash reporting and analytics integration
- **Android Platform:** Cross-platform expansion to Google Play Store