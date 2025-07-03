import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, shadows, spacing } from '../styles/theme';
import { Receipt } from '../types';

interface RecentReceiptsProps {
  receipts?: Receipt[];
  isLoading: boolean;
}

export default function RecentReceipts({ receipts = [], isLoading }: RecentReceiptsProps) {
  const renderReceiptItem = ({ item }: { item: Receipt }) => (
    <View style={styles.receiptItem}>
      <View style={styles.receiptIcon}>
        <Ionicons name="receipt-outline" size={20} color={colors.primary} />
      </View>
      
      <View style={styles.receiptDetails}>
        <Text style={styles.vendorText}>{item.vendor}</Text>
        <Text style={styles.categoryText}>
          {item.tags && item.tags.length > 0 
            ? Array.isArray(item.tags) 
              ? item.tags.join(', ') 
              : item.tags
            : item.entity || 'No category'
          }
        </Text>
      </View>
      
      <View style={styles.receiptAmount}>
        <Text style={styles.amountText}>${(item.amount || 0).toFixed(2)}</Text>
        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  if (isLoading && receipts.length === 0) {
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

  if (receipts.length === 0) {
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
      
      <View style={styles.list}>
        {receipts.map((item) => (
          <View key={item.id}>
            {renderReceiptItem({ item })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  list: {
    // Remove flex: 1 since we're not using FlatList anymore
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  receiptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  receiptDetails: {
    flex: 1,
  },
  vendorText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  receiptAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    ...typography.money,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: 2,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});