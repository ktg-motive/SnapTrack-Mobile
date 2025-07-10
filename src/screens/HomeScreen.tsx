import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  ScrollView,
  RefreshControl,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography, shadows, spacing } from '../styles/theme';
import SnapTrackLogo from '../components/SnapTrackLogo';
import WelcomeMessage from '../components/WelcomeMessage';
import QuickStats from '../components/QuickStats';
import RecentReceipts from '../components/RecentReceipts';
import { apiClient, ApiError } from '../services/apiClient';
import { authService } from '../services/authService';
import { QuickStats as QuickStatsType, Receipt } from '../types';
import NetInfo from '@react-native-community/netinfo';
import { offlineStorage } from '../services/offlineStorage';
import { ReceiptEditModal } from '../components/ReceiptEditModal';
import { ReceiptPreviewModal } from '../components/ReceiptPreviewModal';
import { HomeScreenFooter, ReceiptsState } from '../components/HomeScreenFooter';
import HamburgerMenu from '../components/HamburgerMenu';

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [quickStats, setQuickStats] = useState<QuickStatsType | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [allReceipts, setAllReceipts] = useState<Receipt[]>([]); // For cycling stats calculations
  const [userName, setUserName] = useState('User');
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [queuedUploads, setQueuedUploads] = useState(0);
  
  // Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [hamburgerMenuVisible, setHamburgerMenuVisible] = useState(false);

  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreReceipts, setHasMoreReceipts] = useState(true);

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

  const loadDashboardData = async (resetData = true) => {
    try {
      // Load data in parallel - get more receipts for stats calculations
      const [statsPromise, receiptsPromise, allReceiptsPromise] = await Promise.allSettled([
        apiClient.getQuickStats(),
        apiClient.getReceipts({ limit: 3, page: 1 }), // Always use page 1 for recent receipts display
        apiClient.getReceipts({ limit: 1000, page: 1 }) // All receipts for cycling stats calculation
      ]);

      if (statsPromise.status === 'fulfilled') {
        setQuickStats(statsPromise.value);
      } else {
        console.error('❌ Failed to load stats:', statsPromise.reason);
      }

      if (receiptsPromise.status === 'fulfilled') {
        const fullResponse = receiptsPromise.value;
        const receiptsData = fullResponse.data || [];
        const totalPages = fullResponse.pages || 1;
        const currentPageNum = fullResponse.page || 1;
        
        console.log('📝 Full receipts response:', JSON.stringify(fullResponse, null, 2));
        console.log('📝 Loaded receipts:', receiptsData.length, 'receipts');
        console.log('📝 Page:', currentPageNum, 'of', totalPages);
        
        // Always reset recent receipts since we're always fetching page 1
        // Deduplicate receipts by ID as extra safety measure
        const uniqueReceipts = receiptsData.filter((receipt, index, self) => 
          index === self.findIndex(r => r.id === receipt.id)
        );
        setRecentReceipts(uniqueReceipts);
        setCurrentPage(1);
        
        setHasMoreReceipts(currentPageNum < totalPages);
      } else {
        console.error('❌ Failed to load recent receipts:', receiptsPromise.reason);
        setRecentReceipts([]); // Set empty array as fallback
      }

      // Handle all receipts for stats
      if (allReceiptsPromise.status === 'fulfilled') {
        const allReceiptsData = allReceiptsPromise.value.data || [];
        console.log('📊 Loaded all receipts for stats:', allReceiptsData.length);
        setAllReceipts(allReceiptsData);
      } else {
        console.error('❌ Failed to load all receipts for stats:', allReceiptsPromise.reason);
        setAllReceipts([]);
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1); // Reset pagination state before loading
    await loadDashboardData(true); // Reset data on refresh
    setRefreshing(false);
  };

  // Handle infinite scroll load more
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreReceipts) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    try {
      const receiptsResponse = await apiClient.getReceipts({ limit: 3, page: nextPage });
      const receiptsData = receiptsResponse.data || [];
      const totalPages = receiptsResponse.pages || 1;
      const currentPageNum = receiptsResponse.page || nextPage;
      
      console.log('📝 Loaded more receipts:', receiptsData.length, 'receipts');
      console.log('📝 Page:', currentPageNum, 'of', totalPages);
      
      // Deduplicate receipts by ID to prevent duplicate keys
      setRecentReceipts(prev => {
        const existingIds = new Set(prev.map(receipt => receipt.id));
        const newReceipts = receiptsData.filter(receipt => !existingIds.has(receipt.id));
        return [...prev, ...newReceipts];
      });
      setHasMoreReceipts(currentPageNum < totalPages);
    } catch (error) {
      console.error('❌ Failed to load more receipts:', error);
      // Reset page on error
      setCurrentPage(currentPage);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCapturePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CaptureTab' as never);
  };


  // Determine the footer state based on current app state
  const getReceiptsState = (): ReceiptsState => {
    if (recentReceipts.length === 0) {
      return ReceiptsState.empty;
    }
    
    if (isLoadingMore) {
      return ReceiptsState.loading;
    }
    
    if (hasMoreReceipts) {
      return ReceiptsState.hasMore;
    }
    
    return ReceiptsState.endOfList;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Logo and Hamburger Menu */}
      <View style={[styles.header, { 
        paddingTop: Platform.OS === 'android' 
          ? Math.max(insets.top, 24) // Add extra space for Android camera notch
          : 8 
      }]}>
        <TouchableOpacity 
          style={styles.hamburgerButton}
          onPress={() => setHamburgerMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <SnapTrackLogo width={180} height={60} />
        <View style={styles.headerSpacer} />
      </View>

      {/* Offline/Sync Status Indicator - Fixed */}
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
                  <Text style={styles.queueNumber}>{queuedUploads}</Text> receipt{queuedUploads !== 1 ? 's' : ''} queued
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Quick Stats - Fixed */}
      <QuickStats 
        stats={quickStats}
        isLoading={isLoading}
        receipts={allReceipts}
      />

      {/* Main Capture Button - Fixed */}
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

      {/* Scrollable Receipts Section */}
      <View style={styles.receiptsContainer}>
        <RecentReceipts 
          receipts={recentReceipts}
          isLoading={isLoading}
          onUpdateReceipt={(updatedReceipt) => {
            setRecentReceipts(prev => 
              prev.map(receipt => 
                receipt.id === updatedReceipt.id ? updatedReceipt : receipt
              )
            );
          }}
          onDeleteReceipt={async (receiptId) => {
            try {
              await apiClient.deleteReceipt(receiptId);
              setRecentReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
            } catch (error) {
              console.error('Failed to delete receipt:', error);
              throw error;
            }
          }}
          onEditReceipt={(receipt) => {
            console.log('Edit receipt:', receipt.id);
            setSelectedReceipt(receipt);
            setEditModalVisible(true);
          }}
          onPreviewReceipt={(receipt) => {
            console.log('Preview receipt:', receipt.id, receipt);
            if (receipt && receipt.id) {
              setSelectedReceipt(receipt);
              // Use setTimeout to ensure state is set before opening modal
              setTimeout(() => {
                setPreviewModalVisible(true);
              }, 100);
            } else {
              console.error('Invalid receipt for preview:', receipt);
            }
          }}
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
          hasMoreReceipts={hasMoreReceipts}
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
        />
      </View>

      {/* Fixed Footer */}
      <HomeScreenFooter
        receiptsState={getReceiptsState()}
        receiptCount={recentReceipts.length}
        onViewAllTapped={() => navigation.navigate('Receipts' as never)}
        onEmptyStateTapped={() => {
          // In a real implementation, we'd scroll to the capture button
          // For now, provide haptic feedback to acknowledge the interaction
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      />

      {/* Modals */}
      <ReceiptEditModal
        receipt={selectedReceipt}
        isVisible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedReceipt(null);
        }}
        onSave={async (receiptId, updates) => {
          try {
            const updatedReceipt = await apiClient.updateReceipt(receiptId, updates);
            setRecentReceipts(prev => 
              prev.map(receipt => 
                receipt.id === receiptId ? updatedReceipt : receipt
              )
            );
          } catch (error) {
            console.error('Failed to update receipt:', error);
            throw error;
          }
        }}
        onDelete={async (receiptId) => {
          try {
            await apiClient.deleteReceipt(receiptId);
            setRecentReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
          } catch (error) {
            console.error('Failed to delete receipt:', error);
            throw error;
          }
        }}
      />

      <ReceiptPreviewModal
        receipt={selectedReceipt}
        isVisible={previewModalVisible}
        onClose={() => {
          setPreviewModalVisible(false);
          // Clear selected receipt after a brief delay to prevent race conditions
          setTimeout(() => {
            setSelectedReceipt(null);
          }, 300);
        }}
      />

      {/* Hamburger Menu */}
      <HamburgerMenu
        isVisible={hamburgerMenuVisible}
        onClose={() => setHamburgerMenuVisible(false)}
        navigation={navigation}
        userStats={quickStats ? {
          totalReceipts: quickStats.receipt_count,
          totalAmount: quickStats.total_amount,
          currentMonthReceipts: quickStats.monthly_count,
        } : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  receiptsContainer: {
    flex: 1, // Takes remaining space between fixed elements
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8, // Reduced from 12 to 8
  },
  hamburgerButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },
  headerSpacer: {
    width: 40, // Same width as hamburger button to center logo
  },
  captureSection: {
    paddingHorizontal: 16, // Slightly reduced for more width
    marginTop: 8, // Reduced from 24 to 8 for tighter spacing with stats
    marginBottom: 16, // Reduced for tighter overall layout
  },
  captureContainer: {
    // Remove margin since it's now in captureSection
  },
  captureButton: {
    height: 140, // Even taller - increased from 120 to 140 for more prominence
    borderRadius: 24, // Larger radius for premium feel
    flexDirection: 'column', // Stack icon and text vertically
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
    // Enhanced shadow for maximum prominence
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    // Add subtle border for definition
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  captureText: {
    ...typography.title2, // Larger text - upgraded from title3 to title2
    color: 'white',
    marginTop: 8, // Space from icon above
    fontWeight: '700',
  },
  statusIndicator: {
    marginHorizontal: 20,
    marginVertical: 4, // Reduced from 8 to 4
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 10, // Reduced from 12 to 10
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
  queueNumber: {
    ...typography.number,
    fontSize: 12,
    color: colors.textSecondary,
  },
});