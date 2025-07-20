import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { apiClient } from '../../services/apiClient';

interface UsernameSelectionScreenProps {
  onNext: () => void;
  onSkip: () => void;
  state: any;
}

export default function UsernameSelectionScreen({ onNext, onSkip, state }: UsernameSelectionScreenProps) {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Generate initial suggestions when screen loads
    generateInitialSuggestions();
  }, []);

  useEffect(() => {
    // Check username availability with debouncing
    if (username.trim() && username.length >= 2) {
      // Clear previous timeout
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      
      // Set new timeout for availability check
      checkTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(username.trim());
      }, 500);
    } else {
      setIsAvailable(null);
      setShowEmailPreview(false);
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [username]);

  const generateInitialSuggestions = async () => {
    try {
      setIsGeneratingSuggestions(true);
      
      // Try to use user's name if available, otherwise use generic base
      const user = state?.user || {};
      const firstName = user.displayName?.split(' ')[0] || 'user';
      
      const response = await apiClient.post('/api/username/generate', {
        base: firstName.toLowerCase(),
        count: 5
      });

      if (response.success && response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      // Provide fallback suggestions
      setSuggestions(['user2025', 'myreceipts', 'expenses', 'business-user', 'receipts-pro']);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    try {
      setIsChecking(true);
      
      const response = await apiClient.post('/api/username/check', {
        username: usernameToCheck
      });

      if (response.success) {
        setIsAvailable(response.available);
        setShowEmailPreview(response.available);
        
        if (!response.available && response.suggestions) {
          setSuggestions(response.suggestions);
        }
        
        setHasCheckedInitial(true);
      }
    } catch (error) {
      console.error('Failed to check username availability:', error);
      Alert.alert('Error', 'Failed to check username availability. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    // Only allow valid username characters: letters, numbers, hyphens
    const cleanText = text.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(cleanText);
  };

  const selectSuggestion = (suggestion: string) => {
    setUsername(suggestion);
    inputRef.current?.focus();
  };

  const handleContinue = async () => {
    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter a username to continue.');
      return;
    }

    if (!isAvailable) {
      Alert.alert('Username Unavailable', 'Please choose an available username.');
      return;
    }

    try {
      setIsChecking(true);
      
      // Assign the username
      const response = await apiClient.post('/api/username/assign', {
        username: username.trim()
      });

      if (response.success) {
        // Store username in onboarding state for display in subsequent screens
        state.selectedUsername = username.trim();
        state.userEmailAddress = response.email_address;
        
        Alert.alert(
          'Username Set!',
          `Your receipt forwarding email is now:\n${response.email_address}`,
          [{ text: 'Continue', onPress: onNext }]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to set username. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to assign username:', error);
      Alert.alert('Error', 'Failed to set username. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSkipForNow = () => {
    Alert.alert(
      'Skip Username Setup?',
      'You can set up your username later in Settings. Your receipts will use a temporary forwarding address for now.',
      [
        { text: 'Set Username Now', style: 'cancel' },
        { text: 'Skip For Now', onPress: onSkip }
      ]
    );
  };

  const getInputBorderColor = () => {
    if (isChecking || !hasCheckedInitial) return colors.border;
    if (isAvailable === true) return colors.success;
    if (isAvailable === false) return colors.error;
    return colors.border;
  };

  const getStatusIcon = () => {
    if (isChecking) return <ActivityIndicator size="small" color={colors.primary} />;
    if (isAvailable === true) return <Ionicons name="checkmark-circle" size={20} color={colors.success} />;
    if (isAvailable === false) return <Ionicons name="close-circle" size={20} color={colors.error} />;
    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Username</Text>
        <Text style={styles.subtitle}>
          Create a memorable username for your receipt forwarding email address
        </Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Username</Text>
        <View style={[styles.inputContainer, { borderColor: getInputBorderColor() }]}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="enter-username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            maxLength={30}
          />
          <View style={styles.statusContainer}>
            {getStatusIcon()}
          </View>
        </View>
        
        {showEmailPreview && (
          <View style={styles.emailPreview}>
            <Text style={styles.emailPreviewLabel}>Your receipt email will be:</Text>
            <Text style={styles.emailAddress}>{username}@app.snaptrack.bot</Text>
          </View>
        )}

        {isAvailable === false && (
          <Text style={styles.errorText}>
            Username not available. Try one of the suggestions below.
          </Text>
        )}
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>
            {isGeneratingSuggestions ? 'Generating suggestions...' : 'Suggested usernames:'}
          </Text>
          {isGeneratingSuggestions ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
          ) : (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => selectSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Forward receipts to this email for automatic processing
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            You can change your username later in Settings
          </Text>
        </View>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!isAvailable || isChecking) && styles.buttonDisabled
          ]}
          onPress={handleContinue}
          disabled={!isAvailable || isChecking}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipForNow}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100, // Extra space for buttons
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 16,
  },
  statusContainer: {
    width: 24,
    alignItems: 'center',
  },
  emailPreview: {
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  emailPreviewLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emailAddress: {
    ...typography.subtitle,
    color: colors.success,
    fontWeight: '600',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.sm,
  },
  suggestionsSection: {
    marginBottom: spacing.xl,
  },
  suggestionsTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  loadingIndicator: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  suggestionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    flex: 1,
  },
  buttonSection: {
    gap: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
  },
  continueButtonText: {
    ...typography.button,
    color: colors.white,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});