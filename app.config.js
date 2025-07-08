const config = {
  expo: {
    name: "SnapTrack",
    slug: "snaptrack-mobile",
    version: "1.2.1",
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
      backgroundColor: "#0a0a0a"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.snaptrack.mobile",
      buildNumber: "5",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        NSCameraUsageDescription: "SnapTrack needs camera access to capture receipt images for expense tracking.",
        NSPhotoLibraryUsageDescription: "SnapTrack needs photo library access to select receipt images for processing."
      }
    },
    android: {
      package: "com.snaptrack.mobile",
      versionCode: 5,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0a0a"
      },
      edgeToEdgeEnabled: false,
      googleServicesFile: "./google-services.json",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "ACCESS_NETWORK_STATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "Allow SnapTrack to access your camera to capture receipts."
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
      "expo-apple-authentication"
    ]
  }
};

module.exports = config;