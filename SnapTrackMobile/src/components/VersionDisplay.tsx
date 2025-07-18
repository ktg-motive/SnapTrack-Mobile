import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVersionWithServer, getReleaseNotes, checkForUpdates, type VersionResponse, type ReleaseNotesResponse } from '../utils/version';
import { ReleaseNotesModal } from './ReleaseNotesModal';

interface VersionDisplayProps {
  showUpdateIndicator?: boolean;
  onReleaseNotesPress?: (notes: ReleaseNotesResponse) => void;
  showCompactView?: boolean;
  showUpdateCheck?: boolean;
  style?: any;
}

export const VersionDisplay: React.FC<VersionDisplayProps> = ({ 
  showUpdateIndicator = true, 
  onReleaseNotesPress,
  showCompactView = false,
  showUpdateCheck = false,
  style
}) => {
  const [versionInfo, setVersionInfo] = useState<VersionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [releaseNotesVisible, setReleaseNotesVisible] = useState(false);
  const [currentReleaseNotes, setCurrentReleaseNotes] = useState<ReleaseNotesResponse | null>(null);

  useEffect(() => {
    loadVersionInfo();
  }, []);

  const loadVersionInfo = async () => {
    try {
      setLoading(true);
      const info = await getVersionWithServer();
      setVersionInfo(info);
    } catch (error) {
      console.log('Failed to load version info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCheck = async () => {
    if (checkingUpdate) return;
    
    try {
      setCheckingUpdate(true);
      const updateInfo = await checkForUpdates();
      
      if (updateInfo.updateAvailable) {
        Alert.alert(
          'Update Available',
          `A new version (${updateInfo.currentVersion}) is available. Your version: ${updateInfo.clientVersion}`,
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Update', 
              onPress: () => {
                // Open App Store for iOS or Play Store for Android
                const storeUrl = versionInfo?.platform === 'ios' 
                  ? `https://apps.apple.com/app/snaptrack/id${process.env.EXPO_PUBLIC_IOS_APP_ID || 'your-app-id'}`
                  : `https://play.google.com/store/apps/details?id=${process.env.EXPO_PUBLIC_ANDROID_PACKAGE_NAME || 'com.snaptrack.mobile'}`;
                
                Linking.openURL(storeUrl);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Up to Date',
          'You have the latest version of SnapTrack.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      Alert.alert('Update Check Failed', 'Unable to check for updates at this time.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleReleaseNotesPress = async () => {
    // If we don't have a release notes URL (fallback mode), show mock release notes
    if (!versionInfo?.releaseNotesUrl) {
      const mockReleaseNotes = {
        version: versionInfo?.version || '1.0.0',
        releaseDate: '2025-01-17',
        releaseType: 'minor' as const,
        platform: versionInfo?.platform || 'ios',
        highlights: [
          'Version display and release notes system',
          'Improved hamburger menu user experience',
          'Enhanced App Store compliance'
        ],
        content: `## What's New in Version ${versionInfo?.version || '1.0.0'}

### ✨ New Features
- **Version Management**: Added version display with update notifications
- **Release Notes**: Professional release notes viewing experience
- **Menu Improvements**: Cleaner hamburger menu with better organization
- **Promo Codes**: Support for special offers during signup

### 🐛 Bug Fixes
- Fixed App Store compliance issues for signup flow
- Resolved navigation problems between screens
- Improved error handling for offline scenarios
- Fixed help screen layout issues

### 🔧 Improvements
- Streamlined user interface elements
- Better accessibility support
- Performance optimizations
- Platform-specific UI improvements`
      };
      
      if (onReleaseNotesPress) {
        onReleaseNotesPress(mockReleaseNotes);
      } else {
        setCurrentReleaseNotes(mockReleaseNotes);
        setReleaseNotesVisible(true);
      }
      return;
    }
    
    try {
      const releaseNotes = await getReleaseNotes(versionInfo.releaseNotesUrl);
      if (releaseNotes && onReleaseNotesPress) {
        onReleaseNotesPress(releaseNotes);
      } else if (releaseNotes) {
        // Show the release notes modal
        setCurrentReleaseNotes(releaseNotes);
        setReleaseNotesVisible(true);
      }
    } catch (error) {
      Alert.alert('Release Notes', 'Unable to load release notes at this time.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={styles.loadingText}>Loading version info...</Text>
        </View>
      </View>
    );
  }

  if (showCompactView) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Text style={styles.compactVersionText}>
          v{versionInfo?.version} ({versionInfo?.buildNumber})
        </Text>
        {showUpdateIndicator && !versionInfo?.isLatest && (
          <View style={styles.updateDot} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.versionRow}>
        <Text style={styles.versionText}>
          SnapTrack {versionInfo?.version} ({versionInfo?.buildNumber})
        </Text>
        
        {showUpdateIndicator && !versionInfo?.isLatest && (
          <View style={styles.updateBadge}>
            <Ionicons name="arrow-up-circle" size={16} color="#FF6B35" />
            <Text style={styles.updateText}>Update Available</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionRow}>
        {(versionInfo?.hasReleaseNotes || versionInfo?.fallback) && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleReleaseNotesPress}
          >
            <Text style={styles.actionButtonText}>What's New</Text>
            <Ionicons name="chevron-forward" size={14} color="#007AFF" />
          </TouchableOpacity>
        )}
        
        {showUpdateCheck && (
          <TouchableOpacity 
            style={[styles.actionButton, versionInfo?.hasReleaseNotes ? { marginLeft: 16 } : {}]}
            onPress={handleUpdateCheck}
            disabled={checkingUpdate}
          >
            {checkingUpdate ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <>
                <Text style={styles.actionButtonText}>Check for Updates</Text>
                <Ionicons name="refresh" size={14} color="#007AFF" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {versionInfo?.fallback && (
        <Text style={styles.fallbackText}>
          • Using local version information
        </Text>
      )}
      
      <ReleaseNotesModal
        visible={releaseNotesVisible}
        onClose={() => setReleaseNotesVisible(false)}
        releaseNotes={currentReleaseNotes}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Menlo',
    textAlign: 'center',
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4DE',
  },
  updateText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  fallbackText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactVersionText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Menlo',
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginLeft: 8,
  },
});

export default VersionDisplay;