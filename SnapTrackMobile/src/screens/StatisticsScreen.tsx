import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, shadows, spacing, borderRadius, theme } from '../styles/theme';
import { Receipt } from '../types';
import { formatAmount } from '../utils/formatters';
import { apiClient } from '../services/apiClient';

interface StatisticsScreenProps {
  // No props needed - component will fetch its own data
}

interface EntityStats {
  entityName: string;
  totalAmount: number;
  percentage: number;
  receiptCount: number;
  tags: TagStats[];
  color: string;
}

interface TagStats {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

interface PeriodOption {
  id: string;
  label: string;
  getValue: (receipts: Receipt[]) => Receipt[];
}

const PERIOD_OPTIONS: PeriodOption[] = [
  {
    id: 'thisMonth',
    label: 'This Month',
    getValue: (receipts) => {
      if (!receipts || !Array.isArray(receipts)) return [];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      console.log('This Month filter - Current month index:', currentMonth, '(July=6)', 'Year:', currentYear);
      const filtered = receipts.filter(receipt => {
        const receiptDate = new Date(receipt.date);
        const match = receiptDate.getMonth() === currentMonth && 
               receiptDate.getFullYear() === currentYear;
        console.log('Receipt date:', receipt.date, 'Parsed:', receiptDate, 'Match:', match);
        return match;
      });
      console.log('This Month filtered count:', filtered.length);
      return filtered;
    }
  },
  {
    id: 'lastMonth',
    label: 'Last Month',
    getValue: (receipts) => {
      if (!receipts || !Array.isArray(receipts)) return [];
      const now = new Date();
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return receipts.filter(receipt => {
        const receiptDate = new Date(receipt.date);
        return receiptDate.getMonth() === lastMonth && 
               receiptDate.getFullYear() === year;
      });
    }
  },
  {
    id: 'last3Months',
    label: 'Last 3 Months',
    getValue: (receipts) => {
      if (!receipts || !Array.isArray(receipts)) return [];
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1); // Start of month 3 months ago
      console.log('Last 3 Months filter - from:', threeMonthsAgo, 'to:', now);
      const filtered = receipts.filter(receipt => {
        const receiptDate = new Date(receipt.date);
        const match = receiptDate >= threeMonthsAgo && receiptDate <= now;
        console.log('Receipt date:', receipt.date, 'Parsed:', receiptDate, 'Match:', match);
        return match;
      });
      console.log('Last 3 Months filtered count:', filtered.length);
      return filtered;
    }
  },
  {
    id: 'yearToDate',
    label: 'Year to Date',
    getValue: (receipts) => {
      if (!receipts || !Array.isArray(receipts)) return [];
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st of current year
      console.log('Year to Date filter - from:', startOfYear, 'to:', now);
      const filtered = receipts.filter(receipt => {
        const receiptDate = new Date(receipt.date);
        const match = receiptDate >= startOfYear && receiptDate <= now;
        console.log('Receipt date:', receipt.date, 'Parsed:', receiptDate, 'Match:', match);
        return match;
      });
      console.log('Year to Date filtered count:', filtered.length);
      return filtered;
    }
  },
  {
    id: 'allTime',
    label: 'All Time',
    getValue: (receipts) => receipts || []
  }
];

// Entity color mapping based on style guide
const getEntityColor = (entityName: string): string => {
  const colorMap: { [key: string]: string } = {
    'Motive ESG': colors.primary,        // Trust Teal
    'MotiveESG': colors.primary,
    'Motive AI': colors.secondary,       // Navy Blue
    'MotiveAI': colors.secondary,
    'LA-AI': colors.success,            // Financial Green
    'Personal': colors.textSecondary    // Professional Gray
  };
  
  return colorMap[entityName] || colors.textSecondary;
};

export default function StatisticsScreen({}: StatisticsScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[4]); // Default: All Time to show all entities
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllEntities, setShowAllEntities] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadReceiptData();
  }, []);

  useEffect(() => {
    // Initial animation after data loads
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isLoading]);

  const loadReceiptData = async () => {
    try {
      setIsLoading(true);
      
      // Load all receipts using pagination
      const allReceipts: any[] = [];
      let page = 1;
      let hasMorePages = true;
      
      console.log('Statistics: Loading all receipts with pagination...');
      
      while (hasMorePages) {
        const receiptResponse = await apiClient.getReceipts({ 
          page: page,
          limit: 100 // Use reasonable page size
        });
        
        const pageReceipts = receiptResponse?.data || [];
        allReceipts.push(...pageReceipts);
        
        console.log(`Statistics: Loaded page ${page}: ${pageReceipts.length} receipts`);
        
        // Check if there are more pages
        const pagination = receiptResponse?.pagination;
        hasMorePages = pagination?.has_next_page || false;
        
        // Safety check to prevent infinite loops
        if (page > 10) {
          console.warn('Statistics: Hit maximum page limit (10), stopping pagination');
          break;
        }
        
        page++;
      }
      
      console.log('Statistics: Total receipts loaded:', allReceipts.length);
      console.log('Statistics: Sample receipt:', allReceipts[0]);
      
      setReceipts(allReceipts);
      
    } catch (error) {
      console.error('Error loading receipts for statistics:', error);
      // Set empty array on error
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReceipts = selectedPeriod.getValue(receipts);
  
  // Calculate entity statistics
  const calculateEntityStats = (): EntityStats[] => {
    if (!filteredReceipts || !Array.isArray(filteredReceipts)) {
      return [];
    }
    
    const entityMap: { [key: string]: { total: number; receipts: Receipt[] } } = {};
    
    filteredReceipts.forEach((receipt) => {
      // Handle various entity formats - normalize empty strings, null, undefined to 'Personal'
      let entity = receipt.entity;
      if (!entity || entity.trim() === '' || entity === 'null' || entity === 'undefined') {
        entity = 'Personal';
      } else {
        entity = entity.trim(); // Remove any whitespace
        // Normalize 'personal' (lowercase) to 'Personal' (capitalized)
        if (entity.toLowerCase() === 'personal') {
          entity = 'Personal';
        }
      }
      
      if (!entityMap[entity]) {
        entityMap[entity] = { total: 0, receipts: [] };
      }
      entityMap[entity].total += receipt.amount;
      entityMap[entity].receipts.push(receipt);
    });

    const totalAmount = Object.values(entityMap).reduce((sum, entity) => sum + entity.total, 0);
    
    return Object.entries(entityMap)
      .map(([entityName, data]) => {
        const percentage = totalAmount > 0 ? (data.total / totalAmount) * 100 : 0;
        
        // Calculate tag stats for this entity
        const tagMap: { [key: string]: { amount: number; count: number } } = {};
        data.receipts.forEach(receipt => {
          if (receipt.tags && Array.isArray(receipt.tags)) {
            receipt.tags.forEach(tag => {
              if (!tagMap[tag]) {
                tagMap[tag] = { amount: 0, count: 0 };
              }
              tagMap[tag].amount += receipt.amount;
              tagMap[tag].count += 1;
            });
          }
        });

        const tags: TagStats[] = Object.entries(tagMap)
          .map(([name, stats]) => ({
            name,
            amount: stats.amount,
            count: stats.count,
            percentage: data.total > 0 ? (stats.amount / data.total) * 100 : 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5); // Top 5 tags

        return {
          entityName,
          totalAmount: data.total,
          percentage,
          receiptCount: data.receipts.length,
          tags,
          color: getEntityColor(entityName)
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  };

  // Memoized calculation to update when period or receipts change
  const entityStats = React.useMemo(() => {
    console.log('🔄 Recalculating entity stats for period:', selectedPeriod.label);
    console.log('🔄 Total receipts available:', receipts.length);
    console.log('🔄 Filtered receipts for this period:', filteredReceipts.length);
    
    // Log sample receipts for debugging
    receipts.forEach((receipt, index) => {
      if (index < 5) { // Log first 5 receipts
        console.log(`📄 Receipt ${index + 1}:`, {
          entity: receipt.entity,
          amount: receipt.amount,
          date: receipt.date,
          vendor: receipt.vendor
        });
      }
    });
    
    return calculateEntityStats();
  }, [filteredReceipts, selectedPeriod.id]);
  const totalExpenses = entityStats.reduce((sum, entity) => sum + entity.totalAmount, 0);
  
  // Show top 4 entities by default
  const displayedEntities = showAllEntities ? entityStats : entityStats.slice(0, 4);
  const hasMoreEntities = entityStats.length > 4;

  const handlePeriodChange = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Cycle through periods
    const currentIndex = PERIOD_OPTIONS.findIndex(p => p.id === selectedPeriod.id);
    const nextIndex = (currentIndex + 1) % PERIOD_OPTIONS.length;
    setSelectedPeriod(PERIOD_OPTIONS[nextIndex]);
  };

  const handleEntityToggle = async (entityName: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpandedEntity(prev => prev === entityName ? null : entityName);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadReceiptData();
    setRefreshing(false);
  };

  const renderSummaryCard = () => (
    <Animated.View 
      style={[
        styles.summaryCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.summaryLabel}>Total Expenses</Text>
      <Text style={styles.summaryAmount}>{formatAmount(totalExpenses)}</Text>
      
      <View style={styles.summaryMeta}>
        <Text style={styles.periodLabel}>{selectedPeriod.label}</Text>
        <Text style={styles.receiptCount}>{filteredReceipts.length} receipts</Text>
      </View>
    </Animated.View>
  );

  const renderEntityCard = (entity: EntityStats, index: number) => {
    const isExpanded = expandedEntity === entity.entityName;
    
    return (
      <Animated.View 
        key={entity.entityName}
        style={[
          styles.entityCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: Animated.add(slideAnim, new Animated.Value(index * 5))
            }]
          }
        ]}
      >
        {/* Entity color indicator */}
        <View style={[styles.entityIndicator, { backgroundColor: entity.color }]} />
        
        <Pressable
          onPress={() => handleEntityToggle(entity.entityName)}
          style={({ pressed }) => [
            styles.entityCardContent,
            pressed && styles.entityCardPressed
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${entity.entityName} entity, ${formatAmount(entity.totalAmount)}, ${entity.percentage.toFixed(1)}% of total expenses`}
          accessibilityHint="Double tap to expand and view category breakdown"
          accessibilityState={{ expanded: isExpanded }}
        >
          {/* Header row */}
          <View style={styles.entityHeader}>
            <View style={styles.entityInfo}>
              <Text style={styles.entityName}>{entity.entityName}</Text>
              <Text style={styles.entityAmount}>{formatAmount(entity.totalAmount)}</Text>
            </View>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={colors.textSecondary} 
            />
          </View>
          
          {/* Progress section */}
          <View style={styles.progressSection}>
            <View style={styles.progressMeta}>
              <Text style={styles.progressLabel}>
                {entity.percentage.toFixed(1)}% of total
              </Text>
              <Text style={styles.receiptCount}>
                {entity.receiptCount} receipts
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${entity.percentage}%`,
                    backgroundColor: entity.color
                  }
                ]} 
              />
            </View>
          </View>
        </Pressable>
        
        {/* Expanded tag breakdown */}
        {isExpanded && (
          <Animated.View style={styles.tagSection}>
            <Text style={styles.tagSectionHeader}>Top Categories</Text>
            
            {entity.tags.map((tag, tagIndex) => (
              <Animated.View 
                key={tag.name}
                style={[
                  styles.tagItem,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: Animated.add(slideAnim, new Animated.Value(tagIndex * 3))
                    }]
                  }
                ]}
              >
                <View style={styles.tagHeader}>
                  <Text style={styles.tagName}>{tag.name}</Text>
                  <Text style={styles.tagAmount}>{formatAmount(tag.amount)}</Text>
                </View>
                
                <View style={styles.tagProgress}>
                  <View style={styles.tagProgressBar}>
                    <View 
                      style={[
                        styles.tagProgressFill,
                        { 
                          width: `${tag.percentage}%`,
                          backgroundColor: entity.color + '80' // 50% opacity
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.tagPercentage}>{tag.percentage.toFixed(1)}%</Text>
                </View>
              </Animated.View>
            ))}
            
            {entity.tags.length === 5 && (
              <Pressable style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All Tags</Text>
              </Pressable>
            )}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Pressable onPress={handlePeriodChange} style={styles.periodSelector}>
          <Text style={styles.periodText}>{selectedPeriod.label}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        {renderSummaryCard()}

        {/* Entity cards */}
        <View style={styles.entitySection}>
          {displayedEntities.map((entity, index) => renderEntityCard(entity, index))}
          
          {/* Show all entities button */}
          {hasMoreEntities && !showAllEntities && (
            <Pressable 
              onPress={() => setShowAllEntities(true)}
              style={styles.showAllButton}
            >
              <Text style={styles.showAllText}>
                Show All Entities ({entityStats.length})
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bottomSpacing: {
    height: spacing.xxl
  },
  
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  
  content: {
    flex: 1
  },
  
  entityAmount: {
    ...typography.money,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  
  entityCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.card,
    borderColor: colors.border,
    borderWidth: 1,
    overflow: 'hidden'
  },
  
  entityCardContent: {
    padding: spacing.md
  },
  
  entityCardPressed: {
    backgroundColor: colors.surface,
    transform: [{ scale: 0.98 }]
  },
  
  entityHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  
  entityIndicator: {
    height: 3,
    width: '100%'
  },
  
  entityInfo: {
    flex: 1
  },
  
  entityName: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  
  entitySection: {
    paddingHorizontal: spacing.md
  },
  
  header: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  
  headerTitle: {
    ...typography.title1,
    color: colors.textPrimary
  },
  
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center'
  },
  
  loadingText: {
    ...typography.body,
    color: colors.textSecondary
  },
  
  periodLabel: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600'
  },
  
  periodSelector: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  
  periodText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600'
  },
  
  progressBar: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    height: 8,
    overflow: 'hidden'
  },
  
  progressFill: {
    borderRadius: 4,
    height: '100%'
  },
  
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  
  progressMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  
  progressSection: {
    marginTop: spacing.sm
  },
  
  receiptCount: {
    ...typography.caption,
    color: colors.textSecondary
  },
  
  showAllButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.md
  },
  
  showAllText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600'
  },
  
  summaryAmount: {
    ...typography.money,
    fontSize: 32,
    color: colors.textPrimary,
    marginTop: spacing.sm, // Increase top margin
    marginBottom: spacing.sm, // Add bottom margin
    fontWeight: '700',
    lineHeight: 40 // Explicit line height to prevent clipping
  },
  
  summaryCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
    borderColor: colors.border,
    borderWidth: 1,
    minHeight: 120 // Ensure enough height for content
  },
  
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    textTransform: 'uppercase' // Add bottom margin for proper spacing
  },
  
  summaryMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md
  },
  
  tagAmount: {
    ...typography.number,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  
  tagHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  
  tagItem: {
    marginBottom: spacing.sm
  },
  
  tagName: {
    ...typography.body2,
    color: colors.textPrimary
  },
  
  tagPercentage: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    width: 40
  },
  
  tagProgress: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  
  tagProgressBar: {
    backgroundColor: colors.surface,
    borderRadius: 3,
    flex: 1,
    height: 6,
    overflow: 'hidden'
  },
  
  tagProgressFill: {
    borderRadius: 3,
    height: '100%'
  },
  
  tagSection: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  
  tagSectionHeader: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm
  },
  
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  
  viewAllText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600'
  }
});