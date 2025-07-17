import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface SnapTrackLogoProps {
  width?: number;
  height?: number;
  size?: string | number; // Support both string sizes like "large" and number sizes
}

export function SnapTrackLogo({ width = 180, height = 60, size }: SnapTrackLogoProps) {
  // Handle string sizes
  let finalWidth = width;
  let finalHeight = height;
  
  if (size === 'large') {
    finalWidth = 240;
    finalHeight = 80;
  } else if (size === 'small') {
    finalWidth = 120;
    finalHeight = 40;
  } else if (typeof size === 'number') {
    finalWidth = size;
    finalHeight = size * 0.33; // Maintain aspect ratio
  }
  return (
    <Image
      source={require('../../assets/snaptrack-logo.png')}
      style={[styles.logo, { width: finalWidth, height: finalHeight }]}
      resizeMode="contain"
      testID="snaptrack-logo"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center'
  }
});

export default SnapTrackLogo;