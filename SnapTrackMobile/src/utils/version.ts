import Constants from 'expo-constants';
import { apiClient } from '../services/apiClient';

/**
 * Version management utility
 * Centralizes version information from Expo config with server integration
 */

export interface VersionResponse {
  version: string;
  buildNumber: string;
  releaseDate: string;
  releaseNotesUrl?: string;
  isLatest: boolean;
  platform: string;
  hasReleaseNotes: boolean;
  downloadUrl?: string;
  fallback?: boolean;
}

export interface ReleaseNotesResponse {
  id: string;
  versionId: string;
  platform: string;
  content: string;
  contentType: 'markdown' | 'plain' | 'html';
  highlights: string[];
  releaseType: 'major' | 'minor' | 'patch' | 'hotfix';
  version?: string;
  buildNumber?: string;
  releaseDate?: string;
  createdAt: string;
  fallback?: boolean;
}

export interface UpdateCheckResponse {
  isLatest: boolean;
  currentVersion: string;
  clientVersion: string;
  updateAvailable: boolean;
  platform: string;
  lastChecked: string;
  error?: string;
}

// Existing functions remain unchanged
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

// New server-integrated functions
export const getVersionWithServer = async (): Promise<VersionResponse> => {
  const localVersion = getVersionInfo();
  const platform = Constants.platform?.ios ? 'ios' : 'android';
  
  try {
    const response = await apiClient.get(`/api/app/version?platform=${platform}`);
    const serverVersion = response.data;
    
    // Check if local version matches server version
    const isLatest = compareVersions(localVersion.version, serverVersion.version) >= 0;
    
    return {
      version: serverVersion.version || localVersion.version,
      buildNumber: serverVersion.buildNumber || localVersion.buildNumber,
      releaseDate: serverVersion.releaseDate || new Date().toISOString(),
      releaseNotesUrl: serverVersion.releaseNotesUrl,
      isLatest,
      platform,
      hasReleaseNotes: serverVersion.hasReleaseNotes || false,
      downloadUrl: serverVersion.downloadUrl
    };
  } catch (error) {
    console.log('Version check failed, using local version:', error);
    return { 
      version: localVersion.version,
      buildNumber: localVersion.buildNumber,
      releaseDate: new Date().toISOString(),
      releaseNotesUrl: undefined,
      isLatest: true, 
      platform,
      hasReleaseNotes: false,
      fallback: true
    };
  }
};

export const checkForUpdates = async (): Promise<UpdateCheckResponse> => {
  const localVersion = getVersionInfo();
  const platform = Constants.platform?.ios ? 'ios' : 'android';
  
  try {
    const response = await apiClient.get(`/api/app/check-update?version=${encodeURIComponent(localVersion.version)}&platform=${platform}`);
    
    return response.data;
  } catch (error) {
    console.log('Update check failed:', error);
    return {
      isLatest: true, // Conservative fallback
      currentVersion: localVersion.version,
      clientVersion: localVersion.version,
      updateAvailable: false,
      platform,
      lastChecked: new Date().toISOString(),
      error: 'Unable to check for updates'
    };
  }
};

export const getReleaseNotes = async (releaseNotesUrl?: string): Promise<ReleaseNotesResponse | null> => {
  if (!releaseNotesUrl) return null;
  
  try {
    const platform = Constants.platform?.ios ? 'ios' : 'android';
    const response = await apiClient.get(`${releaseNotesUrl}?platform=${platform}`);
    return response.data;
  } catch (error) {
    console.log('Failed to fetch release notes:', error);
    return null;
  }
};

export const getVersionHistory = async (limit: number = 10): Promise<VersionResponse[]> => {
  const platform = Constants.platform?.ios ? 'ios' : 'android';
  
  try {
    const response = await apiClient.get(`/api/app/versions?platform=${platform}&limit=${limit}`);
    
    return response.data.versions || [];
  } catch (error) {
    console.log('Failed to fetch version history:', error);
    return [];
  }
};

// Helper function for version comparison
function compareVersions(v1: string, v2: string): number {
  const normalize = (v: string) => {
    // Remove any non-numeric characters and split by dots
    const clean = v.replace(/[^\d.]/g, '');
    return clean.split('.').map(Number).filter(n => !isNaN(n));
  };
  
  const a = normalize(v1);
  const b = normalize(v2);
  
  const maxLength = Math.max(a.length, b.length);
  
  for (let i = 0; i < maxLength; i++) {
    const aVal = a[i] || 0;
    const bVal = b[i] || 0;
    
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  
  return 0;
}

// Export enhanced version info
export const VERSION_INFO = getVersionInfo();