# SnapTrack Mobile - Encryption Compliance Configuration

**Last Updated:** January 15, 2025  
**Status:** ✅ Configured for App Store Compliance

## Overview

SnapTrack Mobile has been configured to comply with Apple's encryption export regulations. The app uses only standard HTTPS encryption for API communication and does not implement any custom encryption algorithms.

## Configuration Details

### 1. Info.plist Configuration
The following key has been added to the iOS configuration in `app.config.js`:

```javascript
ios: {
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false
  }
}
```

This declares that the app:
- ✅ Uses only standard HTTPS encryption
- ✅ Does not contain any proprietary encryption
- ✅ Is exempt from export compliance requirements

### 2. Encryption Usage in SnapTrack

SnapTrack uses encryption only for:
- **HTTPS Communication:** Standard TLS/SSL for API calls
- **Firebase Authentication:** Standard OAuth2/JWT tokens
- **AsyncStorage:** Uses iOS Keychain (standard encryption)

SnapTrack does NOT use:
- ❌ Custom encryption algorithms
- ❌ End-to-end encryption
- ❌ Proprietary cryptographic methods
- ❌ Encryption for data at rest (beyond platform defaults)

### 3. Build Configuration

The EAS build configuration ensures:
- ✅ `ITSAppUsesNonExemptEncryption` is included in all iOS builds
- ✅ Firebase configuration files are properly included
- ✅ No encryption keys or certificates are bundled in builds

### 4. App Store Submission

When submitting to App Store Connect:
1. The encryption compliance will be automatically detected from Info.plist
2. No additional export compliance documentation is required
3. The app can be distributed globally without restrictions

## Verification Steps

To verify the configuration:

```bash
# 1. Build the app
npm run build-ios-fast

# 2. After build completes, check the Info.plist in the IPA
# The ITSAppUsesNonExemptEncryption key should be present and set to false
```

## Important Notes

- This configuration applies to ALL builds (development, staging, production)
- If encryption usage changes in the future, update this configuration
- Always review Apple's latest export compliance requirements before submission

## References

- [Apple Export Compliance](https://developer.apple.com/documentation/security/complying_with_encryption_export_regulations)
- [App Store Connect Help](https://help.apple.com/app-store-connect/#/dev88f5c7bf9)