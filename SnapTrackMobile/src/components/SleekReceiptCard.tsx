import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Receipt } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { hapticFeedback } from '../utils/hapticFeedback';
import { shareService } from '../services/shareService';

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
    border: `${colors.primary}33`
  };
};


export const SleekReceiptCard: React.FC<SleekReceiptCardProps> = ({
  receipt,
  onEdit,
  onPreview,
  onDelete
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

  const handleShare = async () => {
    try {
      await hapticFeedback.buttonPress();
      const success = await shareService.shareReceiptImage(receipt);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('❌ Share button error:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Fix timezone handling - treat date-only strings as local dates
      let date: Date;
      
      if (dateString && dateString.includes('T')) {
        // Already has time component, use as-is
        date = new Date(dateString);
      } else {
        // Date-only string - treat as local date by appending local time
        date = new Date(dateString + 'T00:00:00');
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
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
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.sm
  },
  amount: {
    ...typography.money,
    color: colors.primary,
    flexShrink: 0,
    fontWeight: '700'
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg, // 16px - increased for premium feel
    padding: 12, // Reduced from 16px for efficiency
    ...shadows.card,
    borderColor: colors.border,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative' // CRITICAL: Ensures entity indicator stays within card
  },
  category: {
    ...typography.body2,
    color: colors.textSecondary,
    flex: 1,
    fontSize: 14
  },
  categoryContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.sm
  },
  categoryDivider: {
    color: colors.textMuted
  },
  categoryDot: {
    borderRadius: 4,
    height: 8,
    marginRight: spacing.xs,
    width: 8
  },
  container: {
    // Platform-specific margins to match section header
    marginHorizontal: Platform.select({
      ios: 20,     // Match section header margin for iOS
      android: 16 // Keep existing Android margin
    }),
    marginVertical: spacing.xs // 6px - reduced from 8px
  },
  content: {
    marginTop: spacing.sm, // Space for entity indicator
    marginBottom: spacing.sm
  },
  date: {
    ...typography.body2,
    color: colors.textSecondary,
    flexShrink: 0,
    fontWeight: '500'
  },
  entityIndicator: {
    height: 3,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0, // Use right instead of width for better positioning
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm // Reduced from 12px
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  tagCount: {
    ...typography.number,
    color: colors.textMuted,
    fontSize: 14
  },
  vendor: {
    ...typography.title3,
    color: colors.textPrimary,
    flex: 1,
    fontWeight: '600',
    marginRight: spacing.sm
  }
});