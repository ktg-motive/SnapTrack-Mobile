import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { colors, typography, shadows, spacing } from '../styles/theme';
import SnapTrackLogo from '../components/SnapTrackLogo';
import WelcomeMessage from '../components/WelcomeMessage';
import QuickStats from '../components/QuickStats';
import RecentReceipts from '../components/RecentReceipts';
import UserAvatar from '../components/UserAvatar';
import { apiClient, ApiError } from '../services/apiClient';
import { authService } from '../services/authService';
import { QuickStats as QuickStatsType, Receipt } from '../types';
import NetInfo from '@react-native-community/netinfo';
import { offlineStorage } from '../services/offlineStorage';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [quickStats, setQuickStats] = useState<QuickStatsType | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [userName, setUserName] = useState('User');
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [queuedUploads, setQueuedUploads] = useState(0);

  useEffect(() => {
    initializeData();
    setupNetworkListener();
  }, []);

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected || false;
      setIsConnected(connected);
      
      if (connected) {
        console.log('📡 Network reconnected, processing offline queue');
        // Process queued uploads when reconnected
        offlineStorage.processQueue(apiClient).then((result) => {
          if (result.success > 0) {
            console.log(`✅ Successfully uploaded ${result.success} offline receipts`);
            // Refresh data after successful uploads
            loadDashboardData();
          }
        });
      }
      
      // Update queued uploads count
      updateQueuedUploadsCount();
    });

    return unsubscribe;
  };

  const updateQueuedUploadsCount = async () => {
    try {
      const count = await offlineStorage.getPendingUploadsCount();
      setQueuedUploads(count);
    } catch (error) {
      console.error('❌ Failed to get queued uploads count:', error);
    }
  };

  const initializeData = async () => {
    try {
      setIsLoading(true);
      
      // Initialize auth first
      const user = await authService.initializeAuth();
      if (user) {
        setUserName(user.displayName || user.email?.split('@')[0] || 'User');
        await loadDashboardData();
        await updateQueuedUploadsCount();
      } else {
        // User not authenticated, show auth screen
        navigation.navigate('Auth' as never);
        return;
      }
    } catch (error) {
      console.error('❌ Failed to initialize home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load data in parallel
      const [statsPromise, receiptsPromise] = await Promise.allSettled([
        apiClient.getQuickStats(),
        apiClient.getReceipts({ limit: 5 }) // Get 5 most recent receipts
      ]);

      if (statsPromise.status === 'fulfilled') {
        setQuickStats(statsPromise.value);
      } else {
        console.error('❌ Failed to load stats:', statsPromise.reason);
      }

      if (receiptsPromise.status === 'fulfilled') {
        const fullResponse = receiptsPromise.value;
        const receiptsData = fullResponse.data || [];
        console.log('📝 Full receipts response:', JSON.stringify(fullResponse, null, 2));
        console.log('📝 Loaded receipts:', receiptsData.length, 'receipts');
        setRecentReceipts(receiptsData);
      } else {
        console.error('❌ Failed to load recent receipts:', receiptsPromise.reason);
        setRecentReceipts([]); // Set empty array as fallback
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCapturePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Camera' as never);
  };

  const handleProfilePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // For now, show user info and sign out option
    const currentUser = authService.getCurrentUser();
    
    if (currentUser) {
      // Show user profile alert with options
      Alert.alert(
        'User Profile',
        `Signed in as: ${currentUser.displayName || currentUser.email}`,
        [
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await authService.signOut();
                navigation.navigate('Auth' as never);
              } catch (error) {
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } else {
      navigation.navigate('Auth' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <SnapTrackLogo width={180} height={60} />
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings' as never)}>
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <UserAvatar name={userName} size={32} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="Pull to refresh"
            titleColor={colors.textSecondary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Offline/Sync Status Indicator */}
        {(!isConnected || queuedUploads > 0) && (
          <View style={styles.statusIndicator}>
            <View style={styles.statusContent}>
              {!isConnected ? (
                <>
                  <Ionicons name="wifi-outline" size={16} color={colors.warning} />
                  <Text style={styles.statusText}>Offline Mode</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sync-outline" size={16} color={colors.primary} />
                  <Text style={styles.statusTextConnected}>Online</Text>
                </>
              )}
              
              {queuedUploads > 0 && (
                <View style={styles.queueIndicator}>
                  <Text style={styles.queueText}>
                    {queuedUploads} receipt{queuedUploads !== 1 ? 's' : ''} queued
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Main Capture Button - Moved to top */}
        <View style={styles.captureSection}>
          <TouchableOpacity 
            style={styles.captureContainer}
            onPress={handleCapturePress}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.captureButton}
            >
              <Ionicons name="camera" size={48} color="white" />
              <Text style={styles.captureText}>Capture Receipt</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Receipts - Moved to middle */}
        <RecentReceipts 
          receipts={recentReceipts}
          isLoading={isLoading}
        />

        {/* Quick Stats - Moved directly under receipts */}
        <QuickStats 
          stats={quickStats}
          isLoading={isLoading}
        />

        {/* Welcome Message - Moved to bottom */}
        <WelcomeMessage userName={userName} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12, // Reduced from 20 to 12
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
    marginRight: spacing.sm,
  },
  profileButton: {
    padding: 8,
  },
  captureSection: {
    paddingHorizontal: 20, // Add horizontal padding to create margins from edges
    marginTop: 16, // Reduced top margin to eliminate excessive whitespace
    marginBottom: 24, // Moderate bottom margin for separation
  },
  captureContainer: {
    // Remove margin since it's now in captureSection
  },
  captureButton: {
    height: 120, // Much taller - increased from 64 to 120
    borderRadius: 20, // Slightly larger radius for the bigger button
    flexDirection: 'column', // Stack icon and text vertically
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
    // Add extra shadow for prominence
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  captureText: {
    ...typography.title2, // Larger text - upgraded from title3 to title2
    color: 'white',
    marginTop: 8, // Space from icon above
    fontWeight: '700',
  },
  statusIndicator: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    ...shadows.card,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: 8,
    fontWeight: '600',
  },
  statusTextConnected: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  queueIndicator: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  queueText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});