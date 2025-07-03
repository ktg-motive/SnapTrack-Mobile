# Google Sign-In Setup Guide

This guide explains how to configure Google Sign-In for the SnapTrack Mobile app.

## Prerequisites

1. **Firebase Project**: Ensure you have a Firebase project set up for SnapTrack
2. **Firebase Console Access**: You need admin access to the Firebase console
3. **Google Cloud Console Access**: Access to the Google Cloud Console for the same project

## Setup Steps

### 1. Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your SnapTrack project
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Google** as a sign-in provider
5. Note down the **Web client ID** (this will be used in the app configuration)

### 2. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your SnapTrack project
3. Navigate to **APIs & Services** > **Credentials**
4. Create OAuth 2.0 Client IDs for:
   - **Android app** (if building for Android)
   - **iOS app** (if building for iOS)
   - **Web application** (already created by Firebase)

### 3. Download Configuration Files

#### For Android:
1. In Firebase Console, go to **Project Settings** > **General**
2. Under "Your apps", find your Android app
3. Download `google-services.json`
4. Place the file in the root directory: `/SnapTrackMobile/google-services.json`

#### For iOS:
1. In Firebase Console, go to **Project Settings** > **General**
2. Under "Your apps", find your iOS app
3. Download `GoogleService-Info.plist`
4. Place the file in the root directory: `/SnapTrackMobile/GoogleService-Info.plist`

### 4. Update App Configuration

1. Open `/src/config/index.ts`
2. Replace `"your-google-web-client-id.googleusercontent.com"` with your actual Web Client ID from Firebase
3. Replace the Firebase configuration values with your actual project values

```typescript
FIREBASE_CONFIG: {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
},

GOOGLE_WEB_CLIENT_ID: "your-actual-web-client-id.googleusercontent.com",
```

### 5. SHA-1 Certificate Fingerprint (Android Only)

For Android builds, you need to add SHA-1 certificate fingerprints:

#### Development:
```bash
cd android
./gradlew signingReport
```

#### Production:
Use the SHA-1 from your release keystore.

Add these fingerprints to:
1. **Firebase Console**: Project Settings > General > Your apps > Android app
2. **Google Cloud Console**: APIs & Services > Credentials > OAuth 2.0 Client ID for Android

### 6. iOS Bundle ID Configuration

For iOS builds, ensure the Bundle ID in:
1. **app.json** (`expo.ios.bundleIdentifier`)
2. **Firebase Console** (iOS app configuration)
3. **Google Cloud Console** (OAuth 2.0 Client ID for iOS)

All match exactly.

## Testing

1. **Development**: Use Expo Go or development build
2. **Production**: Test with production builds (Google Sign-In doesn't work in Expo Go for production apps)

## Troubleshooting

### Common Issues:

1. **"Google Play Services not available"**
   - Ensure Google Play Services is installed on the Android device
   - Test on a real device, not an emulator without Google Play

2. **"No ID token received"**
   - Check that the Web Client ID is correctly configured
   - Verify Firebase project settings

3. **"Sign in failed"**
   - Verify SHA-1 certificates are correctly added
   - Check that OAuth consent screen is configured
   - Ensure all Bundle IDs/Package names match

4. **iOS "Invalid client"**
   - Verify `GoogleService-Info.plist` is in the root directory
   - Check that iOS Bundle ID matches across all configurations

### Debug Steps:

1. Check console logs for detailed error messages
2. Verify configuration files are in the correct location
3. Ensure all IDs and certificates match between platforms
4. Test with a fresh build after configuration changes

## Security Notes

- Never commit configuration files with real credentials to version control
- Use environment variables or secure configuration management for production
- Regularly rotate OAuth credentials
- Monitor authentication logs for suspicious activity

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Expo Google Sign-In Guide](https://docs.expo.dev/guides/google-authentication/)