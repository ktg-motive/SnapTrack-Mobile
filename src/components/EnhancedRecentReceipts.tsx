import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, shadows, spacing } from '../styles/theme';
import { Receipt } from '../types';
import { PremiumReceiptCard } from './PremiumReceiptCard';
import { StaggeredList } from './AnimatedListItem';
import { hapticFeedback } from '../utils/hapticFeedback';

interface EnhancedRecentReceiptsProps {
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
  useAnimations?: boolean;
}

/**
 * EnhancedRecentReceipts - Example implementation showing the new design components
 * 
 * Features:
 * - Premium receipt cards with entity color indicators
 * - Staggered entrance animations
 * - Haptic feedback for interactions
 * - Professional shadows and styling
 * - Spring animations on press
 */
export const EnhancedRecentReceipts: React.FC<EnhancedRecentReceiptsProps> = ({ 
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
  useAnimations = true
}: EnhancedRecentReceiptsProps) => {
  const [localReceipts, setLocalReceipts] = useState<Receipt[]>(receipts);

  // Update local state when receipts prop changes
  React.useEffect(() => {
    setLocalReceipts(receipts);
  }, [receipts]);

  const handleReceiptPress = async (receipt: Receipt) => {
    await hapticFeedback.cardTap();
    onPreviewReceipt?.(receipt);
  };

  const handleEditReceipt = async (receipt: Receipt) => {
    await hapticFeedback.editMode();
    onEditReceipt?.(receipt);
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    await hapticFeedback.deleteAction();
    
    // Update local state optimistically
    setLocalReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
    
    try {
      await onDeleteReceipt?.(receiptId);
      await hapticFeedback.success();
    } catch (error) {
      // Revert optimistic update on error
      setLocalReceipts(receipts);
      await hapticFeedback.error();
      throw error;
    }
  };

  const handleUpdateReceipt = async (updatedReceipt: Receipt) => {
    setLocalReceipts(prev => 
      prev.map(receipt => 
        receipt.id === updatedReceipt.id ? updatedReceipt : receipt
      )
    );
    onUpdateReceipt?.(updatedReceipt);
    await hapticFeedback.saveAction();
  };

  const handleLoadMore = async () => {
    if (!isLoadingMore && hasMoreReceipts) {
      await hapticFeedback.light();
      onLoadMore?.();
    }
  };

  if (isLoading && localReceipts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your receipts...</Text>
      </View>
    );
  }

  if (!isLoading && localReceipts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons 
            name="receipt-outline" 
            size={64} 
            color={colors.textMuted} 
          />
        </View>
        <Text style={styles.emptyTitle}>No receipts yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the camera button to capture your first receipt
        </Text>
      </View>
    );
  }

  const renderReceiptItem = ({ item, index }: { item: Receipt; index: number }) => (
    <PremiumReceiptCard
      receipt={item}
      onPress={handleReceiptPress}
      onEdit={handleEditReceipt}
      onDelete={handleDeleteReceipt}
      onPreview={handleReceiptPress}
    />
  );

  const renderReceiptWithAnimation = ({ item, index }: { item: Receipt; index: number }) => {
    if (useAnimations) {
      return (
        <PremiumReceiptCard
          receipt={item}
          onPress={handleReceiptPress}
          onEdit={handleEditReceipt}
          onDelete={handleDeleteReceipt}
          onPreview={handleReceiptPress}
        />
      );
    }
    return renderReceiptItem({ item, index });
  };

  // For animations, use a different rendering approach
  if (useAnimations && localReceipts.length <= 10) {
    return (
      <View style={styles.container}>
        <StaggeredList 
          staggerDelay={75}
          initialDelay={100}
          useSlideIn={true}
          useFadeIn={true}
          useScaleIn={false}
        >
          {localReceipts.map((receipt) => (
            <PremiumReceiptCard
              key={receipt.id}
              receipt={receipt}
              onPress={handleReceiptPress}
              onEdit={handleEditReceipt}
              onDelete={handleDeleteReceipt}
              onPreview={handleReceiptPress}
            />
          ))}
        </StaggeredList>
        
        {/* Load More Button */}
        {hasMoreReceipts && (
          <View style={styles.loadMoreContainer}>
            {isLoadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.loadMoreText} onPress={handleLoadMore}>
                Load More Receipts
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  // For longer lists, use FlatList for performance
  return (
    <View style={styles.container}>
      <FlatList
        data={localReceipts}
        renderItem={renderReceiptWithAnimation}
        keyExtractor={(item) => item.id}
        refreshControl={refreshControl}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...shadows.card,
  },
  emptyTitle: {
    ...typography.title2,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});