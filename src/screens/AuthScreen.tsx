import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, typography, spacing, borderRadius } from '../styles/theme';
import SnapTrackLogo from '../components/SnapTrackLogo';
import { authService } from '../services/authService';

export default function AuthScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<any>(null);

  useEffect(() => {
    // Check if user is already authenticated
    if (authService.isAuthenticated()) {
      navigation.navigate('Main' as never);
    }
  }, [navigation]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        await authService.signUp({ email, password });
        // After successful signup, trigger onboarding immediately
        setShowEmailModal(false);
        navigation.navigate('Onboarding' as never);
      } else {
        await authService.signIn({ email, password });
        // Show success feedback before navigation
        Alert.alert(
          'Sign In Successful!',
          'Welcome back to SnapTrack!',
          [{ 
            text: 'Continue', 
            onPress: () => {
              setShowEmailModal(false);
              navigation.navigate('Main' as never);
            }
          }]
        );
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const user = await authService.signInWithGoogle();
      
      // Check if this is a new user by checking if onboarding has been completed
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      
      if (!onboardingCompleted) {
        // New user - navigate to onboarding
        navigation.navigate('Onboarding' as never);
      } else {
        // Existing user - show success and navigate to main
        Alert.alert(
          'Sign In Successful!',
          'Welcome back to SnapTrack!',
          [{ 
            text: 'Continue', 
            onPress: () => navigation.navigate('Main' as never)
          }]
        );
      }
    } catch (error: any) {
      Alert.alert('Google Sign-In Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);

    try {
      const user = await authService.signInWithApple();
      
      // Check if this is a new user by checking if onboarding has been completed
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      
      if (!onboardingCompleted) {
        // New user - navigate to onboarding
        navigation.navigate('Onboarding' as never);
      } else {
        // Existing user - show success and navigate to main
        Alert.alert(
          'Sign In Successful!',
          'Welcome back to SnapTrack!',
          [{ 
            text: 'Continue', 
            onPress: () => navigation.navigate('Main' as never)
          }]
        );
      }
    } catch (error: any) {
      Alert.alert('Apple Sign-In Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsPress = () => {
    navigation.navigate('TermsOfService' as never);
  };

  const handlePrivacyPress = () => {
    navigation.navigate('PrivacyPolicy' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <SnapTrackLogo width={200} height={60} />
        </View>

        {/* Hero Tagline */}
        <View style={styles.taglineSection}>
          <Text style={styles.taglineNormal}>Snap it.</Text>
          <Text style={styles.taglineGradient}>Track it.</Text>
        </View>

        {/* Authentication Buttons */}
        <View style={styles.buttonsSection}>
          {/* Continue with Google */}
          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <View style={styles.primaryButtonContent}>
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Continue with Google</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Continue with Apple */}
          <TouchableOpacity 
            style={[styles.secondaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleAppleSignIn}
            disabled={isLoading}
          >
            <View style={styles.secondaryButtonContent}>
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={styles.secondaryButtonText}>Continue with Apple</Text>
            </View>
          </TouchableOpacity>

          {/* Continue with Email */}
          <TouchableOpacity 
            style={[styles.secondaryButton, isLoading && styles.buttonDisabled]}
            onPress={() => setShowEmailModal(true)}
            disabled={isLoading}
          >
            <View style={styles.secondaryButtonContent}>
              <Ionicons name="mail-outline" size={20} color="#000" />
              <Text style={styles.secondaryButtonText}>Continue with Email</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* Legal Footer */}
        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            By continuing, you acknowledge that you have read and agreed to our{' '}
            <Text style={styles.legalLink} onPress={handleTermsPress}>Terms of Service</Text> and{' '}
            <Text style={styles.legalLink} onPress={handlePrivacyPress}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>

      {/* Email Modal */}
      <Modal
        visible={showEmailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowEmailModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Email Sign In</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  // Focus password field when user hits next
                  passwordInputRef.current?.focus();
                }}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={passwordInputRef}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleAuth}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={colors.textMuted} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.switchContainer}>
              <TouchableOpacity 
                style={styles.switchToggle}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.switchText}>
                  {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.modalSubmitButton, isLoading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#009f86', '#2457d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalSubmitGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  taglineSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: -80,
  },
  taglineNormal: {
    fontSize: 68,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -2,
    textAlign: 'center',
    lineHeight: 80,
  },
  taglineGradient: {
    fontSize: 68,
    fontWeight: '700',
    letterSpacing: -2,
    color: '#009f86', // SnapTrack brand teal
    textAlign: 'center',
    lineHeight: 80,
  },
  buttonsSection: {
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderRadius: 28,
    height: 56,
    overflow: 'hidden',
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 28,
    height: 56,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 12,
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  legalSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  legalText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  legalLink: {
    color: '#000000',
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCloseButton: {
    minWidth: 60,
  },
  modalCloseText: {
    color: '#666666',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalPlaceholder: {
    minWidth: 60,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
  },
  passwordToggle: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  switchContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  switchToggle: {
    paddingVertical: 8,
  },
  switchText: {
    color: '#009f86',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButton: {
    borderRadius: 28,
    height: 56,
    overflow: 'hidden',
  },
  modalSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});