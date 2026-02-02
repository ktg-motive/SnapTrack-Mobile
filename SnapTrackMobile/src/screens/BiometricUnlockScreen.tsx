/**
 * BiometricUnlockScreen
 *
 * Full-screen lock screen that requires biometric authentication to access the app.
 * After 3 failed attempts, clears tokens and forces full re-login.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors, typography, spacing } from '../styles/theme';
import { biometricService, BiometricCapability } from '../services/biometricService';
import { secureStorageService } from '../services/secureStorageService';
import { appLockService } from '../services/appLockService';
import SnapTrackLogo from '../components/SnapTrackLogo';

interface BiometricUnlockScreenProps {
  onUnlock: () => void;
  onForceLogout: () => void;
}

export default function BiometricUnlockScreen({
  onUnlock,
  onForceLogout
}: BiometricUnlockScreenProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [error, setError] = useState<string | null>(null);

  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    loadCapability();
  }, []);

  useEffect(() => {
    // Auto-prompt biometric on mount
    if (capability?.isAvailable && capability?.isEnrolled) {
      promptBiometric();
    }
  }, [capability]);

  const loadCapability = async () => {
    const cap = await biometricService.checkBiometricCapability();
    setCapability(cap);
  };

  const promptBiometric = useCallback(async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await biometricService.authenticate(
        'Authenticate to unlock SnapTrack'
      );

      if (result.success) {
        // Success - unlock app
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        appLockService.unlockApp();
        onUnlock();
      } else {
        // Failed attempt
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        const newFailedCount = failedAttempts + 1;
        setFailedAttempts(newFailedCount);

        if (result.errorType === 'user_cancel') {
          setError('Authentication cancelled');
        } else if (result.errorType === 'lockout') {
          setError(result.error || 'Biometric locked. Please try again later.');
        } else {
          setError(result.error || 'Authentication failed');
        }

        // Check if max attempts reached
        if (newFailedCount >= MAX_ATTEMPTS) {
          handleMaxAttemptsReached();
        }
      }
    } catch (err: any) {
      console.error('Biometric authentication error:', err);
      setError('An error occurred. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, failedAttempts, onUnlock]);

  const handleMaxAttemptsReached = async () => {
    Alert.alert(
      'Too Many Failed Attempts',
      'For your security, you need to sign in again.',
      [
        {
          text: 'Sign In',
          onPress: async () => {
            // Clear all secure data and force re-login
            await secureStorageService.clearAllSecureData();
            await appLockService.reset();
            biometricService.resetFailedAttempts();
            onForceLogout();
          }
        }
      ],
      { cancelable: false }
    );
  };

  const handleRetry = () => {
    promptBiometric();
  };

  const handleUsePassword = () => {
    Alert.alert(
      'Password Sign In',
      'You will be signed out and can sign in with your email and password.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await secureStorageService.clearAllSecureData();
            await appLockService.reset();
            biometricService.resetFailedAttempts();
            onForceLogout();
          }
        }
      ]
    );
  };

  const attemptsRemaining = MAX_ATTEMPTS - failedAttempts;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <SnapTrackLogo width={180} height={54} />
        </View>

        {/* Lock Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={capability?.biometricType === 'face' ? 'scan-outline' : 'finger-print-outline'}
              size={64}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Title and Description */}
        <Text style={styles.title}>
          {capability?.biometricTypeDisplay || 'Biometric'} Required
        </Text>
        <Text style={styles.description}>
          Use {capability?.biometricTypeDisplay || 'biometric authentication'} to unlock SnapTrack
          and access your financial data.
        </Text>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Attempts Warning */}
        {failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
          <Text style={styles.attemptsText}>
            {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
          </Text>
        )}

        {/* Authenticate Button */}
        <TouchableOpacity
          style={[styles.authenticateButton, isAuthenticating && styles.buttonDisabled]}
          onPress={handleRetry}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons
                name={capability?.biometricType === 'face' ? 'scan' : 'finger-print'}
                size={24}
                color="#ffffff"
                style={styles.buttonIcon}
              />
              <Text style={styles.authenticateButtonText}>
                Use {capability?.biometricTypeDisplay || 'Biometric'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Use Password Link */}
        <TouchableOpacity
          style={styles.passwordLink}
          onPress={handleUsePassword}
        >
          <Text style={styles.passwordLinkText}>
            Sign in with email instead
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoContainer: {
    marginBottom: spacing.xxl
  },
  iconContainer: {
    marginBottom: spacing.xl
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryContainer || colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    ...typography.title2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginLeft: spacing.sm
  },
  attemptsText: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md
  },
  authenticateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 28,
    width: '100%',
    marginBottom: spacing.lg
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonIcon: {
    marginRight: spacing.sm
  },
  authenticateButtonText: {
    ...typography.body,
    color: '#ffffff',
    fontWeight: '600'
  },
  passwordLink: {
    paddingVertical: spacing.md
  },
  passwordLinkText: {
    ...typography.body,
    color: colors.textSecondary
  }
});
