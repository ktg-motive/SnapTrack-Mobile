const config = {
  expo: {
    name: "SnapTrack",
    slug: "snaptrack-mobile",
    scheme: "snaptrack",
    version: "1.3.5",
    extra: {
      eas: {
        projectId: "886b28f0-e481-4ab2-aafe-bf4958623369"
      }
    },
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: false,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain", 
      backgroundColor: "#FFFFFF"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.snaptrack.mobile",
      buildNumber: "12",
      googleServicesFile: "./GoogleService-Info.plist",
      associatedDomains: ["applinks:snaptrack.bot"],
      infoPlist: {
        NSCameraUsageDescription: "SnapTrack uses your camera to capture photos of receipts for expense tracking and automatic data extraction. This helps you digitize your receipts and organize your expenses.",
        NSPhotoLibraryUsageDescription: "SnapTrack needs photo library access to select receipt images for processing.",
        NSPhotoLibraryAddUsageDescription: "SnapTrack needs permission to save receipt images to your photo library when auto-save is enabled.",
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.snaptrack.mobile",
      versionCode: 12,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0a0a"
      },
      edgeToEdgeEnabled: false,
      googleServicesFile: "./google-services.json",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_NETWORK_STATE"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "snaptrack.bot",
              pathPrefix: "/mobile"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        },
        {
          action: "VIEW",
          data: [
            {
              scheme: "snaptrack"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "SnapTrack uses your camera to capture photos of receipts for expense tracking and automatic data extraction. This helps you digitize your receipts and organize your expenses."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Allow SnapTrack to access your photos to select receipt images."
        }
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: "com.googleusercontent.apps.925529316912-rgmp4c8ah10vig4at93a62kl0seipdgm"
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "SnapTrack needs permission to save receipt images to your photo library when auto-save is enabled.",
          savePhotosPermission: "SnapTrack needs permission to save receipt images to your photo library when auto-save is enabled.",
          isAccessMediaLocationEnabled: true
        }
      ],
      "expo-apple-authentication"
    ]
  }
};

module.exports = config;