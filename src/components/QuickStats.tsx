import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { colors, typography, shadows, statsCardColors, borderRadius, spacing } from '../styles/theme';
import { QuickStats as QuickStatsType, Receipt } from '../types';
import * as Haptics from 'expo-haptics';

interface QuickStatsProps {
  stats: QuickStatsType | null;
  isLoading: boolean;
  receipts?: Receipt[]; // Add receipts for detailed calculations
}

export default function QuickStats({ stats, isLoading, receipts = [] }: QuickStatsProps) {
  // State for cycling timeframes: 0=Today, 1=This Week, 2=This Month, 3=All Time
  const [timeframeState, setTimeframeState] = useState(2); // Start with "This Month" to match current behavior

  // Calculate stats for different timeframes
  const calculateStats = (timeframeIndex: number) => {
    if (!receipts || receipts.length === 0) {
      return { totalAmount: 0, count: 0, avgAmount: 0 };
    }

    const now = new Date();
    let filteredReceipts = receipts;
    
    // Debug logging for Today calculation
    if (timeframeIndex === 0) {
      console.log('Today calculation debug:');
      console.log('Current date:', now.toDateString());
      console.log('Receipts count:', receipts.length);
      receipts.forEach((receipt, index) => {
        console.log(`Receipt ${index}: date="${receipt.date}", amount=${receipt.amount}`);
      });
    }

    switch (timeframeIndex) {
      case 0: // Today - Fix timezone handling
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredReceipts = receipts.filter(receipt => {
          // Handle various date formats and timezone issues
          let receiptDate;
          if (receipt.date.includes('T')) {
            // ISO format with time
            receiptDate = new Date(receipt.date);
          } else if (receipt.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // YYYY-MM-DD format - treat as local date
            const [year, month, day] = receipt.date.split('-').map(Number);
            receiptDate = new Date(year, month - 1, day);
          } else {
            // Other formats - use standard parsing
            receiptDate = new Date(receipt.date);
          }
          
          const receiptLocalDate = new Date(receiptDate.getFullYear(), receiptDate.getMonth(), receiptDate.getDate());
          const matches = receiptLocalDate.getTime() === today.getTime();
          console.log(`Receipt date "${receipt.date}" -> ${receiptLocalDate.toDateString()} vs today ${today.toDateString()} = ${matches}`);
          return matches;
        });
        break;
      case 1: // This Week
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6);
        filteredReceipts = receipts.filter(receipt => {
          // Handle various date formats and timezone issues (same as Today)
          let receiptDate;
          if (receipt.date.includes('T')) {
            // ISO format with time
            receiptDate = new Date(receipt.date);
          } else if (receipt.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // YYYY-MM-DD format - treat as local date
            const [year, month, day] = receipt.date.split('-').map(Number);
            receiptDate = new Date(year, month - 1, day);
          } else {
            // Other formats - use standard parsing
            receiptDate = new Date(receipt.date);
          }
          
          const receiptLocalDate = new Date(receiptDate.getFullYear(), receiptDate.getMonth(), receiptDate.getDate());
          return receiptLocalDate >= startOfWeek && receiptLocalDate <= endOfWeek;
        });
        break;
      case 2: // This Month
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        filteredReceipts = receipts.filter(receipt => {
          const receiptDate = new Date(receipt.date);
          return receiptDate.getMonth() === currentMonth && 
                 receiptDate.getFullYear() === currentYear;
        });
        break;
      case 3: // All Time
        filteredReceipts = receipts;
        break;
    }

    const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    const count = filteredReceipts.length;
    const avgAmount = count > 0 ? totalAmount / count : 0;

    return { totalAmount, count, avgAmount };
  };

  // Get timeframe labels
  const getTimeframeLabel = (timeframeIndex: number) => {
    const labels = ['Today', 'This Week', 'This Month', 'All Time'];
    return labels[timeframeIndex];
  };

  // Get timeframe badge text
  const getTimeframeBadge = (timeframeIndex: number) => {
    const badges = ['today', 'week', 'month', 'all'];
    return badges[timeframeIndex];
  };

  // Handle card tap to cycle timeframes
  const handleStatCardTap = async () => {
    // Provide tactile feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeframeState(prev => (prev + 1) % 4); // Cycle 0→1→2→3→0
  };

  // Calculate values for display (both cards use same timeframe)
  const statsForTimeframe = calculateStats(timeframeState);
  const allTimeStats = calculateStats(3); // Always calculate all-time stats for total count
  
  // For "All Time" mode, use the actual total count from API stats instead of receipts array length
  const displayCount = timeframeState === 3 
    ? (stats?.receipt_count || allTimeStats.count) // Use API total count for All Time
    : statsForTimeframe.count;
  
  const StatsCard = ({ title, value, isLoading, onPress }) => {
    const [isPressed, setIsPressed] = useState(false);

    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.statsCard,
          isPressed && styles.cardPressed
        ]}
        accessibilityRole="button"
        accessibilityHint="Tap to cycle through different time periods"
      >
        {/* Main content */}
        <View style={styles.cardContent}>
          {isLoading ? (
            <ActivityIndicator size="small" color={statsCardColors.value} />
          ) : (
            <Text 
              style={styles.valueText}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {value}
            </Text>
          )}
          <Text 
            style={styles.titleText}
            numberOfLines={2}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.9}
          >
            {title}
          </Text>
        </View>
        
        {/* Micro-visual cues */}
        <View style={styles.cueContainer}>
          {/* Four tiny dots showing current timeframe state */}
          <View style={styles.moreDots}>
            <View style={[styles.dot, timeframeState === 0 ? styles.dotActive : styles.dotInactive]} />
            <View style={[styles.dot, timeframeState === 1 ? styles.dotActive : styles.dotInactive]} />
            <View style={[styles.dot, timeframeState === 2 ? styles.dotActive : styles.dotInactive]} />
            <View style={[styles.dot, timeframeState === 3 ? styles.dotActive : styles.dotInactive]} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatsCard
        title={getTimeframeLabel(timeframeState)}
        value={`$${statsForTimeframe.totalAmount.toFixed(2)}`}
        isLoading={isLoading}
        onPress={handleStatCardTap}
      />
      
      <StatsCard
        title={getTimeframeLabel(timeframeState)}
        value={displayCount.toString()}
        isLoading={isLoading}
        onPress={handleStatCardTap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,                         // 8px gap between cards
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  
  statsCard: {
    flex: 1,                                 // Equal width cards
    backgroundColor: statsCardColors.background,
    borderRadius: borderRadius.lg,           // 16 from style guide
    borderWidth: 1,
    borderColor: statsCardColors.border,
    padding: spacing.md,                     // 16 from style guide
    minHeight: 85,                           // Slightly taller for better proportions
    ...shadows.card,                         // From style guide
    
    // Enable relative positioning for cues
    position: 'relative',
    overflow: 'visible', // Allow badges to extend slightly outside
  },
  
  cardPressed: {
    backgroundColor: statsCardColors.pressed,
    borderColor: statsCardColors.pressedBorder,
    transform: [{ scale: 0.98 }],
  },
  
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  valueText: {
    ...typography.title2,                    // 24px, line 30, weight 600
    color: statsCardColors.value,
    fontWeight: '700',
    textAlign: 'center',
    numberOfLines: 1,                        // Prevent wrapping
    adjustsFontSizeToFit: true,              // Scale down if needed
    minimumFontScale: 0.8,                   // Don't scale below 80%
  },
  
  titleText: {
    ...typography.caption,                   // 12px, line 16, weight 500
    color: statsCardColors.title,
    textAlign: 'center',
    marginTop: spacing.xs,                   // 4 from style guide
    fontWeight: '500',
    numberOfLines: 2,                        // Allow up to 2 lines
    adjustsFontSizeToFit: true,              // Scale down if needed
    minimumFontScale: 0.9,                   // Don't scale below 90%
  },
  
  // Micro-visual cue container
  cueContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    pointerEvents: 'none', // Don't interfere with main touch area
  },
  
  // Four tiny dots in top-right corner showing timeframe state
  moreDots: {
    position: 'absolute',
    top: spacing.sm,                         // 8 from style guide
    right: spacing.sm,                       // 8 from style guide
    flexDirection: 'row',
    gap: 3,                                  // Slightly more gap for 4 dots
  },
  
  dot: {
    width: 4,                                // Slightly larger for better visibility
    height: 4,
    borderRadius: 2,
  },
  
  dotActive: {
    backgroundColor: statsCardColors.accent,
  },
  
  dotInactive: {
    backgroundColor: statsCardColors.title + '30', // 30% opacity of secondary text
  },
});