import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Receipt } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { SlideOutActions } from './SlideOutActions';

interface SleekReceiptCardProps {
  receipt: Receipt;
  onEdit?: (receipt: Receipt) => void;
  onPreview?: (receipt: Receipt) => void;
  onDelete?: (receiptId: string) => void;
}


export const SleekReceiptCard: React.FC<SleekReceiptCardProps> = ({
  receipt,
  onEdit,
  onPreview,
  onDelete,
}) => {
  const handleEdit = () => {
    onEdit?.(receipt);
  };

  const handlePreview = () => {
    onPreview?.(receipt);
  };

  const handleDelete = () => {
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
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Main Content - Two Lines */}
        <View style={styles.content}>
          {/* First Line: Vendor and Amount */}
          <View style={styles.firstLine}>
            <Text style={styles.vendor} numberOfLines={1}>
              {receipt.vendor || 'Unknown Vendor'}
            </Text>
            <Text style={styles.amount}>
              {formatAmount(receipt.amount)}
            </Text>
          </View>

          {/* Second Line: Entity/Tags and Date */}
          <View style={styles.secondLine}>
            <View style={styles.metaContainer}>
              {receipt.entity && (
                <View style={styles.entityBadge}>
                  <Text style={styles.entityText}>{receipt.entity}</Text>
                </View>
              )}
              {receipt.tags && receipt.tags.length > 0 && (
                <Text style={styles.tags} numberOfLines={1}>
                  {receipt.tags.slice(0, 2).join(', ')}
                  {receipt.tags.length > 2 && (
                    <Text style={styles.tagCount}> +{receipt.tags.length - 2}</Text>
                  )}
                </Text>
              )}
            </View>
            <Text style={styles.date}>
              {formatDate(receipt.date)}
            </Text>
          </View>

          {/* Third Line: Actions */}
          <View style={styles.actionsLine}>
            <SlideOutActions
              onEdit={handleEdit}
              onPreview={receipt.receipt_url ? handlePreview : undefined}
              onDelete={handleDelete}
              hasPreview={!!receipt.receipt_url}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    marginBottom: spacing.sm,
  },
  firstLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
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
  secondLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  entityBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  entityText: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.textSecondary,
    fontSize: 13,
  },
  tags: {
    ...typography.body2,
    color: colors.success, // Changed to green to differentiate from Entity
    fontSize: 14,
    flex: 1,
  },
  tagCount: {
    ...typography.number,
    fontSize: 14,
    color: colors.success, // Changed to green to match tags
  },
  date: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
    flexShrink: 0,
  },
  actionsLine: {
    marginTop: spacing.sm,
    alignItems: 'flex-end',
  },
});