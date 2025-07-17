# Apple Sign-In Configuration Guide

## Overview
This guide walks through setting up Apple Sign-In for SnapTrack mobile app with Firebase Authentication.

## Firebase Console Configuration

### 1. Enable Apple Provider in Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `snaptrack-expense`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Apple** provider
5. Enable the provider
6. Configure the following:
   - **Service ID**: Create in Apple Developer Console (see below)
   - **OAuth code flow configuration**: Add Web Domain and Return URL

### 2. Firebase Return URL
The return URL for Firebase should be:
```
https://snaptrack-expense.firebaseapp.com/__/auth/handler
```

## Apple Developer Console Configuration

### 1. Create App ID (if not already created)
1. Go to [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list)
2. Click **+** to create a new identifier
3. Select **App IDs** → **App**
4. Configure:
   - **Bundle ID**: `com.snaptrack.mobile`
   - **Capabilities**: Enable "Sign In with Apple"

### 2. Create Service ID (Required for Firebase)
1. In Apple Developer Console, go to **Identifiers**
2. Click **+** to create a new identifier
3. Select **Services IDs**
4. Configure:
   - **Identifier**: `com.snaptrack.mobile.signin` (or similar)
   - **Description**: "SnapTrack Sign In"
5. After creation, click on the Service ID to configure
6. Enable **Sign In with Apple**
7. Click **Configure** and add:
   - **Primary App ID**: Select your SnapTrack app
   - **Domains and Subdomains**: `snaptrack-expense.firebaseapp.com`
   - **Return URLs**: `https://snaptrack-expense.firebaseapp.com/__/auth/handler`

### 3. Create Sign In with Apple Key
1. Go to **Keys** section
2. Click **+** to create a new key
3. Configure:
   - **Key Name**: "SnapTrack Apple Sign In"
   - Enable **Sign In with Apple**
   - Click **Configure** next to Sign In with Apple
   - Select your Primary App ID
4. Download the key file (you'll need this for server-side verification if implementing custom backend)

## Common Issues and Solutions

### "Invalid web redirect url" Error
This error occurs when the return URL isn't properly configured. Ensure:
1. The URL includes `https://` prefix
2. No trailing slashes
3. Exact match in Apple Developer Console
4. Wait 5-10 minutes for propagation after changes

### Bundle ID Mismatch
Ensure the bundle ID matches across:
- `app.config.js`: `com.snaptrack.mobile`
- Apple Developer Console App ID
- Firebase iOS app configuration

### Service ID Not Working
If updates to an existing Service ID don't work:
1. Delete the existing Service ID
2. Create a new one with correct configuration
3. Update Firebase Console with new Service ID

## Testing

### Development Build
Apple Sign-In requires a development build and won't work in Expo Go:
```bash
# Build for iOS simulator (no Apple Sign-In)
expo build:ios --type simulator

# Build for device testing (Apple Sign-In available)
expo build:ios --type development
```

### Production Build
```bash
expo build:ios --type app-store
```

## Verification Steps
1. Verify Apple Developer Console configuration
2. Check Firebase Console Apple provider settings
3. Ensure app.config.js includes Apple Authentication plugin
4. Build and test on physical iOS device
5. Monitor console logs for specific error codes

## Support Links
- [Firebase Apple Sign-In Documentation](https://firebase.google.com/docs/auth/ios/apple)
- [Apple Sign In with Apple Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)