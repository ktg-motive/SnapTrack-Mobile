import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../styles/theme';

interface UserAvatarProps {
  name: string;
  size?: number;
}

export default function UserAvatar({ name, size = 32 }: UserAvatarProps) {
  // Get first initial, fallback to 'U' if no name
  const initial = name?.charAt(0)?.toUpperCase() || 'U';
  
  // Generate consistent color based on first letter
  const getAvatarColor = (letter: string) => {
    const colorOptions = [
      colors.primary,
      colors.secondary,
      colors.neonBlue,
      colors.neonPurple,
      colors.success
    ];
    
    const charCode = letter.charCodeAt(0);
    return colorOptions[charCode % colorOptions.length];
  };

  const avatarColor = getAvatarColor(initial);
  
  return (
    <View 
      style={[
        styles.avatar, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: avatarColor 
        }
      ]}
    >
      <Text 
        style={[
          styles.initial, 
          { fontSize: size * 0.4 }
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    elevation: 2,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  initial: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center'
  }
});