import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface SkipButtonProps {
  visible: boolean;
  onPress: () => void;
}

export default function SkipButton({ visible, onPress }: SkipButtonProps) {
  if (!visible) return null;
  
  return (
    <TouchableOpacity 
      style={styles.skipButton}
      onPress={() => {
        console.log('🔍 SkipButton touch detected');
        onPress();
      }}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      activeOpacity={0.7}
    >
      <Text style={styles.skipText}>Skip</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: theme.colors.outline,
    borderRadius: 25,
    borderWidth: 1,
    bottom: 100,
    elevation: 3,
    left: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000
  },
  skipText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600'
  }
});