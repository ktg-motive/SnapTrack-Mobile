import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { 
  runOnJS, 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Receipt } from '../types';
import { ReceiptCard } from './ReceiptCard';
import { theme } from '../styles/theme';

interface SwipeableReceiptCardProps {
  receipt: Receipt;
  onUpdate?: (updatedReceipt: Receipt) => void;
  onDelete?: (receiptId: string) => void;
  onEdit?: (receipt: Receipt) => void;
  onPreview?: (receipt: Receipt) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHORT_SWIPE_THRESHOLD = 75; // Short swipe for edit/preview
const LONG_SWIPE_THRESHOLD = 150; // Long swipe for delete
const SWIPE_ACTIVATION_THRESHOLD = 50; // Minimum swipe to show actions

// Swipe action colors based on user preferences
const SWIPE_COLORS = {
  edit: '#1C65C9',
  preview: '#019C89',
  delete: '#FF3B30'
};

export const SwipeableReceiptCard: React.FC<SwipeableReceiptCardProps> = ({
  receipt,
  onUpdate,
  onDelete,
  onEdit,
  onPreview
}) => {
  const translateX = useSharedValue(0);
  const panRef = useRef(null);

  // Handle swipe actions
  const triggerHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleEdit = () => {
    triggerHapticFeedback();
    onEdit?.(receipt);
  };

  const handlePreview = () => {
    triggerHapticFeedback();
    onPreview?.(receipt);
  };

  const handleDelete = () => {
    triggerHapticFeedback();
    onDelete?.(receipt.id);
  };

  // Gesture handler for swipe actions
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      // Light haptic feedback on swipe start
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    },
    onActive: (event) => {
      const { translationX } = event;
      
      // Constrain swipe within reasonable bounds
      if (translationX > LONG_SWIPE_THRESHOLD) {
        translateX.value = LONG_SWIPE_THRESHOLD;
      } else if (translationX < -LONG_SWIPE_THRESHOLD) {
        translateX.value = -LONG_SWIPE_THRESHOLD;
      } else {
        translateX.value = translationX;
      }
    },
    onEnd: (event) => {
      const { translationX, velocityX } = event;
      const absTranslationX = Math.abs(translationX);
      
      // Determine if swipe was significant enough to trigger action
      if (absTranslationX < SWIPE_ACTIVATION_THRESHOLD && Math.abs(velocityX) < 500) {
        // Not enough swipe, snap back to center
        translateX.value = withSpring(0);
        return;
      }

      // Right to left swipe (negative translation)
      if (translationX < 0) {
        if (absTranslationX >= LONG_SWIPE_THRESHOLD || velocityX < -1000) {
          // Long swipe or fast velocity - trigger delete
          runOnJS(handleDelete)();
        } else if (absTranslationX >= SHORT_SWIPE_THRESHOLD || velocityX < -500) {
          // Short swipe - trigger edit (primary action)
          runOnJS(handleEdit)();
        }
      }
      // Left to right swipe (positive translation)  
      else if (translationX > 0) {
        if (absTranslationX >= LONG_SWIPE_THRESHOLD || velocityX > 1000) {
          // Long swipe - trigger delete
          runOnJS(handleDelete)();
        } else if (absTranslationX >= SHORT_SWIPE_THRESHOLD || velocityX > 500) {
          // Short swipe - trigger preview if available, otherwise edit
          if (receipt.receipt_url) {
            runOnJS(handlePreview)();
          } else {
            runOnJS(handleEdit)();
          }
        }
      }

      // Snap back to center
      translateX.value = withSpring(0);
    }
  });

  // Animated style for the card
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }]
    };
  });

  // Animated styles for action backgrounds
  const leftActionAnimatedStyle = useAnimatedStyle(() => {
    const opacity = translateX.value < -SWIPE_ACTIVATION_THRESHOLD ? 1 : 0;
    const scale = translateX.value < -SHORT_SWIPE_THRESHOLD ? 1 : 0.8;
    return {
      opacity,
      transform: [{ scale }]
    };
  });

  const rightActionAnimatedStyle = useAnimatedStyle(() => {
    const opacity = translateX.value > SWIPE_ACTIVATION_THRESHOLD ? 1 : 0;
    const scale = translateX.value > SHORT_SWIPE_THRESHOLD ? 1 : 0.8;
    return {
      opacity,
      transform: [{ scale }]
    };
  });

  // Determine action colors based on swipe distance
  const leftActionStyle = useAnimatedStyle(() => {
    const isDelete = translateX.value <= -LONG_SWIPE_THRESHOLD;
    const backgroundColor = isDelete ? SWIPE_COLORS.delete : SWIPE_COLORS.edit;
    return { backgroundColor };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    const isDelete = translateX.value >= LONG_SWIPE_THRESHOLD;
    if (isDelete) {
      return { backgroundColor: SWIPE_COLORS.delete };
    }
    const backgroundColor = receipt.receipt_url ? SWIPE_COLORS.preview : SWIPE_COLORS.edit;
    return { backgroundColor };
  });

  return (
    <View style={styles.container}>
      {/* Left Action Background (visible when swiping right to left) */}
      <Animated.View style={[
        styles.actionContainer, 
        styles.leftActions, 
        leftActionAnimatedStyle,
        leftActionStyle
      ]}>
        <Ionicons name="pencil" size={24} color="white" />
        <Text style={styles.actionText}>Edit</Text>
      </Animated.View>

      {/* Right Action Background (visible when swiping left to right) */}
      <Animated.View style={[
        styles.actionContainer, 
        styles.rightActions, 
        rightActionAnimatedStyle,
        rightActionStyle
      ]}>
        <Ionicons 
          name={receipt.receipt_url ? 'eye' : 'pencil'} 
          size={24} 
          color="white" 
        />
        <Text style={styles.actionText}>
          {receipt.receipt_url ? 'Preview' : 'Edit'}
        </Text>
      </Animated.View>

      {/* Swipeable Card */}
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={gestureHandler}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-5, 5]}
      >
        <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
          <ReceiptCard
            receipt={receipt}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    alignItems: 'center',
    bottom: theme.spacing.xs,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    position: 'absolute',
    top: theme.spacing.xs,
    width: LONG_SWIPE_THRESHOLD
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
    textAlign: 'center'
  },
  cardContainer: {
    backgroundColor: 'transparent',
    zIndex: 1
  },
  container: {
    backgroundColor: 'transparent',
    position: 'relative'
  },
  leftActions: {
    borderBottomRightRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    left: theme.spacing.sm
  },
  rightActions: {
    borderBottomLeftRadius: theme.borderRadius.md,
    borderTopLeftRadius: theme.borderRadius.md,
    right: theme.spacing.sm
  }
});