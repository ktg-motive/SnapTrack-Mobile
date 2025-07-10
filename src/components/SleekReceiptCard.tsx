import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Receipt } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { hapticFeedback } from '../utils/hapticFeedback';

interface SleekReceiptCardProps {
  receipt: Receipt;
  onEdit?: (receipt: Receipt) => void;
  onPreview?: (receipt: Receipt) => void;
  onDelete?: (receiptId: string) => void;
}

// UPDATED: Use consistent Trust Teal for ALL entities for better scalability
const getEntityColor = () => {
  // Use single color for ALL entities as per design recommendations
  return {
    primary: colors.primary, // Trust Teal (#009f86) for ALL entities
    background: colors.primaryContainer,
    border: `${colors.primary}33`,
  };
};


export const SleekReceiptCard: React.FC<SleekReceiptCardProps> = ({
  receipt,
  onEdit,
  onPreview,
  onDelete,
}) => {
  const handleEdit = async () => {
    await hapticFeedback.editMode();
    onEdit?.(receipt);
  };

  const handlePreview = async () => {
    await hapticFeedback.cardTap();
    onPreview?.(receipt);
  };

  const handleDelete = async () => {
    await hapticFeedback.deleteAction();
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete?.(receipt.id)
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      // Fix timezone handling - parse date string properly
      const date = new Date(dateString);
      // Use UTC methods to avoid timezone offset issues
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const entityColor = getEntityColor(); // Use consistent Trust Teal for all entities

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Entity Color Indicator - NEW */}
        <View 
          style={[
            styles.entityIndicator,
            { backgroundColor: entityColor.primary }
          ]} 
        />
        
        <View style={styles.content}>
          {/* Header: Vendor + Amount */}
          <View style={styles.headerRow}>
            <Text style={styles.vendor} numberOfLines={1}>
              {receipt.vendor || 'Unknown Vendor'}
            </Text>
            <Text style={styles.amount}>
              {formatAmount(receipt.amount)}
            </Text>
          </View>
          
          {/* Meta: Category + Date */}
          <View style={styles.metaRow}>
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryDot, { backgroundColor: entityColor.primary }]} />
              <Text style={styles.category} numberOfLines={1}>
                {receipt.entity && (
                  <>
                    {receipt.entity}
                    {receipt.tags && receipt.tags.length > 0 && (
                      <Text style={styles.categoryDivider}> • </Text>
                    )}
                  </>
                )}
                {receipt.tags && receipt.tags.length > 0 && (
                  <>
                    {receipt.tags.slice(0, 2).join(', ')}
                    {receipt.tags.length > 2 && (
                      <Text style={styles.tagCount}> +{receipt.tags.length - 2}</Text>
                    )}
                  </>
                )}
              </Text>
            </View>
            <Text style={styles.date}>
              {formatDate(receipt.date)}
            </Text>
          </View>
        </View>
        
        {/* Always-Visible Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Ionicons name="pencil" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          {receipt.receipt_url && (
            <TouchableOpacity style={styles.actionButton} onPress={handlePreview}>
              <Ionicons name="eye" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Platform-specific margins to match section header
    marginHorizontal: Platform.select({
      ios: 20,     // Match section header margin for iOS
      android: 16, // Keep existing Android margin
    }),
    marginVertical: spacing.xs, // 6px - reduced from 8px
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg, // 16px - increased for premium feel
    padding: 12, // Reduced from 16px for efficiency
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden', // CRITICAL: Ensures entity indicator stays within card
  },
  entityIndicator: {
    height: 3,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0, // Use right instead of width for better positioning
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  content: {
    marginTop: spacing.sm, // Space for entity indicator
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm, // Reduced from 12px
  },
  vendor: {
    ...typography.title3,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.money,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  category: {
    ...typography.body2,
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  categoryDivider: {
    color: colors.textMuted,
  },
  tagCount: {
    ...typography.number,
    fontSize: 14,
    color: colors.textMuted,
  },
  date: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
    flexShrink: 0,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});