import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, shadows, spacing } from '../styles/theme';
import { Receipt } from '../types';
import { SleekReceiptCard } from './SleekReceiptCard';

interface RecentReceiptsProps {
  receipts?: Receipt[];
  isLoading: boolean;
  onUpdateReceipt?: (updatedReceipt: Receipt) => void;
  onDeleteReceipt?: (receiptId: string) => void;
  onEditReceipt?: (receipt: Receipt) => void;
  onPreviewReceipt?: (receipt: Receipt) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMoreReceipts?: boolean;
  refreshControl?: React.ReactElement<any>;
  searchQuery?: string;
  searchResultsCount?: number;
}

export default function RecentReceipts({ 
  receipts = [], 
  isLoading,
  onUpdateReceipt,
  onDeleteReceipt,
  onEditReceipt,
  onPreviewReceipt,
  onLoadMore,
  isLoadingMore = false,
  hasMoreReceipts = true,
  refreshControl,
  searchQuery,
  searchResultsCount
}: RecentReceiptsProps) {
  const [localReceipts, setLocalReceipts] = useState<Receipt[]>(receipts);

  // Update local state when receipts prop changes
  React.useEffect(() => {
    // Deduplicate receipts by ID to ensure unique keys
    const uniqueReceipts = receipts.filter((receipt, index, self) => 
      index === self.findIndex(r => r.id === receipt.id)
    );
    setLocalReceipts(uniqueReceipts);
  }, [receipts]);

  // Handle receipt updates
  const handleUpdateReceipt = (updatedReceipt: Receipt) => {
    setLocalReceipts(prev => {
      const updated = prev.map(receipt => 
        receipt.id === updatedReceipt.id ? updatedReceipt : receipt
      );
      // Ensure no duplicates after update
      return updated.filter((receipt, index, self) => 
        index === self.findIndex(r => r.id === receipt.id)
      );
    });
    onUpdateReceipt?.(updatedReceipt);
  };

  // Handle receipt deletion
  const handleDeleteReceipt = (receiptId: string) => {
    setLocalReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
    onDeleteReceipt?.(receiptId);
  };

  // Handle edit action - this will trigger inline editing in the ReceiptCard
  const handleEditReceipt = (receipt: Receipt) => {
    // The SwipeableReceiptCard handles this internally via the ReceiptCard
    // But we can still notify parent component if needed
    onEditReceipt?.(receipt);
  };

  // Handle preview action
  const handlePreviewReceipt = (receipt: Receipt) => {
    onPreviewReceipt?.(receipt);
  };

  // Handle infinite scroll
  const handleEndReached = () => {
    if (!isLoadingMore && hasMoreReceipts && onLoadMore) {
      onLoadMore();
    }
  };

  // Render receipt card
  const renderReceiptCard = ({ item }: { item: Receipt }) => (
    <SleekReceiptCard
      receipt={item}
      onDelete={handleDeleteReceipt}
      onEdit={handleEditReceipt}
      onPreview={handlePreviewReceipt}
    />
  );

  // Render search results header
  const renderSearchHeader = () => {
    if (!searchQuery || searchQuery.length === 0) return null;
    
    return (
      <View style={styles.searchResults}>
        <Text style={styles.searchResultsText}>
          {searchResultsCount || 0} result{(searchResultsCount || 0) !== 1 ? 's' : ''} for "{searchQuery}"
        </Text>
      </View>
    );
  };

  // Render scroll boundary footer
  const renderFooter = () => {
    // Show loading state
    if (isLoadingMore) {
      return (
        <View style={styles.scrollFooter}>
          <Text style={styles.footerNavText}>📄 View All Receipts</Text>
          <View style={styles.footerStatus}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.footerStatusText}>Loading...</Text>
          </View>
        </View>
      );
    }

    // Show end state or scroll hint
    if (localReceipts.length === 0) {
      return (
        <View style={styles.scrollFooter}>
          <Text style={styles.footerNavText}>📄 Capture your first receipt above</Text>
        </View>
      );
    }

    return (
      <View style={styles.scrollFooter}>
        <Text style={styles.footerNavText}>📄 View All Receipts</Text>
        <Text style={styles.footerStatusText}>
          {hasMoreReceipts ? 'Swipe up for more' : 'That\'s everything!'}
        </Text>
      </View>
    );
  };

  if (isLoading && localReceipts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Receipts</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      </View>
    );
  }

  if (localReceipts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Receipts</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No receipts yet</Text>
          <Text style={styles.emptySubtext}>Start by capturing your first receipt!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Receipts</Text>
      </View>
      
      <FlatList
        data={localReceipts}
        renderItem={renderReceiptCard}
        keyExtractor={(item) => item.id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderSearchHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        style={styles.flatListStyle}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={5}
        getItemLayout={undefined}
        refreshControl={refreshControl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center'
  },
  emptyText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: spacing.sm // Reduced since footer provides visual boundary
  },
  flatListStyle: {
    flex: 1
  },
  footerNavText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600'
  },
  footerStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  footerStatusText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic'
  },
  header: {
    marginBottom: spacing.md
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm
  },
  scrollFooter: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg
  },
  searchResults: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  searchResultsText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic'
  },
  title: {
    ...typography.title3,
    color: colors.textPrimary,
    fontWeight: '600',
    // Platform-specific left margin to match card margins
    marginLeft: Platform.select({
      ios: 20,     // Match iOS card margin
      android: 16 // Match Android card margin
    })
  }
});