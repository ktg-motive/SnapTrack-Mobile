import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '../styles/theme';

export enum ReceiptsState {
  hasMore = 'hasMore',
  loading = 'loading',
  endOfList = 'endOfList',
  empty = 'empty',
}

interface HomeScreenFooterProps {
  receiptsState: ReceiptsState;
  receiptCount?: number;
  onViewAllTapped: () => void;
  onEmptyStateTapped: () => void;
}

export const HomeScreenFooter: React.FC<HomeScreenFooterProps> = ({
  receiptsState,
  receiptCount = 0,
  onViewAllTapped,
  onEmptyStateTapped
}) => {
  const handleViewAllTap = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewAllTapped();
  };

  const handleEmptyStateTap = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEmptyStateTapped();
  };

  const renderContent = () => {
    switch (receiptsState) {
    case ReceiptsState.hasMore:
      return (
        <View style={styles.secondaryRow}>
          <Ionicons name="chevron-up" size={14} color={colors.textSecondary} />
          <Text 
            style={styles.secondaryText}
            accessibilityLabel="Swipe up for more receipts"
          >
              Swipe up for more
          </Text>
        </View>
      );

    case ReceiptsState.loading:
      return (
        <View 
          style={styles.loadingRow}
          accessibilityLabel="Loading more receipts"
        >
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <Text style={styles.secondaryText}>Loading more receipts...</Text>
        </View>
      );

    case ReceiptsState.endOfList:
      return (
        <>
          <View style={styles.primaryRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text 
              style={[styles.primaryText, { color: colors.success }]}
              accessibilityLabel="All caught up, no more receipts to load"
            >
                All caught up!
            </Text>
          </View>
          <View style={styles.secondaryRow}>
            <Ionicons name="refresh-outline" size={14} color={colors.textSecondary} />
            <Text 
              style={styles.secondaryText}
              accessibilityLabel="Pull down to refresh receipts"
            >
                Pull down to refresh
            </Text>
          </View>
        </>
      );

    case ReceiptsState.empty:
      return (
        <TouchableOpacity 
          onPress={handleEmptyStateTap}
          style={styles.fullTappableArea}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Capture your first receipt"
          accessibilityHint="Scroll to capture button above"
        >
          <View style={styles.primaryRow}>
            <Ionicons name="camera-outline" size={16} color={colors.primary} />
            <Text style={[styles.primaryText, { color: colors.primary }]}>Capture your first receipt</Text>
          </View>
          <Text style={styles.secondaryText}>above</Text>
        </TouchableOpacity>
      );

    default:
      return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#F8F9FA', // Very light gray as specified
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  fullTappableArea: {
    alignItems: 'center',
    borderRadius: 4,
    flex: 1,
    justifyContent: 'center',
    width: '100%'
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center'
  },
  primaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center'
  },
  primaryText: {
    ...typography.title3,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    marginBottom: 4,
    textAlign: 'center'
  },
  secondaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center'
  },
  secondaryText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    textAlign: 'center'
  },
  tappableArea: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2
  }
});