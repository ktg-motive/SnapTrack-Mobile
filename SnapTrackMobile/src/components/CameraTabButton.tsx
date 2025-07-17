import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CameraTabButtonProps {
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityState?: any;
  children?: React.ReactNode;
  [key: string]: any; // Allow other React Navigation props
}

export const CameraTabButton: React.FC<CameraTabButtonProps> = ({ 
  onPress, 
  accessibilityState,
  ...otherProps
}) => {
  const handlePress = (e: GestureResponderEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPress) {
      onPress(e);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Capture Receipt"
      accessibilityHint="Double tap to open camera and capture a receipt"
      accessibilityState={accessibilityState}
    >
      <LinearGradient
        colors={['#02B2B3', '#069196']}
        style={styles.button}
      >
        <Ionicons name="camera" size={28} color="white" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: '#fff',
    borderRadius: 32,
    borderWidth: 4,
    height: 64,
    justifyContent: 'center',
    width: 64
  },
  container: {
    position: 'absolute',
    top: -20, // Protrudes above tab bar
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8
  }
});