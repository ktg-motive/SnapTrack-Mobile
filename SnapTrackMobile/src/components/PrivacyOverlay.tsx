/**
 * PrivacyOverlay Component
 *
 * Displays a blurred overlay when the app is backgrounded to protect
 * sensitive financial data from being visible in the app switcher.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Animated,
  Text
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, typography, spacing } from '../styles/theme';
import SnapTrackLogo from './SnapTrackLogo';

interface PrivacyOverlayProps {
  visible: boolean;
}

export default function PrivacyOverlay({ visible }: PrivacyOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        // iOS: Use native blur
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={100}
          tint="light"
        >
          <View style={styles.content}>
            <SnapTrackLogo width={160} height={48} />
          </View>
        </BlurView>
      ) : (
        // Android: Use solid background (blur not well supported)
        <View style={styles.solidOverlay}>
          <View style={styles.content}>
            <SnapTrackLogo width={160} height={48} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999
  },
  solidOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
