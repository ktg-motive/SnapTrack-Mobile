import Constants from 'expo-constants';

/**
 * Version management utility
 * Centralizes version information from Expo config
 */

export const getAppVersion = (): string => {
  return Constants.expoConfig?.version || '1.0.0';
};

export const getBuildNumber = (): string => {
  // For iOS
  if (Constants.expoConfig?.ios?.buildNumber) {
    return Constants.expoConfig.ios.buildNumber;
  }
  // For Android (versionCode)
  if (Constants.expoConfig?.android?.versionCode) {
    return Constants.expoConfig.android.versionCode.toString();
  }
  return '1';
};

export const getVersionInfo = () => {
  return {
    version: getAppVersion(),
    buildNumber: getBuildNumber(),
    fullVersion: `${getAppVersion()} (${getBuildNumber()})`
  };
};

// Export version info for easy access
export const VERSION_INFO = getVersionInfo();