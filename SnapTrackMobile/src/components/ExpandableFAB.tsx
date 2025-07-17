import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ExpandableFABProps {
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
  main: '#6B7280'    // Neutral gray
};

export const ExpandableFAB: React.FC<ExpandableFABProps> = ({
  onEdit,
  onPreview,
  onDelete,
  style,
  hasPreview = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Main FAB animations
  const mainFABRotation = useRef(new Animated.Value(0)).current;
  
  // Edit FAB animations
  const editFABScale = useRef(new Animated.Value(0)).current;
  const editFABTranslate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  
  // Preview FAB animations
  const previewFABScale = useRef(new Animated.Value(0)).current;
  const previewFABTranslate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  
  // Delete FAB animations
  const deleteFABScale = useRef(new Animated.Value(0)).current;
  const deleteFABTranslate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const expandFAB = () => {
    setIsExpanded(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Main FAB rotates to X
    Animated.timing(mainFABRotation, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();

    // Create animation array based on available actions
    const animations = [];

    // Edit FAB (always available)
    animations.push(
      Animated.parallel([
        Animated.timing(editFABScale, {
          toValue: 1,
          duration: 250,
          easing: Easing.back(1.2),
          useNativeDriver: true
        }),
        Animated.timing(editFABTranslate, {
          toValue: { x: -80, y: 0 },
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      ])
    );

    // Preview FAB (conditional)
    if (hasPreview && onPreview) {
      animations.push(
        Animated.parallel([
          Animated.timing(previewFABScale, {
            toValue: 1,
            duration: 250,
            easing: Easing.back(1.2),
            useNativeDriver: true
          }),
          Animated.timing(previewFABTranslate, {
            toValue: { x: 0, y: -60 },
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          })
        ])
      );
    }

    // Delete FAB (always available)
    animations.push(
      Animated.parallel([
        Animated.timing(deleteFABScale, {
          toValue: 1,
          duration: 250,
          easing: Easing.back(1.2),
          useNativeDriver: true
        }),
        Animated.timing(deleteFABTranslate, {
          toValue: { x: 80, y: 0 },
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      ])
    );

    // Mini-FABs appear with stagger
    Animated.stagger(50, animations).start();
  };

  const collapseFAB = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // All mini-FABs disappear simultaneously
    Animated.parallel([
      Animated.timing(editFABScale, { 
        toValue: 0, 
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(previewFABScale, { 
        toValue: 0, 
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(deleteFABScale, { 
        toValue: 0, 
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(editFABTranslate, { 
        toValue: { x: 0, y: 0 }, 
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(previewFABTranslate, { 
        toValue: { x: 0, y: 0 }, 
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(deleteFABTranslate, { 
        toValue: { x: 0, y: 0 }, 
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(mainFABRotation, { 
        toValue: 0, 
        duration: 150,
        useNativeDriver: true
      })
    ]).start(() => setIsExpanded(false));
  };

  const handleFABPress = () => {
    // Small delay to distinguish from scroll gestures
    setTimeout(() => {
      if (isExpanded) {
        collapseFAB();
      } else {
        expandFAB();
      }
    }, 50);
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    collapseFAB();
    // Small delay to allow collapse animation to start
    setTimeout(() => {
      onEdit();
    }, 100);
  };

  const handlePreview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    collapseFAB();
    setTimeout(() => {
      onPreview?.();
    }, 100);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    collapseFAB();
    setTimeout(() => {
      onDelete();
    }, 100);
  };

  // Rotation interpolation for main FAB icon
  const rotationInterpolation = mainFABRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });

  return (
    <View style={[styles.container, style]}>
      {/* Mini FABs */}
      
      {/* Edit FAB */}
      <Animated.View
        style={[
          styles.miniFAB,
          { backgroundColor: ACTION_COLORS.edit },
          {
            transform: [
              { translateX: editFABTranslate.x },
              { translateY: editFABTranslate.y },
              { scale: editFABScale }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.miniFABTouchable}
          onPress={handleEdit}
          accessible={true}
          accessibilityLabel="Edit receipt"
          accessibilityRole="button"
        >
          <Ionicons name="pencil" size={18} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Preview FAB (conditional) */}
      {hasPreview && onPreview && (
        <Animated.View
          style={[
            styles.miniFAB,
            { backgroundColor: ACTION_COLORS.preview },
            {
              transform: [
                { translateX: previewFABTranslate.x },
                { translateY: previewFABTranslate.y },
                { scale: previewFABScale }
              ]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.miniFABTouchable}
            onPress={handlePreview}
            accessible={true}
            accessibilityLabel="Preview receipt"
            accessibilityRole="button"
          >
            <Ionicons name="eye" size={18} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Delete FAB */}
      <Animated.View
        style={[
          styles.miniFAB,
          { backgroundColor: ACTION_COLORS.delete },
          {
            transform: [
              { translateX: deleteFABTranslate.x },
              { translateY: deleteFABTranslate.y },
              { scale: deleteFABScale }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.miniFABTouchable}
          onPress={handleDelete}
          accessible={true}
          accessibilityLabel="Delete receipt"
          accessibilityRole="button"
        >
          <Ionicons name="trash" size={18} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB */}
      <TouchableOpacity
        style={[styles.mainFAB, { backgroundColor: ACTION_COLORS.main }]}
        onPress={handleFABPress}
        accessible={true}
        accessibilityLabel={isExpanded ? 'Close actions menu' : 'Open actions menu'}
        accessibilityRole="button"
        accessibilityHint="Double tap to expand or collapse receipt actions"
      >
        <Animated.View
          style={{
            transform: [{ rotate: rotationInterpolation }]
          }}
        >
          <Ionicons 
            name={isExpanded ? 'close' : 'ellipsis-horizontal'} 
            size={20} 
            color="white" 
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    marginLeft: -24, // Half of FAB width to center
    width: 48,
    height: 48
  },
  mainFAB: {
    width: 48,
    height: 48,
    borderRadius: 24,
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0
  },
  miniFAB: {
    width: 40,
    height: 40,
    borderRadius: 20,
    elevation: 6, // Higher shadow when expanded
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    position: 'absolute',
    bottom: 4,
    left: 4 // Changed from right to left since we're centering
  },
  miniFABTouchable: {
    alignItems: 'center',
    borderRadius: 20,
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  }
});