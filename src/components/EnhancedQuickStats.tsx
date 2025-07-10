import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Animated, 
  Easing 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, shadows, spacing } from '../styles/theme';
import { QuickStats as QuickStatsType, Receipt } from '../types';

interface EnhancedQuickStatsProps {
  stats: QuickStatsType | null;
  isLoading: boolean;
  receipts?: Receipt[];
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: string;
  delay?: number;
  onPress?: () => void;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  delay = 0,
  onPress,
  color = colors.primary
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [delay]);

  const handlePressIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress ? handlePress : undefined}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      disabled={!onPress}
    >
      <Animated.View style={[
        styles.statCard,
        { 
          transform: [{ scale: scaleValue }],
          opacity: animatedValue
        }
      ]}>
        {/* Header with icon and trend */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon as any} size={20} color={color} />
          </View>
          {trend !== undefined && (
            <View style={[
              styles.trendContainer, 
              trend > 0 ? styles.trendPositive : styles.trendNegative
            ]}>
              <Ionicons 
                name={trend > 0 ? "trending-up" : "trending-down"} 
                size={12} 
                color={trend > 0 ? colors.success : colors.error} 
              />
              <Text style={[
                styles.trendText, 
                { color: trend > 0 ? colors.success : colors.error }
              ]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.cardTitle}>{title}</Text>
        
        {/* Animated value reveal */}
        <Animated.Text style={[
          styles.cardValue,
          {
            transform: [{
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}>
          {value}
        </Animated.Text>
        
        {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const EnhancedQuickStats: React.FC<EnhancedQuickStatsProps> = ({ 
  stats, 
  isLoading, 
  receipts = [] 
}) => {
  const [timeframeState, setTimeframeState] = useState(2); // Start with "This Month"

  // Calculate stats for different timeframes
  const calculateStats = (timeframeIndex: number) => {
    if (!receipts || receipts.length === 0) {
      return { totalAmount: 0, count: 0, avgAmount: 0 };
    }

    const now = new Date();
    let filteredReceipts = receipts;
    
    switch (timeframeIndex) {
      case 0: // Today
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredReceipts = receipts.filter(receipt => {
          let receiptDate;
          if (receipt.date.includes('T')) {
            receiptDate = new Date(receipt.date);
          } else if (receipt.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = receipt.date.split('-').map(Number);
            receiptDate = new Date(year, month - 1, day);
          } else {
            receiptDate = new Date(receipt.date);
          }
          
          const receiptLocalDate = new Date(receiptDate.getFullYear(), receiptDate.getMonth(), receiptDate.getDate());
          return receiptLocalDate.getTime() === today.getTime();
        });
        break;
      case 1: // This Week
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6);
        filteredReceipts = receipts.filter(receipt => {
          let receiptDate;
          if (receipt.date.includes('T')) {
            receiptDate = new Date(receipt.date);
          } else if (receipt.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = receipt.date.split('-').map(Number);
            receiptDate = new Date(year, month - 1, day);
          } else {
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

  const getTimeframeLabel = (timeframeIndex: number) => {
    const labels = ['Today', 'This Week', 'This Month', 'All Time'];
    return labels[timeframeIndex];
  };

  const handleStatCardTap = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeframeState(prev => (prev + 1) % 4); // Cycle 0→1→2→3→0
  };

  const statsForTimeframe = calculateStats(timeframeState);
  const allTimeStats = calculateStats(3);
  
  // For "All Time" mode, use the actual total count from API stats instead of receipts array length
  const displayCount = timeframeState === 3 
    ? (stats?.receipt_count || allTimeStats.count) // Use API total count for All Time
    : statsForTimeframe.count;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    );
  }

  // Calculate trend (mock data for now - in real app this would come from historical data)
  const mockTrend = Math.random() > 0.5 ? Math.floor(Math.random() * 20) : -Math.floor(Math.random() * 15);

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <StatCard
          title={getTimeframeLabel(timeframeState)}
          value={`$${statsForTimeframe.totalAmount.toFixed(2)}`}
          subtitle="Total Spent"
          trend={mockTrend}
          icon="card-outline"
          delay={0}
          onPress={handleStatCardTap}
          color={colors.primary}
        />
        
        <StatCard
          title="Receipts"
          value={displayCount.toString()}
          subtitle={timeframeState === 3 ? 'Total Tracked' : getTimeframeLabel(timeframeState)}
          icon="receipt-outline"
          delay={100}
          onPress={handleStatCardTap}
          color={colors.secondary}
        />
      </View>
      
      {statsForTimeframe.count > 0 && (
        <StatCard
          title="Average"
          value={`$${statsForTimeframe.avgAmount.toFixed(2)}`}
          subtitle={`Per receipt ${getTimeframeLabel(timeframeState).toLowerCase()}`}
          icon="analytics-outline"
          delay={200}
          color={colors.success}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    ...shadows.premium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  trendPositive: {
    backgroundColor: `${colors.success}15`,
  },
  trendNegative: {
    backgroundColor: `${colors.error}15`,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
    fontFamily: typography.caption.fontFamily,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  cardValue: {
    ...typography.title2,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
});