import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  ViewStyle,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

interface SlideOutActionsProps {
  onEdit: () => void;
  onPreview?: () => void;
  onDelete: () => void;
  style?: ViewStyle;
  hasPreview?: boolean;
}

const ACTION_COLORS = {
  edit: '#8E8E93',    // Soft gray
  preview: '#AEAEB2', // Warm gray
  delete: '#D70015',  // Muted red
  dots: '#C7C7CC'    // Light gray for dots
};

export const SlideOutActions: React.FC<SlideOutActionsProps> = ({
  onEdit,
  onPreview,
  onDelete,
  style,
  hasPreview = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation values
  const actionsTranslate = useRef(new Animated.Value(0)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;

  const expandActions = () => {
    setIsExpanded(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.timing(actionsTranslate, {
        toValue: -60, // Much shorter slide - stay close to dots
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(actionsOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      })
    ]).start();
  };

  const collapseActions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.timing(actionsTranslate, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(actionsOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      })
    ]).start(() => setIsExpanded(false));
  };

  const handleDotsPress = () => {
    if (isExpanded) {
      collapseActions();
    } else {
      expandActions();
    }
  };

  const handleEdit = () => {
    collapseActions();
    setTimeout(() => {
      onEdit();
    }, 100);
  };

  const handlePreview = () => {
    collapseActions();
    setTimeout(() => {
      onPreview?.();
    }, 100);
  };

  const handleDelete = () => {
    collapseActions();
    setTimeout(() => {
      Alert.alert(
        'Delete Receipt',
        'Are you sure you want to delete this receipt? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => onDelete()
          }
        ]
      );
    }, 100);
  };

  // Calculate number of actions for proper spacing
  const actionCount = hasPreview ? 3 : 2;
  const actionWidth = 44; // Increased for better touch targets
  const actionSpacing = 6; // Slightly reduced spacing
  const totalActionsWidth = (actionCount * actionWidth) + ((actionCount - 1) * actionSpacing);

  return (
    <View style={[styles.container, style]}>
      {/* Action Buttons (slide out to the left) */}
      <Animated.View
        style={[
          styles.actionsContainer,
          {
            width: totalActionsWidth,
            transform: [{ translateX: actionsTranslate }],
            opacity: actionsOpacity
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: ACTION_COLORS.edit }]}
          onPress={handleEdit}
          accessible={true}
          accessibilityLabel="Edit receipt"
          accessibilityRole="button"
        >
          <Ionicons name="pencil" size={20} color="white" />
        </TouchableOpacity>

        {hasPreview && onPreview && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: ACTION_COLORS.preview }]}
            onPress={handlePreview}
            accessible={true}
            accessibilityLabel="Preview receipt"
            accessibilityRole="button"
          >
            <Ionicons name="eye" size={20} color="white" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: ACTION_COLORS.delete }]}
          onPress={handleDelete}
          accessible={true}
          accessibilityLabel="Delete receipt"
          accessibilityRole="button"
        >
          <Ionicons name="trash" size={20} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Three Dots Trigger */}
      <TouchableOpacity
        style={styles.dotsContainer}
        onPress={handleDotsPress}
        accessible={true}
        accessibilityLabel={isExpanded ? 'Hide actions' : 'Show actions'}
        accessibilityRole="button"
        accessibilityHint="Tap to reveal receipt actions"
      >
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: ACTION_COLORS.dots }]} />
          <View style={[styles.dot, { backgroundColor: ACTION_COLORS.dots }]} />
          <View style={[styles.dot, { backgroundColor: ACTION_COLORS.dots }]} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    width: 44, // Increased for better touch targets
    height: 36, // Increased height
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
    elevation: 2,
    shadowOpacity: 0.15,
    shadowRadius: 2
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    right: 40, // Closer to dots
    top: -2, // Slight vertical adjustment for better alignment
    justifyContent: 'flex-end'
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 32,
    justifyContent: 'flex-end',
    position: 'relative'
  },
  dot: {
    borderRadius: 2,
    height: 4,
    width: 4
  },
  dotsContainer: {
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    height: 32,
    justifyContent: 'center',
    width: 36
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  }
});