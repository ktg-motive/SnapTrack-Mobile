import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import SnapTrackLogo from '../components/SnapTrackLogo';
import { authService } from '../services/authService';
import { iapManager } from '../services/IAPManager';
import { apiClient } from '../services/apiClient';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isIAPReady, setIsIAPReady] = useState(false);
  const [showPromoCodeModal, setShowPromoCodeModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [processingPromoCode, setProcessingPromoCode] = useState(false);

  // Initialize In-App Purchases
  useEffect(() => {
    const initializeIAP = async () => {
      if (Platform.OS !== 'ios') {
        return;
      }

      try {
        console.log('🍎 Initializing IAP on SignUpScreen...');
        await iapManager.initialize();
        
        // Load products
        const loadedProducts = await iapManager.loadProducts();
        console.log('📦 Products loaded:', loadedProducts);
        setProducts(loadedProducts);
        setIsIAPReady(true);
        
        console.log('✅ IAP initialized with products:', loadedProducts);
      } catch (error) {
        console.error('❌ Failed to initialize IAP:', error);
        // Set some debug info for the user
        setIsIAPReady(false);
        setProducts([]);
      }
    };

    initializeIAP();

    return () => {
      iapManager.disconnect();
    };
  }, []);

  const handleAppleSignUp = async () => {
    setIsLoading(true);

    try {
      // Step 1: Sign in with Apple
      const user = await authService.signInWithApple();
      
      if (!user) {
        throw new Error('Apple sign in cancelled');
      }
      
      // Step 2: Check if user already exists and has subscription
      try {
        const statusResponse = await apiClient.get<any>('/api/subscription/status');
        
        if ((statusResponse as any).data?.has_subscription) {
          // User already exists with active subscription
          console.log('✅ User already has subscription, navigating to app');
          navigation.navigate('Main' as never);
          
          setTimeout(() => {
            Alert.alert(
              'Welcome to SnapTrack!',
              'Your account is already set up and ready to go.'
            );
          }, 500);
          return;
        }
      } catch (error) {
        // User doesn't exist yet or no subscription, continue to purchase
        console.log('📱 New user signup, proceeding to purchase');
      }
      
      // Step 3: New user - initiate purchase
      console.log('🔍 IAP Debug - Platform:', Platform.OS, 'isIAPReady:', isIAPReady, 'products.length:', products.length);
      
      if (Platform.OS === 'ios' && isIAPReady && products.length > 0) {
        await handlePurchase(promoCode);
      } else {
        // More detailed error message
        let errorDetails = `Platform: ${Platform.OS}`;
        if (Platform.OS === 'ios') {
          errorDetails += `, IAP Ready: ${isIAPReady}, Products: ${products.length}`;
        }
        
        Alert.alert(
          'Setup Required',
          `A subscription is required to use SnapTrack. Debug info: ${errorDetails}. Please try again when the App Store is available.`
        );
        authService.signOut();
      }
      
    } catch (error: any) {
      console.error('❌ Apple sign up error:', error);
      
      // Check for simulator-specific error
      if (error.message?.includes('AuthorizationError error 1000') || 
          error.message?.includes('authorization attempt failed')) {
        Alert.alert(
          'Testing on Simulator?',
          'Apple Sign-In doesn\'t work in the iOS Simulator. To test SnapTrack:\n\n' +
          '1. Use a real device for Apple Sign-In\n' +
          '2. Or sign in with an existing account\n\n' +
          'This is a simulator limitation, not an app issue.',
          [
            { text: 'Sign In Instead', onPress: handleSignInInstead },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else if (error.message !== 'Apple sign in cancelled') {
        Alert.alert('Sign Up Error', 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (offerCode?: string) => {
    try {
      if (!isIAPReady || products.length === 0) {
        Alert.alert('Error', 'In-app purchases not available. Please try again later.');
        return;
      }

      const product = products[0];
      
      // Show purchase confirmation
      const message = offerCode 
        ? `Subscribe to SnapTrack with promo code "${offerCode.toUpperCase()}" applied.`
        : `Subscribe to SnapTrack for ${product.priceString}/month to get started with unlimited receipt tracking.`;
      
      Alert.alert(
        'Complete Your SnapTrack Signup',
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              authService.signOut();
            }
          },
          {
            text: 'Subscribe',
            onPress: async () => {
              await processPurchase(product, offerCode);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Purchase initiation error:', error);
      Alert.alert('Error', 'Failed to start subscription process');
    }
  };

  const processPurchase = async (product: any, offerCode?: string) => {
    try {
      setIsLoading(true);
      
      // Purchase the product with or without offer code
      let purchase;
      if (offerCode) {
        purchase = await iapManager.purchaseWithOfferCode(product.productId, offerCode);
      } else {
        purchase = await iapManager.purchase(product.productId);
      }
      
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
        is_sandbox: __DEV__,
        offer_code: offerCode
      });
      
      if ((response as any).data.success) {
        // Acknowledge the purchase
        await iapManager.finishTransaction(purchase, false);
        
        // Navigate to welcome screen with user details
        (navigation as any).navigate('IAPWelcome', {
          receiptEmail: (response as any).data.user.receipt_email,
          isProxyEmail: (response as any).data.user.is_proxy_email,
          subdomain: (response as any).data.user.subdomain,
          promoApplied: !!offerCode
        });
      } else {
        throw new Error((response as any).data.error || 'Failed to process subscription');
      }
      
    } catch (error: any) {
      console.error('Purchase processing error:', error);
      
      if (error.code === 'E_USER_CANCELLED' || error.message === 'Purchase cancelled') {
        await authService.signOut();
      } else {
        Alert.alert(
          'Subscription Error',
          error.message || 'Failed to process subscription. Please contact support.',
          [
            {
              text: 'OK',
              onPress: () => authService.signOut()
            }
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoCodeSubmit = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Invalid Code', 'Please enter a promo code');
      return;
    }

    // Just close the modal and store the promo code
    // The actual purchase will happen after Apple Sign-In
    setShowPromoCodeModal(false);
    
    // Show success message
    Alert.alert(
      'Promo Code Ready',
      `Your promo code "${promoCode.toUpperCase()}" will be applied during signup.`,
      [
        {
          text: 'Continue',
          onPress: () => {
            // The promo code is already stored in state
            // User should now tap "Sign Up with Apple"
          }
        }
      ]
    );
  };

  const handleSignInInstead = () => {
    navigation.navigate('Auth' as never);
  };

  const features = [
    'Unlimited receipt storage',
    'AI-powered data extraction', 
    'Multi-business organization',
    'Email forwarding',
    'Professional exports'
  ];

  // Android temporary message for testers
  if (Platform.OS === 'android') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <SnapTrackLogo width={180} height={54} />
          </View>

          {/* Android Notice */}
          <View style={styles.androidNoticeContainer}>
            <Ionicons name="construct-outline" size={48} color={colors.primary} />
            <Text style={styles.androidTitle}>Android Play Store Coming Soon!</Text>
            <Text style={styles.androidSubtitle}>
              We're working on bringing SnapTrack to Google Play Store.
            </Text>
            
            <View style={styles.androidInfoBox}>
              <Text style={styles.androidInfoTitle}>For Beta Testers:</Text>
              <Text style={styles.androidInfoText}>
                If you're a beta tester, please sign in with your existing account.
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.androidSignInButton}
              onPress={handleSignInInstead}
            >
              <Text style={styles.androidSignInText}>Sign In to Existing Account</Text>
            </TouchableOpacity>

            <Text style={styles.androidTimelineText}>
              Expected launch: August 2025
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // iOS implementation
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <SnapTrackLogo width={180} height={54} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>
            Start tracking receipts like a pro with SnapTrack's AI-powered platform.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What's included:</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          
          <View style={styles.pricingInfo}>
            <Text style={styles.pricingText}>$4.99/month • Billed through Apple</Text>
            <Text style={styles.pricingSubtext}>Cancel anytime in Settings</Text>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleAppleSignUp}
            disabled={isLoading}
          >
            <View style={styles.buttonContent}>
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Sign Up with Apple</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowPromoCodeModal(true)}
            disabled={isLoading || processingPromoCode}
          >
            <Text style={styles.promoCodeLink}>Have a promo code?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleSignInInstead}
            disabled={isLoading}
          >
            <Text style={styles.signInText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Promo Code Modal */}
      <Modal
        visible={showPromoCodeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPromoCodeModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Promo Code</Text>
              <TouchableOpacity 
                onPress={() => setShowPromoCodeModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Enter your promo code to redeem a special offer on your SnapTrack subscription.
              </Text>

              <TextInput
                style={styles.promoCodeInput}
                placeholder="Enter promo code"
                placeholderTextColor="#999"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handlePromoCodeSubmit}
              />

              <TouchableOpacity
                style={[styles.applyButton, !promoCode.trim() && styles.applyButtonDisabled]}
                onPress={handlePromoCodeSubmit}
                disabled={!promoCode.trim() || processingPromoCode}
              >
                {processingPromoCode ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.applyButtonText}>Apply Code</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.promoNote}>
                Promo codes are case-insensitive. Your special offer will be applied at checkout.
              </Text>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22
  },
  featuresSection: {
    flex: 1,
    marginBottom: 32
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    flex: 1
  },
  pricingInfo: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center'
  },
  pricingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4
  },
  pricingSubtext: {
    fontSize: 14,
    color: '#666666'
  },
  ctaSection: {
    alignItems: 'center',
    gap: 16
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 28,
    height: 56,
    width: '100%'
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  signInText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500'
  },
  promoCodeLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background
  },
  modalContent: {
    flex: 1
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary
  },
  closeButton: {
    padding: 8
  },
  modalBody: {
    padding: 20
  },
  modalDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22
  },
  promoCodeInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: '#F8F8F8',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 2
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  applyButtonDisabled: {
    opacity: 0.5
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  promoNote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20
  },
  // Android-specific styles
  androidNoticeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  androidTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center'
  },
  androidSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22
  },
  androidInfoBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    width: '100%'
  },
  androidInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8
  },
  androidInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20
  },
  androidSignInButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  androidSignInText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  androidTimelineText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic'
  }
});