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
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();

    // Start camera demo animation after logo animation
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cameraAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true
          }),
          Animated.timing(cameraAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true
          })
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
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <SnapTrackLogo size="large" />
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
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
              transform: [{ translateY: slideAnim }]
            }
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
                          outputRange: [0.8, 1]
                        })
                      }
                    ]
                  }
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
  actionSection: {
    alignItems: 'center',
    paddingTop: 40
  },
  bottomLeft: {
    borderRightWidth: 0,
    borderTopWidth: 0,
    bottom: 12,
    left: 12
  },
  bottomRight: {
    borderLeftWidth: 0,
    borderTopWidth: 0,
    bottom: 12,
    right: 12
  },
  buttonContent: {
    paddingVertical: 8
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600'
  },
  cameraCorners: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  cameraDemo: {
    alignItems: 'center',
    height: 200,
    justifyContent: 'center',
    width: width * 0.7
  },
  cameraFrame: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
    width: '100%'
  },
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  corner: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
    height: 20,
    position: 'absolute',
    width: 20
  },
  demoContainer: {
    alignItems: 'center'
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40
  },
  logoContainer: {
    marginBottom: 24
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginBottom: 16,
    width: width * 0.8
  },
  receiptAmount: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold'
  },
  receiptMockup: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
    height: 80,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 120
  },
  receiptOverlay: {
    position: 'absolute',
    zIndex: 1
  },
  receiptText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4
  },
  secondaryText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center'
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center'
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    color: theme.colors.onBackground,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  topLeft: {
    borderBottomWidth: 0,
    borderRightWidth: 0,
    left: 12,
    top: 12
  },
  topRight: {
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    right: 12,
    top: 12
  }
});