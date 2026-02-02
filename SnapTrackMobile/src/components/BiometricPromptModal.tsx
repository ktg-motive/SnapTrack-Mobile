/**
 * BiometricPromptModal Component
 *
 * Modal that appears after first login to encourage users to enable
 * biometric authentication for their security.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { colors, typography, spacing } from '../styles/theme';
import { BiometricCapability } from '../services/biometricService';

interface BiometricPromptModalProps {
  visible: boolean;
  capability: BiometricCapability | null;
  onEnable: () => Promise<boolean>;
  onSkip: () => void;
  onClose: () => void;
}

export default function BiometricPromptModal({
  visible,
  capability,
  onEnable,
  onSkip,
  onClose
}: BiometricPromptModalProps) {
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnable = async () => {
    setIsEnabling(true);
    setError(null);

    try {
      const success = await onEnable();

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } else {
        setError('Failed to enable. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  if (!capability?.isAvailable || !capability?.isEnrolled) {
    return null;
  }

  const biometricName = capability.biometricTypeDisplay;
  const isFaceID = capability.biometricType === 'face';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={isFaceID ? 'scan-outline' : 'finger-print-outline'}
                size={48}
                color={colors.primary}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Secure Your Account
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            Enable {biometricName} to quickly and securely unlock SnapTrack.
            Your financial data will be protected even if your phone is lost or stolen.
          </Text>

          {/* Benefits List */}
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text style={styles.benefitText}>Hardware-level security</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="flash" size={20} color={colors.success} />
              <Text style={styles.benefitText}>Instant access</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="eye-off" size={20} color={colors.success} />
              <Text style={styles.benefitText}>Privacy protection</Text>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.enableButton, isEnabling && styles.buttonDisabled]}
              onPress={handleEnable}
              disabled={isEnabling}
            >
              {isEnabling ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons
                    name={isFaceID ? 'scan' : 'finger-print'}
                    size={20}
                    color="#ffffff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.enableButtonText}>
                    Enable {biometricName}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isEnabling}
            >
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center'
  },
  iconContainer: {
    marginBottom: spacing.lg
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    marginBottom: spacing.lg,
    lineHeight: 22
  },
  benefitsList: {
    width: '100%',
    marginBottom: spacing.lg
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  benefitText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm
  },
  errorContainer: {
    backgroundColor: colors.error + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    width: '100%'
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center'
  },
  buttonContainer: {
    width: '100%'
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 28,
    marginBottom: spacing.sm
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonIcon: {
    marginRight: spacing.sm
  },
  enableButtonText: {
    ...typography.body,
    color: '#ffffff',
    fontWeight: '600'
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center'
  },
  skipButtonText: {
    ...typography.body,
    color: colors.textSecondary
  }
});
