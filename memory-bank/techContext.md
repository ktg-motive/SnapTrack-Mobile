# Technical Context

**Last Updated:** 2025-07-03 14:55:00  
**Technology Stack:** React Native + Expo + TypeScript + Firebase  
**Deployment Target:** iOS TestFlight → App Store (Android future)  
**Backend Integration:** SnapTrack API (Python Flask + Supabase)

## Core Technology Architecture

### Frontend Stack (React Native)
```typescript
// Core Technologies
React Native: 0.73.x          // Cross-platform mobile framework
Expo SDK: 53.x                // Development and build tools
TypeScript: 5.x               // Type safety and development experience
React Navigation: 7.x         // Navigation and routing

// UI and Styling
react-native-vector-icons     // Icon library (Ionicons)
expo-linear-gradient          // Gradient components
Custom theme system           // Colors, typography, spacing, shadows

// Device Integration
expo-camera                   // Camera access and photo capture
expo-image-picker            // Photo library access
expo-haptics                 // Tactile feedback
expo-auth-session            // OAuth flows
```

### Authentication Architecture
```typescript
// Firebase Integration
Firebase Auth: 10.x           // User authentication
@react-native-google-signin   // Google OAuth (conditional import)
@react-native-async-storage   // Token persistence
Firebase Admin SDK            // Backend token validation

// Authentication Flow
Frontend: Firebase Auth → Backend: Token validation → API access
Session persistence via AsyncStorage with automatic refresh
Google Sign-In available in development builds (not Expo Go)
```

### State Management & Data Flow
```typescript
// State Architecture
React Hooks: useState, useEffect, useCallback
Context API: User authentication state
Local State: Component-specific UI state
Offline Storage: AsyncStorage for queued receipts

// API Integration
Custom apiClient class with error handling
Network state detection via @react-native-netinfo
Offline queue system with automatic retry
Real-time sync when network restored
```

### File Structure & Organization
```
src/
├── components/              # Reusable UI components
│   ├── SnapTrackLogo.tsx   # Brand logo component
│   ├── UserAvatar.tsx      # User initials avatar
│   ├── QuickStats.tsx      # Dashboard statistics
│   ├── RecentReceipts.tsx  # Receipt list component
│   └── WelcomeMessage.tsx  # Dashboard welcome
├── screens/                # Screen components
│   ├── AuthScreen.tsx      # Login/signup flow
│   ├── HomeScreen.tsx      # Main dashboard
│   ├── CameraScreen.tsx    # Receipt capture
│   └── ReviewScreen.tsx    # Receipt review/edit
├── services/               # Business logic
│   ├── apiClient.ts        # Backend API integration
│   ├── authService.ts      # Authentication service
│   ├── offlineStorage.ts   # Offline queue management
│   └── errorReporting.ts   # Error handling
├── styles/                 # Design system
│   └── theme.ts           # Colors, typography, spacing
├── types/                  # TypeScript definitions
│   └── index.ts           # API and component types
└── config/                # Configuration
    └── index.ts           # Firebase and API config
```

## Backend Integration

### SnapTrack API Integration
```typescript
// API Client Configuration
Base URL: https://snaptrack-receipts-6b4ae7a14b3e.herokuapp.com
Authentication: Bearer token (Firebase JWT)
Content-Type: multipart/form-data (file uploads)
Response Format: JSON with error handling

// Core API Endpoints
POST /api/parse              // Receipt upload and OCR processing
GET  /api/expenses           // List user expenses
POST /api/expenses           // Create new expense
PUT  /api/expenses/:id       // Update existing expense
GET  /api/entities           // List user entities
GET  /api/tags/search        // Tag autocomplete search
```

### Data Models & Types
```typescript
// Core Types
interface UploadedReceipt {
  id: string;
  receipt_url: string;
  extracted_data?: {
    vendor?: string;
    amount?: number;
    date?: string;
    tags?: string;
    confidence_score?: number;
  };
  status: 'processing' | 'completed' | 'failed';
}

interface Expense {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  entity: string;
  tags: string[];
  notes?: string;
  receipt_url?: string;
}

interface Entity {
  id: string;
  name: string;
  email_identifier: string;
  created_at: string;
  updated_at: string;
}
```

### Error Handling & Resilience
```typescript
// Error Handling Strategy
API Error Classes: ApiError with status codes and messages
Network Detection: @react-native-netinfo for connection monitoring
Offline Queue: AsyncStorage-based receipt queue with retry logic
User Feedback: Alert dialogs with clear error messages and recovery options

// Fallback Mechanisms
Missing Receipt ID: Direct expense creation fallback
API Response Variations: Multiple data extraction patterns
Network Failures: Offline storage with automatic sync
Processing Failures: Retry mechanisms with user notification
```

## Development Environment

### Setup and Configuration
```bash
# Development Prerequisites
Node.js: 18.x or higher        # JavaScript runtime
Expo CLI: Latest               # Development tools
iOS Simulator: Xcode 15+       # iOS testing
Firebase Project: Configured   # Authentication backend

# Environment Variables
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_API_BASE_URL=https://snaptrack-receipts-6b4ae7a14b3e.herokuapp.com
```

### Build and Deployment Configuration
```json
// app.json Configuration
{
  "expo": {
    "name": "SnapTrack",
    "slug": "snaptrack-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "ios": {
      "bundleIdentifier": "com.snaptrack.mobile",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.snaptrack.mobile",
      "versionCode": 1
    }
  }
}
```

### Development Commands
```bash
# Development Workflow
npm install                    # Install dependencies
npx expo start                # Start development server
npx expo run:ios              # Run on iOS simulator
npx expo run:android          # Run on Android emulator

# Build and Deployment
npx expo prebuild --clean     # Generate native projects
eas build --platform ios     # Build for TestFlight
eas build --platform all     # Build for both platforms
eas submit --platform ios    # Submit to App Store Connect
```

## Performance and Optimization

### Mobile Performance Considerations
```typescript
// Performance Optimizations
Image Handling: Optimized file sizes and compression
Lazy Loading: Component-based code splitting
Memory Management: Proper cleanup in useEffect hooks
Navigation: Stack navigation with header optimization
Offline Storage: Efficient AsyncStorage usage patterns

// Bundle Size Management
Tree Shaking: Import only used components/functions
Asset Optimization: Proper image formats and sizes
Dependency Auditing: Regular cleanup of unused packages
Code Splitting: Screen-based bundle organization
```

### Error Monitoring and Analytics
```typescript
// Monitoring Strategy (Future)
Crash Reporting: Integration with Sentry or Crashlytics
Performance Monitoring: React Native performance metrics
User Analytics: Usage patterns and workflow optimization
API Monitoring: Response times and error rates
```

## Security and Privacy

### Data Protection
```typescript
// Security Measures
Authentication: Firebase Auth with JWT tokens
API Security: Bearer token authentication with backend validation
Local Storage: AsyncStorage encryption for sensitive data
Network: HTTPS-only communication with certificate pinning
Permissions: Minimal required permissions (camera, photo library)

// Privacy Considerations
Data Retention: Receipts processed on secure backend
User Consent: Clear permission requests for camera/photos
Data Export: User-controlled data export and deletion
Analytics: No personal data in analytics tracking
```

### Compliance and Standards
```typescript
// Mobile Platform Compliance
iOS: App Store guidelines compliance
Android: Google Play Store guidelines (future)
Privacy: GDPR-compliant data handling
Security: OWASP mobile security best practices
Accessibility: iOS accessibility guidelines support
```

## Integration Points

### SnapTrack Backend Dependencies
```python
# Backend API Requirements
Flask Application: Python 3.x with OCR processing
Google Vision API: Receipt text extraction
Supabase Database: Multi-tenant expense storage
Firebase Admin: Token validation and user management
SendGrid (future): Email receipt processing
```

### Cross-Platform Considerations
```typescript
// Platform Differences
iOS: TestFlight beta testing, App Store deployment
Android: Google Play Console (future development)
Expo Go: Development testing (limited native features)
Development Builds: Full native feature access including Google Sign-In

// Feature Parity
Core Features: 100% cross-platform compatibility
Platform-Specific: iOS Shortcuts integration (future)
Authentication: Google Sign-In in development builds only
Camera: Native camera access on both platforms
```

## Testing and Quality Assurance

### Testing Strategy
```typescript
// Testing Approach
Unit Testing: Component and service function testing
Integration Testing: API communication and data flow
E2E Testing: Full receipt capture and processing workflow
Device Testing: Real iOS devices via TestFlight
Performance Testing: Memory usage, battery impact, load times

// Quality Gates
TypeScript: Strict type checking and error prevention
Linting: ESLint and Prettier code quality enforcement
Build Validation: Successful iOS and Android builds
API Integration: Backend compatibility and error handling
User Acceptance: Real-world receipt processing validation
```

### Debugging and Development Tools
```bash
# Development Tools
Expo DevTools: Real-time debugging and hot reload
React Native Debugger: Component tree and state inspection
Network Inspector: API request and response monitoring
iOS Simulator: iOS-specific testing and debugging
Physical Devices: Real-world testing via Expo Development Build
```