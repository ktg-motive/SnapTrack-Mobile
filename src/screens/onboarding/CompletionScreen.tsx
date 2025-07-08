import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { Button } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface CompletionScreenProps {
  onComplete: () => void;
  state: any;
}

const { width } = Dimensions.get('window');

export default function CompletionScreen({ onComplete }: CompletionScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const stepsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Trigger success haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Start celebration animation sequence
    startCelebrationAnimation();
  }, []);

  const startCelebrationAnimation = () => {
    // Main container fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Checkmark scale animation
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Checkmark fill animation
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animation
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Steps summary animation
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(stepsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const steps = [
    { icon: 'camera-alt', text: 'Snap', description: 'Capture receipts with your camera' },
    { icon: 'psychology', text: 'Review', description: 'AI validates and enhances data' },
    { icon: 'label', text: 'Organize', description: 'Tag and categorize expenses' },
  ];

  const renderConfetti = () => {
    const confettiPieces = Array.from({ length: 12 }, (_, index) => {
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
      const color = colors[index % colors.length];
      
      // Center the confetti pieces across the screen
      const totalPieces = 12;
      const spacing = 80 / totalPieces; // Use 80% of screen width
      const leftPosition = 10 + (index * spacing); // Start at 10% and spread evenly
      
      return (
        <Animated.View
          key={index}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: color,
              left: `${leftPosition}%`,
              opacity: confettiAnim,
              transform: [
                {
                  translateY: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-46, 204], // Moved down 4px
                  }),
                },
                {
                  rotate: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${360 * (index % 2 === 0 ? 1 : -1)}deg`],
                  }),
                },
              ],
            },
          ]}
        />
      );
    });

    return <View style={styles.confettiContainer}>{confettiPieces}</View>;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderConfetti()}
      
      <View style={styles.celebrationSection}>
        <Animated.View
          style={[
            styles.checkmarkContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.checkmarkCircle}>
            <Animated.View
              style={[
                styles.checkmarkFill,
                {
                  opacity: checkmarkAnim,
                  transform: [
                    {
                      scale: checkmarkAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Icon name="check" size={48} color="#fff" style={styles.checkmarkIcon} />
          </View>
        </Animated.View>

        <Text style={styles.title}>You're ready to go!</Text>
        <Text style={styles.subtitle}>
          Welcome to SnapTrack! You're all set to start tracking expenses like a pro.
        </Text>

        <Animated.View
          style={[
            styles.stepsSummary,
            {
              opacity: stepsAnim,
              transform: [
                {
                  translateY: stepsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.stepsTitle}>Your workflow:</Text>
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepIconContainer}>
                  <Icon name={step.icon} size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{step.text}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
                {index < steps.length - 1 && (
                  <Icon 
                    name="arrow-forward" 
                    size={16} 
                    color={theme.colors.onSurfaceVariant} 
                    style={styles.stepArrow}
                  />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.featuresHighlight}>
          <View style={styles.feature}>
            <Icon name="email" size={20} color={theme.colors.primary} />
            <Text style={styles.featureText}>Email receipts to your personal address</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="auto-awesome" size={20} color={theme.colors.primary} />
            <Text style={styles.featureText}>AI-powered data extraction and validation</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="cloud-sync" size={20} color={theme.colors.primary} />
            <Text style={styles.featureText}>Sync across all your devices</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionSection}>
        <Button
          mode="contained"
          onPress={() => {
            console.log('🚀 Completion Screen - Start Snapping Receipts button pressed');
            onComplete();
          }}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon="camera"
        >
          Start Snapping Receipts!
        </Button>
        <Text style={styles.helpText}>
          Access settings anytime for help and tutorials
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  celebrationSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  checkmarkContainer: {
    marginBottom: 32,
  },
  checkmarkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  checkmarkFill: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.primary,
  },
  checkmarkIcon: {
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  stepsSummary: {
    width: '100%',
    marginBottom: 32,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 16,
  },
  stepArrow: {
    position: 'absolute',
    right: -12,
    top: 16,
  },
  featuresHighlight: {
    width: '100%',
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
  actionSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  primaryButton: {
    width: width * 0.8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});