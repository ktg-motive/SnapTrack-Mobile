import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { apiClient } from '../../services/apiClient';

interface EmailCollectionScreenProps {
  onNext: (emailAdded: boolean) => void;
  onSkip: () => void;
}

export const EmailCollectionScreen: React.FC<EmailCollectionScreenProps> = ({
  onNext,
  onSkip
}) => {
  const [email, setEmail] = useState('');
  const [purposes, setPurposes] = useState({
    receipts: true,
    notifications: true,
    marketing: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!email) {
      // User choosing to skip
      onSkip();
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Add email to user account
      await apiClient.post('/api/user/emails', {
        email,
        opted_in_transactional: purposes.receipts || purposes.notifications,
        opted_in_marketing: purposes.marketing
      });

      // Send verification email
      await apiClient.post('/api/user/emails/send-verification', { email });

      Alert.alert(
        'Verification Email Sent',
        'Check your inbox and click the verification link to activate email features.',
        [{ text: 'OK', onPress: () => onNext(true) }]
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add email. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePurpose = (purpose: keyof typeof purposes) => {
    setPurposes(prev => ({
      ...prev,
      [purpose]: !prev[purpose]
    }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Email for Notifications</Text>
          <Text style={styles.subtitle}>
            Optional: Add an email to receive notifications and forward receipts.
            You can always add this later in settings.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            placeholder="your@email.com (optional)"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {email ? (
            <View style={styles.purposes}>
              <Text style={styles.purposesLabel}>I want to use my email for:</Text>
              
              <TouchableOpacity
                style={styles.purposeItem}
                onPress={() => togglePurpose('receipts')}
              >
                <Ionicons
                  name={purposes.receipts ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={purposes.receipts ? theme.colors.primary : '#9ca3af'}
                />
                <View style={styles.purposeContent}>
                  <View style={styles.purposeHeader}>
                    <Ionicons name="document-text-outline" size={16} color="#6b7280" />
                    <Text style={styles.purposeTitle}>Receipt Forwarding</Text>
                  </View>
                  <Text style={styles.purposeDescription}>
                    Forward receipt emails to process automatically
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.purposeItem}
                onPress={() => togglePurpose('notifications')}
              >
                <Ionicons
                  name={purposes.notifications ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={purposes.notifications ? theme.colors.primary : '#9ca3af'}
                />
                <View style={styles.purposeContent}>
                  <View style={styles.purposeHeader}>
                    <Ionicons name="notifications-outline" size={16} color="#6b7280" />
                    <Text style={styles.purposeTitle}>Notifications</Text>
                  </View>
                  <Text style={styles.purposeDescription}>
                    Receipt processing confirmations and account updates
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.purposeItem}
                onPress={() => togglePurpose('marketing')}
              >
                <Ionicons
                  name={purposes.marketing ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={purposes.marketing ? theme.colors.primary : '#9ca3af'}
                />
                <View style={styles.purposeContent}>
                  <View style={styles.purposeHeader}>
                    <Ionicons name="mail-outline" size={16} color="#6b7280" />
                    <Text style={styles.purposeTitle}>Product Updates</Text>
                  </View>
                  <Text style={styles.purposeDescription}>
                    New features and tips (max 1 per month)
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {!email && (
          <View style={styles.howItWorks}>
            <Text style={styles.howItWorksTitle}>Why Add Email?</Text>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Forward receipts for automatic processing</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Get notifications when receipts are processed</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Access your unique receipt forwarding address</Text>
            </View>
          </View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.continueButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>
                {email ? 'Add Email' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          You can use SnapTrack without providing an email
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  purposes: {
    marginTop: 20,
  },
  purposesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  purposeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  purposeContent: {
    flex: 1,
  },
  purposeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  purposeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  purposeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  howItWorks: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  continueButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disclaimer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default EmailCollectionScreen;