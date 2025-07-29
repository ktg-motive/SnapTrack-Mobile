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
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

import { colors, typography, spacing, borderRadius } from '../styles/theme';
import SnapTrackLogo from '../components/SnapTrackLogo';
import { authService } from '../services/authService.compat';
import { iapManager } from '../services/IAPManager';
import { apiClient } from '../services/apiClient';
// import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';

export default function AuthScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const passwordInputRef = useRef<any>(null);
  
  // IAP state
  const [products, setProducts] = useState<any[]>([]);
  const [isIAPReady, setIsIAPReady] = useState(false);
  const [isPurchaseInProgress, setIsPurchaseInProgress] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated on screen mount
    const checkAuth = async () => {
      // Small delay to ensure navigation is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (authService.isAuthenticated()) {
        const hasPaidAccount = await authService.checkPaidAccountStatus();
        if (hasPaidAccount) {
          navigation.navigate('Main' as never);
        }
      }
    };
    
    checkAuth();
  }, []); // Empty deps - only run once on mount

  // Initialize In-App Purchases
  useEffect(() => {
    const initializeIAP = async () => {
      if (Platform.OS !== 'ios') {
        return;
      }

      try {
        await iapManager.initialize();
        
        // Load products
        const loadedProducts = await iapManager.loadProducts();
        setProducts(loadedProducts);
        setIsIAPReady(true);
      } catch (error) {
        console.error('❌ IAP initialization failed:', error);
        // IAP not available, but don't block auth - user can use web payment
      }
    };

    initializeIAP();

    return () => {
      // Disconnect IAP when leaving screen
      iapManager.disconnect();
    };
  }, []);

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
      // Email sign in only - no signup through mobile
      await authService.signIn({ email, password });
        
      // Check if user has paid account
      const hasPaidAccount = await authService.checkPaidAccountStatus();
      
      if (!hasPaidAccount) {
        // User exists but hasn't paid - redirect to account creation in progress
        setShowEmailModal(false);
        navigation.navigate('AccountCreationInProgress' as never);
      } else {
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
    setIsGoogleLoading(true);

    try {
      const user = await authService.signInWithGoogle();
      
      // Check if user has paid account
      const hasPaidAccount = await authService.checkPaidAccountStatus();
      
      if (!hasPaidAccount) {
        // New user or unpaid - redirect to paid account required
        navigation.navigate('NewWelcome' as never);
      } else {
        // Existing paid user - navigate immediately
        navigation.navigate('Main' as never);
        
        // Show success message after navigation
        setTimeout(() => {
          Alert.alert(
            'Welcome back!',
            'Successfully signed in to SnapTrack.'
          );
        }, 500);
      }
    } catch (error: any) {
      // Only show alert if it's not a cancellation
      if (error.code !== 'SIGN_IN_CANCELLED' && error.message !== 'Sign in was cancelled') {
        Alert.alert('Google Sign-In Error', error.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);

    try {
      // Step 1: Sign in with Apple
      const user = await authService.signInWithApple();
      
      if (!user) {
        throw new Error('Apple sign in cancelled');
      }
      
      // Step 2: Check if user already has subscription
      try {
        console.log('🔍 Checking subscription status...');
        console.log('🔍 apiClient available:', !!apiClient);
        console.log('🔍 apiClient.get type:', typeof apiClient?.get);
        
        if (typeof apiClient?.get !== 'function') {
          console.error('❌ apiClient.get is not a function!');
          throw new Error('API client not properly initialized');
        }
        
        const statusResponse = await apiClient.get<any>('/api/subscription/status');
        
        // Check if response has the expected structure (same fix as SignUpScreen)
        const statusData = statusResponse?.data || statusResponse;
        
        if (statusData?.has_subscription) {
          // Existing user with active subscription
          navigation.navigate('Main' as never);
          
          // Show success message after navigation
          setTimeout(() => {
            Alert.alert(
              'Welcome back!',
              'Successfully signed in to SnapTrack.'
            );
          }, 500);
          return;
        }
      } catch (error) {
        console.log('🔍 Subscription check error:', error);
        // User doesn't exist yet or no subscription, continue to purchase
      }
      
      // Step 3: New user - initiate purchase
      if (Platform.OS === 'ios' && isIAPReady && products.length > 0) {
        await handlePurchase();
      } else {
        // IAP not available - show error and sign out
        Alert.alert(
          'Purchase Required',
          'A subscription is required to use SnapTrack. Please try again when the App Store is available.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Sign out and return to auth screen
                authService.signOut();
              }
            }
          ]
        );
      }
      
    } catch (error: any) {
      // Only show alert if it's not a cancellation
      if (error.message !== 'Apple sign in cancelled' && 
          error.code !== 'ERR_REQUEST_CANCELED' && 
          error.message !== 'Sign in was cancelled') {
        Alert.alert('Sign In Error', 'Failed to sign in with Apple. Please try again.');
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      if (!isIAPReady || products.length === 0) {
        Alert.alert('Error', 'In-app purchases not available. Please try again later.');
        return;
      }

      const product = products[0];
      
      // Show purchase confirmation
      Alert.alert(
        'Subscribe to SnapTrack',
        `Continue with ${product.title} for ${product.priceString}/month?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              // Sign out since they didn't complete purchase
              authService.signOut();
            }
          },
          {
            text: 'Subscribe',
            onPress: async () => {
              await processPurchase(product);
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to start purchase process');
    }
  };

  const processPurchase = async (product: any) => {
    try {
      console.log('📱 Starting purchase process for product:', product);
      console.log('📱 Product object type:', typeof product);
      console.log('📱 Product keys:', product ? Object.keys(product) : 'product is null/undefined');
      
      // Validate product object
      if (!product || !product.productId) {
        throw new Error('Invalid product object');
      }
      
      // Check iapManager availability
      console.log('📱 IAP Manager available:', !!iapManager);
      console.log('📱 IAP Manager type:', typeof iapManager);
      
      if (!iapManager) {
        throw new Error('IAP Manager not initialized');
      }
      
      // Check purchase method availability
      console.log('📱 IAP Manager purchase method type:', typeof iapManager.purchase);
      console.log('📱 IAP Manager methods:', Object.keys(iapManager));
      
      if (typeof iapManager.purchase !== 'function') {
        console.error('❌ iapManager.purchase is not a function!');
        console.error('❌ Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(iapManager)));
        throw new Error('Purchase method not available');
      }
      
      setIsPurchaseInProgress(true);
      setIsLoading(true);
      
      // Purchase the product
      console.log('📱 Calling iapManager.purchase...');
      const purchase = await iapManager.purchase(product.productId);
      
      if (!purchase) {
        throw new Error('Purchase cancelled');
      }
      
      console.log('📱 Purchase result:', purchase);
      
      // Get the receipt
      console.log('📱 Getting receipt...');
      const receipt = await iapManager.getReceipt();
      
      if (!receipt) {
        throw new Error('No receipt found');
      }
      
      // Get customer info
      console.log('📱 Getting customer info...');
      const customerInfo = await iapManager.getCustomerInfo();
      
      console.log('📱 Customer info details:', {
        originalAppUserId: customerInfo.originalAppUserId,
        email: customerInfo.email,
        managementURL: customerInfo.managementURL,
        allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers,
        hasActiveSubscriptions: customerInfo.activeSubscriptions.length > 0
      });
      
      console.log('📱 Sending to backend...');
      // Send RevenueCat data to backend for processing
      const response = await apiClient.post<any>('/api/subscription/process-mobile-purchase', {
        app_user_id: customerInfo.originalAppUserId,
        active_subscriptions: customerInfo.activeSubscriptions,
        entitlements: customerInfo.entitlements.active,
        product_id: product.productId,
        transaction_id: purchase.transactionId,
        is_sandbox: __DEV__,
        email: customerInfo.email // Add email if RevenueCat has it
      });
      
      if ((response as any).data.success) {
        // Acknowledge the purchase
        await iapManager.finishTransaction(purchase, false);
        
        // Navigate to post-purchase welcome screen
        (navigation as any).navigate('IAPWelcome', {
          receiptEmail: (response as any).data.user.receipt_email,
          isProxyEmail: (response as any).data.user.is_proxy_email,
          subdomain: (response as any).data.user.subdomain
        });
      } else {
        throw new Error((response as any).data.error || 'Failed to process purchase');
      }
      
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      console.error('❌ Error stack:', error.stack);
      
      if (error.code === 'E_USER_CANCELLED' || error.message === 'Purchase cancelled') {
        // User cancelled, sign them out
        await authService.signOut();
      } else {
        Alert.alert(
          'Purchase Error',
          error.message || 'Failed to process purchase. Please contact support.',
          [
            {
              text: 'OK',
              onPress: () => authService.signOut()
            }
          ]
        );
      }
    } finally {
      setIsPurchaseInProgress(false);
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
          <Text style={styles.taglineNormal}>Snap.</Text>
          <Text style={styles.taglineNormal}>Track.</Text>
          <Text style={styles.taglineGradient}>Done.</Text>
        </View>

        {/* Authentication Buttons */}
        <View style={styles.buttonsSection}>
          {/* Continue with Google */}
          <TouchableOpacity 
            style={[styles.primaryButton, (isLoading || isGoogleLoading || isAppleLoading) && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading || isAppleLoading}
          >
            <View style={styles.primaryButtonContent}>
              {isGoogleLoading ? (
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
            style={[styles.appleButton, (isLoading || isGoogleLoading || isAppleLoading) && styles.buttonDisabled]}
            onPress={handleAppleSignIn}
            disabled={isLoading || isGoogleLoading || isAppleLoading}
          >
            <View style={styles.appleButtonContent}>
              {isAppleLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="white" />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Continue with Email */}
          <TouchableOpacity 
            style={[styles.secondaryButton, (isLoading || isGoogleLoading || isAppleLoading) && styles.buttonDisabled]}
            onPress={() => setShowEmailModal(true)}
            disabled={isLoading || isGoogleLoading || isAppleLoading}
          >
            <View style={styles.secondaryButtonContent}>
              <Ionicons name="mail-outline" size={20} color="#000" />
              <Text style={styles.secondaryButtonText}>Continue with Email</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* Sign Up Note */}
        <View style={styles.signUpNoteSection}>
          <Text style={styles.signUpNoteText}>
            Don't have an account?{' '}
            <Text 
              style={styles.signUpNoteLink} 
              onPress={() => navigation.navigate('SignUp' as never)}
            >
              Sign up here
            </Text>
          </Text>
          <Text style={[styles.signUpNoteText, { marginTop: spacing.sm }]}>
            <Text 
              style={styles.signUpNoteLink} 
              onPress={() => {
                setResetEmail('');
                setShowPasswordResetModal(true);
              }}
            >
              Forgot password?
            </Text>
          </Text>
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

            {/* Forgot Password Link - Removed due to theme import issues */}

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
                    Sign In
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Forgot Password Modal */}
      {/* <ForgotPasswordModal
        isVisible={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      /> */}

      {/* Simple Password Reset Modal */}
      <Modal
        visible={showPasswordResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resetModalContent}>
            <Text style={styles.resetModalTitle}>Reset Password</Text>
            <Text style={styles.resetModalDescription}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
            
            <TextInput
              style={styles.resetEmailInput}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!isResetLoading}
            />
            
            <View style={styles.resetModalButtons}>
              <TouchableOpacity
                style={[styles.resetModalButton, styles.resetModalCancelButton]}
                onPress={() => setShowPasswordResetModal(false)}
                disabled={isResetLoading}
              >
                <Text style={styles.resetModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.resetModalButton, styles.resetModalSendButton, isResetLoading && styles.buttonDisabled]}
                onPress={async () => {
                  if (!resetEmail.trim()) {
                    Alert.alert('Error', 'Please enter your email address');
                    return;
                  }
                  
                  setIsResetLoading(true);
                  try {
                    const result = await authService.sendPasswordReset(resetEmail.trim());
                    if (result.success) {
                      setShowPasswordResetModal(false);
                      Alert.alert(
                        'Check Your Email',
                        'If an account exists with this email, you\'ll receive password reset instructions within a few minutes.',
                        [{ text: 'OK' }]
                      );
                    } else {
                      Alert.alert('Error', result.message);
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to send reset email. Please try again.');
                  } finally {
                    setIsResetLoading(false);
                  }
                }}
                disabled={isResetLoading || !resetEmail.trim()}
              >
                {isResetLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.resetModalSendText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: 32,
    paddingTop: 60
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40
  },
  taglineSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: -80
  },
  taglineNormal: {
    color: '#000000',
    fontSize: 68,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 80,
    textAlign: 'center'
  },
  taglineGradient: {
    fontSize: 68,
    fontWeight: '700',
    letterSpacing: -2,
    color: '#009f86', // SnapTrack brand teal
    textAlign: 'center',
    lineHeight: 80
  },
  buttonsSection: {
    gap: 16,
    marginBottom: 20
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderRadius: 28,
    height: 56,
    overflow: 'hidden'
  },
  primaryButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    height: '100%',
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 28,
    height: 56
  },
  secondaryButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    height: '100%',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  signUpNoteSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16
  },
  signUpNoteText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center'
  },
  signUpNoteLink: {
    color: '#009f86', // SnapTrack brand teal
    fontWeight: '600'
  },
  legalSection: {
    alignItems: 'center',
    paddingHorizontal: 20
  },
  legalText: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center'
  },
  legalLink: {
    color: '#000000',
    fontWeight: '600'
  },

  // Modal Styles
  modalContainer: {
    backgroundColor: '#FFFFFF',
    flex: 1
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  modalCloseButton: {
    minWidth: 60
  },
  modalCloseText: {
    color: '#666666',
    fontSize: 16
  },
  modalTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600'
  },
  modalPlaceholder: {
    minWidth: 60
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40
  },
  inputContainer: {
    marginBottom: 24
  },
  inputLabel: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  textInput: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#000000',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  passwordContainer: {
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row'
  },
  passwordInput: {
    color: '#000000',
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  passwordToggle: {
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginBottom: 16
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500'
  },
  modalSubmitButton: {
    borderRadius: 28,
    height: 56,
    overflow: 'hidden'
  },
  modalSubmitGradient: {
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center'
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  appleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 28,
    height: 56
  },
  appleButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    height: '100%',
    justifyContent: 'center'
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  
  // Password Reset Modal Styles
  resetModalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resetModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  resetModalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetEmailInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 24,
  },
  resetModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resetModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetModalCancelButton: {
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  resetModalSendButton: {
    marginLeft: 8,
    backgroundColor: colors.primary,
  },
  resetModalCancelText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  resetModalSendText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});