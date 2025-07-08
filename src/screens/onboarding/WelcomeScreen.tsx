import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { theme } from '../../styles/theme';
import SnapTrackLogo from '../../components/SnapTrackLogo';

interface WelcomeScreenProps {
  onNext: () => void;
  onSkip: () => void;
  state: any;
}

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cameraAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Start camera demo animation after logo animation
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cameraAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(cameraAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1000);
  }, [fadeAnim, slideAnim, cameraAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SnapTrackLogo size="large" />
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Welcome to SnapTrack</Text>
          <Text style={styles.subtitle}>
            Snap receipts instantly with your camera
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.demoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.cameraDemo}>
            <View style={styles.cameraFrame}>
              <Animated.View
                style={[
                  styles.receiptOverlay,
                  {
                    opacity: cameraAnim,
                    transform: [
                      {
                        scale: cameraAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.receiptMockup}>
                  <Text style={styles.receiptText}>Receipt</Text>
                  <Text style={styles.receiptAmount}>$24.99</Text>
                </View>
              </Animated.View>
              
              <View style={styles.cameraCorners}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.actionSection}>
        <Button
          mode="contained"
          onPress={() => {
            console.log('🎯 Welcome Screen - Get Started button pressed');
            onNext();
          }}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Get Started
        </Button>
        <Text style={styles.secondaryText}>Takes less than 2 minutes</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  demoContainer: {
    alignItems: 'center',
  },
  cameraDemo: {
    width: width * 0.7,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  receiptOverlay: {
    position: 'absolute',
    zIndex: 1,
  },
  receiptMockup: {
    width: 120,
    height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  cameraCorners: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 12,
    left: 12,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 12,
    right: 12,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 12,
    right: 12,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  actionSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  primaryButton: {
    width: width * 0.8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});