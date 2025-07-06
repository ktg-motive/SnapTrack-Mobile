import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, shadows } from '../styles/theme';
import { QuickStats as QuickStatsType } from '../types';

interface QuickStatsProps {
  stats: QuickStatsType | null;
  isLoading: boolean;
}

export default function QuickStats({ stats, isLoading }: QuickStatsProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.statCard, styles.leftCard]}>
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={[typography.money, styles.statValue, { color: 'white' }]}>
            ${stats?.monthly_total?.toFixed(2) || '0.00'}
          </Text>
        )}
        <Text style={[typography.caption, styles.statLabel, { color: 'white' }]}>
          This Month
        </Text>
      </View>
      
      <View style={[styles.statCard, styles.rightCard]}>
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={[typography.money, styles.statValue, { color: 'white' }]}>
            {stats?.receipt_count || 0}
          </Text>
        )}
        <Text style={[typography.caption, styles.statLabel, { color: 'white' }]}>
          Receipts
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 4, // Reduced margin when positioned under receipts
    marginBottom: 8, // Reduced bottom margin for tighter spacing
    gap: 12,
    backgroundColor: colors.surface, // Solid background to distinguish from receipts
    paddingHorizontal: 16, // Add horizontal padding
    paddingVertical: 8, // Reduced vertical padding for thinner overall height
    borderRadius: 12, // Rounded corners for clean appearance
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.primary, // Solid color background instead of white
    paddingVertical: 12, // Reduced from 20 to 12 for thinner boxes
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.card,
  },
  leftCard: {
    // Remove border since it won't be visible on same color background
  },
  rightCard: {
    // Remove border since it won't be visible on same color background
  },
  statValue: {
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)', // Subtle dark shadow on white text
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    color: 'white', // White text on colored background
  },
});