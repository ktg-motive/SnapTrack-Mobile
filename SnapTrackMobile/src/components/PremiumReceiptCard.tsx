import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Receipt } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface PremiumReceiptCardProps {
  receipt: Receipt;
  onPress?: (receipt: Receipt) => void;
  onEdit?: (receipt: Receipt) => void;
  onDelete?: (receiptId: string) => void;
  onPreview?: (receipt: Receipt) => void;
}

// Entity color mapping based on design specs
const getEntityColor = (entity: string) => {
  const entityColors = {
    'motive-ai': {
      primary: '#1e3a8a',                    // Navy blue
      background: 'rgba(30, 58, 138, 0.08)', // Navy with opacity
      border: 'rgba(30, 58, 138, 0.2)'      // Navy border
    },
    'personal': {
      primary: colors.primary,               // Teal
      background: colors.primaryContainer,   // Teal with opacity
      border: `${colors.primary}33`         // Teal border
    },
    // Add other entities as needed
    default: {
      primary: colors.textSecondary,
      background: colors.surface,
      border: colors.border
    }
  };

  return entityColors[entity as keyof typeof entityColors] || entityColors.default;
};

export const PremiumReceiptCard: React.FC<PremiumReceiptCardProps> = ({
  receipt,
  onPress,
  onEdit,
  onDelete,
  onPreview
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const pressedScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = async () => {
    setIsPressed(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.spring(pressedScale, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    
    Animated.spring(pressedScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10
    }).start();
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.(receipt);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const entityColor = getEntityColor(receipt.entity || 'default');

  return (
    <View style={styles.cardContainer}>
      <Animated.View style={[
        styles.card,
        { transform: [{ scale: pressedScale }] }
      ]}>
        {/* Entity color indicator */}
        <View style={[
          styles.entityIndicator, 
          { backgroundColor: entityColor.primary }
        ]} />
        
        <Pressable 
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardContent}
        >
          {/* Header Row: Vendor and Amount */}
          <View style={styles.headerRow}>
            <Text style={styles.vendor} numberOfLines={1}>
              {receipt.vendor || 'Unknown Vendor'}
            </Text>
            <Text style={styles.amount}>
              ${receipt.amount?.toFixed(2) || '0.00'}
            </Text>
          </View>
          
          {/* Metadata Row: Entity badge and date */}
          <View style={styles.metadataRow}>
            <View style={styles.entityBadge}>
              <View style={[
                styles.entityDot, 
                { backgroundColor: entityColor.primary }
              ]} />
              <Text style={styles.entityText}>
                {receipt.entity || 'No Entity'}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {formatDate(receipt.date)}
            </Text>
          </View>
          
          {/* Tags row if present */}
          {receipt.tags && receipt.tags.length > 0 && (
            <View style={styles.tagsRow}>
              <View style={styles.tagsContainer}>
                {receipt.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {String(tag)}
                    </Text>
                  </View>
                ))}
                {receipt.tags.length > 3 && (
                  <View style={styles.tagCount}>
                    <Text style={styles.tagCountText}>
                      +{receipt.tags.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Notes if present */}
          {receipt.notes && (
            <View style={styles.notesRow}>
              <Text style={styles.notesText} numberOfLines={2}>
                {receipt.notes}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,         // Primary teal
    fontFamily: typography.money.fontFamily
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,              // Increased from 12
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    // Enhanced shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8
      },
      android: {
        elevation: 3
      }
    })
  },
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8
  },
  cardContent: {
    padding: 16
  },
  dateText: {
    color: colors.textSecondary,
    fontFamily: typography.caption.fontFamily,
    fontSize: 13
  },
  entityBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  entityDot: {
    borderRadius: 3,
    height: 6,
    marginRight: 6,
    width: 6
  },
  entityIndicator: {
    height: 3,                     // Colored bar at top
    width: '100%'
  },
  entityText: {
    color: colors.textSecondary,
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '500'
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  metadataRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  notesRow: {
    marginTop: 4
  },
  notesText: {
    color: colors.textSecondary,
    fontFamily: typography.body2.fontFamily,
    fontSize: 14,
    lineHeight: 18
  },
  tag: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 8,
    marginBottom: 4,
    marginRight: 6,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  tagCount: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3
  },
  tagCountText: {
    color: colors.textSecondary,
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '500'
  },
  tagText: {
    color: colors.onSecondaryContainer,
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '500'
  },
  tagsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  tagsRow: {
    marginBottom: 8
  },
  vendor: {
    fontSize: 20,                  // Larger, more prominent
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 16,
    fontFamily: typography.title3.fontFamily
  }
});