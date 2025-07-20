import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors, typography, spacing } from '../styles/theme';
import RecentReceipts from '../components/RecentReceipts';
import { apiClient, ApiError } from '../services/apiClient';
import { authService } from '../services/authService.compat';
import { Receipt } from '../types';
import NetInfo from '@react-native-community/netinfo';
import { offlineStorage } from '../services/offlineStorage';
import { ReceiptEditModal } from '../components/ReceiptEditModal';
import { ReceiptPreviewModal } from '../components/ReceiptPreviewModal';

export default function ReceiptsScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [totalReceiptCount, setTotalReceiptCount] = useState(0); // Track total count from API
  
  // Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreReceipts, setHasMoreReceipts] = useState(true);

  useEffect(() => {
    checkNetworkStatus();
    loadReceipts();
  }, []);

  useEffect(() => {
    // Filter receipts based on search query
    if (searchQuery.trim() === '') {
      setFilteredReceipts(receipts);
    } else {
      const filtered = receipts.filter(receipt => 
        receipt.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.amount?.toString().includes(searchQuery)
      );
      setFilteredReceipts(filtered);
    }
  }, [searchQuery, receipts]);

  const checkNetworkStatus = () => {
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });

    return unsubscribe;
  };

  const loadReceipts = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const user = authService.getCurrentUser();
      if (!user) {
        navigation.navigate('Auth' as never);
        return;
      }

      if (!isConnected) {
        // Load from offline storage
        const offlineReceipts = await offlineStorage.getReceipts();
        setReceipts(offlineReceipts);
        setFilteredReceipts(offlineReceipts);
        setTotalReceiptCount(offlineReceipts.length); // Set total count for offline mode
        setIsLoading(false);
        return;
      }

      const response = await apiClient.getReceipts({ page, limit: 20 });
      const newReceipts = response.data || [];
      const totalPages = response.pages || 1;
      const currentPageNum = response.page || 1;
      const totalCount = response.total || response.pagination?.total_count || newReceipts.length;
      
      console.log('📝 Full receipts response:', JSON.stringify(response, null, 2));
      console.log(`📝 Loaded ${newReceipts.length} receipts`);
      console.log(`📝 Page: ${currentPageNum} of ${totalPages}`);
      console.log(`📝 Total count: ${totalCount}`);
      
      // Update total count from API response
      setTotalReceiptCount(totalCount);
      
      if (append) {
        setReceipts(prev => [...prev, ...newReceipts]);
      } else {
        setReceipts(newReceipts);
      }
      
      setHasMoreReceipts(currentPageNum < totalPages);

    } catch (error) {
      console.error('Failed to load receipts:', error);
      
      if (error instanceof ApiError && error.status === 401) {
        navigation.navigate('Auth' as never);
        return;
      }
      
      // Try to load from offline storage as fallback
      if (!isConnected) {
        const offlineReceipts = await offlineStorage.getReceipts();
        setReceipts(offlineReceipts);
        setFilteredReceipts(offlineReceipts);
        setTotalReceiptCount(offlineReceipts.length); // Set total count for offline fallback
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMoreReceipts = () => {
    if (!isLoadingMore && hasMoreReceipts) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadReceipts(nextPage, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreReceipts(true);
    loadReceipts(1, false);
  };

  const handleReceiptEdit = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setEditModalVisible(true);
  };

  const handleReceiptPreview = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setPreviewModalVisible(true);
  };


  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.innerContainer}>
          {/* Fixed Header with keyboard dismiss */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Receipts</Text>
                <Text style={styles.headerSubtitle}>
                  {searchQuery ? filteredReceipts.length : totalReceiptCount} receipt{(searchQuery ? filteredReceipts.length : totalReceiptCount) !== 1 ? 's' : ''} {searchQuery ? 'found' : 'tracked'}
                </Text>
              </View>

              {/* Fixed Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search receipts..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="search"
                    blurOnSubmit={true}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Fixed Connection Status */}
              {!isConnected && (
                <View style={styles.offlineBar}>
                  <Ionicons name="cloud-offline" size={16} color={colors.warning} />
                  <Text style={styles.offlineText}>Offline - showing cached receipts</Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>

          {/* Scrollable Content - Single FlatList */}
          <RecentReceipts
            receipts={filteredReceipts}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            onEditReceipt={handleReceiptEdit}
            onPreviewReceipt={handleReceiptPreview}
            onDeleteReceipt={async (receiptId) => {
              try {
                await apiClient.deleteReceipt(receiptId);
                setReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
              } catch (error) {
                console.error('Failed to delete receipt:', error);
                throw error;
              }
            }}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            onLoadMore={loadMoreReceipts}
            searchQuery={searchQuery}
            searchResultsCount={filteredReceipts.length}
          />
        </View>
      </SafeAreaView>

      {/* Edit Modal */}
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
            setReceipts(prev => 
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
            setReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
          } catch (error) {
            console.error('Failed to delete receipt:', error);
            throw error;
          }
        }}
      />

      {/* Preview Modal */}
      <ReceiptPreviewModal
        receipt={selectedReceipt}
        isVisible={previewModalVisible}
        onClose={() => {
          setPreviewModalVisible(false);
          setSelectedReceipt(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    padding: spacing.xs
  },
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  innerContainer: {
    flex: 1
  },
  content: {
    flex: 1
  },
  header: {
    backgroundColor: colors.background,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary
  },
  headerTitle: {
    ...typography.title1,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: spacing.xs
  },
  offlineBar: {
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  offlineText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '500',
    marginLeft: spacing.xs
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  searchContainer: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg
  },
  searchIcon: {
    marginRight: spacing.sm
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary
  },
  searchResults: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  searchResultsText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic'
  }
});