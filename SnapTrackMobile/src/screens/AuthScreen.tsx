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
import { authService } from '../services/authService';
import { iapManager } from '../services/IAPManager';
import { apiClient } from '../services/apiClient';

export default function AuthScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          console.log('✅ AuthScreen: User authenticated with paid account, navigating to Main');
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
        console.log('🍎 Initializing IAP on AuthScreen...');
        await iapManager.initialize();
        
        // Load products
        const loadedProducts = await iapManager.loadProducts();
        setProducts(loadedProducts);
        setIsIAPReady(true);
        
        console.log('✅ IAP initialized with products:', loadedProducts);
      } catch (error) {
        console.error('❌ Failed to initialize IAP:', error);
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
    console.log('🚀 handleGoogleSignIn started');
    setIsLoading(true);

    try {
      console.log('🔐 Calling authService.signInWithGoogle()');
      const user = await authService.signInWithGoogle();
      console.log('✅ Google sign-in successful, user:', user.email);
      
      // Check if user has paid account
      console.log('💳 Checking paid account status...');
      const hasPaidAccount = await authService.checkPaidAccountStatus();
      console.log('💳 Has paid account:', hasPaidAccount);
      
      if (!hasPaidAccount) {
        // New user or unpaid - redirect to paid account required
        console.log('❌ No paid account, navigating to NewWelcome');
        navigation.navigate('NewWelcome' as never);
      } else {
        // Existing paid user - navigate immediately
        console.log('✅ Has paid account, navigating to Main');
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
      console.error('❌ Google Sign-In Error:', error);
      Alert.alert('Google Sign-In Error', error.message);
    } finally {
      setIsLoading(false);
      console.log('🏁 handleGoogleSignIn completed');
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);

    try {
      // Step 1: Sign in with Apple
      const user = await authService.signInWithApple();
      
      if (!user) {
        throw new Error('Apple sign in cancelled');
      }
      
      // Step 2: Check if user already has subscription
      try {
        const statusResponse = await apiClient.get<any>('/api/subscription/status');
        
        if ((statusResponse as any).data?.has_subscription) {
          // Existing user with active subscription
          console.log('✅ Existing user with subscription, navigating to app');
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
        // User doesn't exist yet or no subscription, continue to purchase
        console.log('📱 New user or no subscription, proceeding to purchase');
      }
      
      // Step 3: New user - initiate purchase
      if (Platform.OS === 'ios' && isIAPReady && products.length > 0) {
        await handlePurchase();
      } else {
        // IAP not available - show error and sign out
        console.log('❌ IAP not available');
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
      console.error('❌ Apple sign in error:', error);
      if (error.message !== 'Apple sign in cancelled') {
        Alert.alert('Sign In Error', 'Failed to sign in with Apple. Please try again.');
      }
    } finally {
      setIsLoading(false);
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
      console.error('Purchase initiation error:', error);
      Alert.alert('Error', 'Failed to start purchase process');
    }
  };

  const processPurchase = async (product: any) => {
    try {
      setIsPurchaseInProgress(true);
      setIsLoading(true);
      
      // Purchase the product
      const purchase = await iapManager.purchase(product.productId);
      
      if (!purchase) {
        throw new Error('Purchase cancelled');
      }
      
      // Get the receipt
      const receipt = await iapManager.getReceipt();
      
      if (!receipt) {
        throw new Error('No receipt found');
      }
      
      // Send receipt to backend for validation and user creation
      const response = await apiClient.post<any>('/api/subscription/apple/purchase', {
        receipt_data: receipt,
        is_sandbox: __DEV__ // Use sandbox in development
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
      console.error('Purchase processing error:', error);
      
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
            style={[styles.appleButton, isLoading && styles.buttonDisabled]}
            onPress={handleAppleSignIn}
            disabled={isLoading}
          >
            <View style={styles.appleButtonContent}>
              <Ionicons name="logo-apple" size={20} color="white" />
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
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
  }
});