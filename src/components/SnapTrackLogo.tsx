import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface SnapTrackLogoProps {
  width?: number;
  height?: number;
}

export default function SnapTrackLogo({ width = 180, height = 60 }: SnapTrackLogoProps) {
  return (
    <Image
      source={require('../../assets/snaptrack-logo.png')}
      style={[styles.logo, { width, height }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});