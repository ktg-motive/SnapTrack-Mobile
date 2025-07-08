import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors, typography, shadows } from '../styles/theme';
import { QuickStats as QuickStatsType, Receipt } from '../types';

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

  // Get card styling based on timeframe
  const getCardStyle = (timeframeIndex: number) => {
    const baseStyle = styles.statCard;
    const colorStyles = [
      { backgroundColor: '#02B2B3' }, // Light teal - Today
      { backgroundColor: '#069196' }, // Light-medium teal - This Week
      { backgroundColor: '#079195' }, // Medium teal - This Month  
      { backgroundColor: '#06686B' }, // Dark teal - All Time
    ];
    return [baseStyle, colorStyles[timeframeIndex]];
  };

  // Handle card tap to cycle timeframes
  const handleStatCardTap = () => {
    setTimeframeState(prev => (prev + 1) % 4); // Cycle 0→1→2→3→0
  };

  // Calculate values for display (both cards use same timeframe)
  const statsForTimeframe = calculateStats(timeframeState);
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={getCardStyle(timeframeState)}
        onPress={handleStatCardTap}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={[typography.money, styles.statValue, { color: 'white' }]}>
            ${statsForTimeframe.totalAmount.toFixed(2)}
          </Text>
        )}
        <Text style={[typography.caption, styles.statLabel, { color: 'white' }]}>
          {getTimeframeLabel(timeframeState)}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={getCardStyle(timeframeState)}
        onPress={handleStatCardTap}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={[typography.money, styles.statValue, { color: 'white' }]}>
            {statsForTimeframe.count}
          </Text>
        )}
        <Text style={[typography.caption, styles.statLabel, { color: 'white' }]}>
          {getTimeframeLabel(timeframeState)}
        </Text>
      </TouchableOpacity>
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
    // backgroundColor removed - will be set dynamically
    paddingVertical: 12, // Reduced from 20 to 12 for thinner boxes
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.card,
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