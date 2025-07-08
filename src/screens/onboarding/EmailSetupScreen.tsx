import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Alert } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { Clipboard } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface EmailSetupScreenProps {
  onNext: () => void;
  state: any;
}

const { width } = Dimensions.get('window');

export default function EmailSetupScreen({ onNext, state }: EmailSetupScreenProps) {
  const [emailCopied, setEmailCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const copyFeedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleCopyEmail = async () => {
    try {
      await Clipboard.setString(state.userEmail);
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Visual feedback
      setEmailCopied(true);
      Animated.sequence([
        Animated.timing(copyFeedbackAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(copyFeedbackAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();

      // Reset copied state
      setTimeout(() => setEmailCopied(false), 2200);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy email address');
    }
  };

  const emailApps = [
    { name: 'Gmail', icon: 'email', color: '#DB4437' },
    { name: 'Outlook', icon: 'email', color: '#0078D4' },
    { name: 'Apple Mail', icon: 'email', color: '#007AFF' },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.contentSection}>
        <Text style={styles.title}>Your Personal Receipt Email</Text>
        
        <Card style={styles.emailCard}>
          <Card.Content style={styles.emailCardContent}>
            <View style={styles.emailDisplay}>
              <Text style={styles.emailText}>{state.userEmail}</Text>
              <Button
                mode="contained"
                onPress={handleCopyEmail}
                style={styles.copyButton}
                contentStyle={styles.copyButtonContent}
                icon="content-copy"
                compact
              >
                {emailCopied ? 'Copied!' : 'Copy'}
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Animated.View
          style={[
            styles.copyFeedback,
            {
              opacity: copyFeedbackAnim,
              transform: [
                {
                  translateY: copyFeedbackAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.feedbackContainer}>
            <Icon name="check-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.feedbackText}>Email copied to clipboard!</Text>
          </View>
        </Animated.View>

        <Text style={styles.description}>
          Email receipts here from anywhere - stores, restaurants, gas stations
        </Text>

        <View style={styles.exampleSection}>
          <Text style={styles.sectionTitle}>Works with all email apps:</Text>
          <View style={styles.emailApps}>
            {emailApps.map((app, index) => (
              <View key={index} style={styles.emailApp}>
                <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                  <Icon name={app.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.appName}>{app.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.benefitsSection}>
          <View style={styles.benefit}>
            <Icon name="auto-awesome" size={20} color={theme.colors.primary} />
            <Text style={styles.benefitText}>Automatic receipt processing</Text>
          </View>
          <View style={styles.benefit}>
            <Icon name="cloud-sync" size={20} color={theme.colors.primary} />
            <Text style={styles.benefitText}>Instant sync across devices</Text>
          </View>
          <View style={styles.benefit}>
            <Icon name="security" size={20} color={theme.colors.primary} />
            <Text style={styles.benefitText}>Secure and private</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionSection}>
        <Button
          mode="contained"
          onPress={onNext}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Continue
        </Button>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentSection: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 32,
  },
  emailCard: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    elevation: 2,
  },
  emailCardContent: {
    paddingVertical: 20,
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  emailText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  copyButtonContent: {
    paddingHorizontal: 8,
  },
  copyFeedback: {
    marginBottom: 16,
    alignItems: 'center',
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exampleSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 16,
  },
  emailApps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  emailApp: {
    alignItems: 'center',
    gap: 8,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  benefitsSection: {
    gap: 16,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
  actionSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  primaryButton: {
    width: width * 0.8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});