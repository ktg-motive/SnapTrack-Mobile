# SnapTrack Mobile

A companion mobile app for SnapTrack receipt processing system with Vegas neon design aesthetics.

## Features

- **Vegas Neon Design System**: Modern UI with gradient buttons and neon color accents
- **Camera Receipt Capture**: Real-time document scanning with permission handling
- **Real-time OCR Processing**: Integration with Google Cloud Vision API via SnapTrack backend
- **Firebase Authentication**: Email/password and Google Sign-In support
- **Cross-platform**: Built with React Native and Expo SDK 53
- **Responsive Design**: Optimized for both iOS and Android

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios     # iOS simulator
npm run android # Android emulator
npm run web     # Web browser
```

## Authentication Setup

The app supports two authentication methods:

### Email/Password Authentication
- Standard Firebase email/password authentication
- Account creation and sign-in flows
- Password reset functionality

### Google Sign-In
- One-tap Google authentication
- Seamless integration with Firebase Auth
- Automatic profile picture and display name import

**Setup Required**: See [Google Sign-In Setup Guide](./docs/GOOGLE_SIGNIN_SETUP.md) for configuration instructions.

## Architecture

- **Frontend**: React Native with TypeScript
- **Navigation**: React Navigation with native stack
- **Styling**: Custom Vegas neon theme system
- **Authentication**: Firebase Auth with Google Sign-In
- **Backend API**: SnapTrack Heroku backend integration
- **OCR Processing**: Google Cloud Vision API
- **State Management**: React hooks and context

## Development

### Configuration

Update `/src/config/index.ts` with your:
- Firebase project configuration
- Google Web Client ID for Google Sign-In
- SnapTrack backend API URL

### Design System

The app uses a custom Vegas neon design system with:
- Gradient buttons and neon color accents
- Consistent spacing and typography
- Dark theme optimized for mobile
- Card-based layout with shadows

### Core Workflow

1. **Camera Capture**: Document scanning with real-time preview
2. **OCR Processing**: 4-stage processing with progress indicators
3. **Form Review**: Edit extracted data with confidence scoring
4. **Data Persistence**: Save to SnapTrack backend with sync

## Documentation

- [Google Sign-In Setup](./docs/GOOGLE_SIGNIN_SETUP.md) - Complete Google authentication setup
- [API Integration](./docs/API_INTEGRATION.md) - Backend API documentation
- [Design System](./docs/DESIGN_SYSTEM.md) - Vegas neon theme guidelines

## Tech Stack

- **React Native** 0.79.5
- **Expo SDK** ~53.0.16
- **TypeScript** ~5.8.3
- **React Navigation** ^7.1.14
- **Firebase** ^11.10.0
- **Google Sign-In** ^15.0.0
- **Linear Gradient** ~14.1.5
- **Vector Icons** ^14.1.0

## Production Deployment

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

**Note**: Google Sign-In requires production builds and proper configuration. See setup guide for details.

## Contributing

1. Follow the existing Vegas neon design patterns
2. Maintain TypeScript type safety
3. Test authentication flows on real devices
4. Update documentation for new features

## License

Private - SnapTrack Mobile App