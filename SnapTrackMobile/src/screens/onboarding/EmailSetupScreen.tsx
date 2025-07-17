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
      useNativeDriver: true
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
          useNativeDriver: true
        }),
        Animated.timing(copyFeedbackAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true
        })
      ]).start();

      // Reset copied state
      setTimeout(() => setEmailCopied(false), 2200);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy email address');
    }
  };

  const emailApps = [
    { name: 'Gmail', icon: 'email' as keyof typeof Icon.glyphMap, color: '#DB4437' },
    { name: 'Outlook', icon: 'email' as keyof typeof Icon.glyphMap, color: '#0078D4' },
    { name: 'Apple Mail', icon: 'email' as keyof typeof Icon.glyphMap, color: '#007AFF' }
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
                    outputRange: [10, 0]
                  })
                }
              ]
            }
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
  actionSection: {
    alignItems: 'center',
    paddingTop: 20
  },
  appIcon: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  appName: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '500'
  },
  benefit: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  benefitText: {
    color: theme.colors.onSurfaceVariant,
    flex: 1,
    fontSize: 16
  },
  benefitsSection: {
    gap: 16
  },
  buttonContent: {
    paddingVertical: 8
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600'
  },
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  contentSection: {
    flex: 1,
    paddingTop: 20
  },
  copyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8
  },
  copyButtonContent: {
    paddingHorizontal: 8
  },
  copyFeedback: {
    alignItems: 'center',
    marginBottom: 16
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center'
  },
  emailApp: {
    alignItems: 'center',
    gap: 8
  },
  emailApps: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  emailCard: {
    backgroundColor: '#f8f9fa',
    elevation: 2,
    marginBottom: 16
  },
  emailCardContent: {
    paddingVertical: 20
  },
  emailDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  emailText: {
    color: theme.colors.primary,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  exampleSection: {
    marginBottom: 32
  },
  feedbackContainer: {
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  feedbackText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500'
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: width * 0.8
  },
  sectionTitle: {
    color: theme.colors.onBackground,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center'
  },
  title: {
    color: theme.colors.onBackground,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center'
  }
});