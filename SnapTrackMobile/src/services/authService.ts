import { 
  initializeApp, 
  getApps, 
  getApp 
} from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  signInWithCredential,
  signInWithCustomToken,
  GoogleAuthProvider,
  OAuthProvider,
  User as FirebaseUser,
  Auth,
  updateProfile
} from 'firebase/auth';
// Conditional import for Google Sign-In (not available in Expo Go)
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (error) {
  console.log('Google Sign-In not available in this environment');
}

// Conditional import for Apple Sign-In (only available on iOS devices)
let AppleAuthentication: any = null;
try {
  AppleAuthentication = require('expo-apple-authentication');
} catch (error) {
  console.log('Apple Authentication not available in this environment');
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';

import { CONFIG } from '../config';
import { AuthCredentials, AuthUser } from '../types';
import { apiClient } from './apiClient';

class AuthService {
  private auth: Auth;
  private currentUser: AuthUser | null = null;

  constructor() {
    // Initialize Firebase if not already initialized
    const app = getApps().length === 0 
      ? initializeApp(CONFIG.FIREBASE_CONFIG)
      : getApp();
    
    // Initialize Auth with AsyncStorage persistence
    this.auth = getApps().length === 0 
      ? initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      })
      : getAuth(app);
    
    // Configure Google Sign-In
    this.configureGoogleSignIn();
    
    // Set up auth state listener
    this.initializeAuthListener();
  }

  private configureGoogleSignIn() {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: CONFIG.GOOGLE_WEB_CLIENT_ID, // From Firebase console
        offlineAccess: false
      });
    }
  }

  private initializeAuthListener() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔐 User signed in:', firebaseUser.email);
        
        // Convert Firebase user to our AuthUser type
        this.currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          emailVerified: firebaseUser.emailVerified
        };

        // Get and store auth token
        const token = await firebaseUser.getIdToken();
        console.log('🔐 Firebase token obtained, length:', token.length);
        if (Platform.OS === 'ios') {
          console.log('🍎 iOS: Setting auth token after Firebase auth state change');
        }
        await this.storeAuthToken(token);
        apiClient.setAuthToken(token);
        
        // User context would be set here if we had error tracking

      } else {
        console.log('🔐 User signed out');
        this.currentUser = null;
        await this.clearAuthToken();
        apiClient.clearAuthToken();
        
        // User context would be cleared here if we had error tracking
      }
    });
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: AuthCredentials): Promise<AuthUser> {
    try {
      console.log('🔐 Attempting sign in for:', credentials.email);
      
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      await this.storeAuthToken(token);
      apiClient.setAuthToken(token);

      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified
      };

      this.currentUser = authUser;
      console.log('✅ Sign in successful');
      
      // User context would be set here if we had error tracking
      
      return authUser;
    } catch (error: any) {
      console.error('❌ Sign in failed:', error.message);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Create new account with email and password
   */
  async signUp(credentials: AuthCredentials): Promise<AuthUser> {
    try {
      console.log('🔐 Attempting account creation for:', credentials.email);
      
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      await this.storeAuthToken(token);
      apiClient.setAuthToken(token);

      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified
      };

      this.currentUser = authUser;
      console.log('✅ Account creation successful');
      
      // User context would be set here if we had error tracking
      
      return authUser;
    } catch (error: any) {
      console.error('❌ Account creation failed:', error.message);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<AuthUser> {
    if (!GoogleSignin) {
      throw new Error('Google Sign-In is not available in this environment. Please use email/password authentication or try in a development build.');
    }

    try {
      console.log('🔐 Attempting Google sign in');
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Sign out first to ensure clean state (fixes Android flash issue)
      await GoogleSignin.signOut();
      
      // Get Google user info
      const userInfo = await GoogleSignin.signIn();
      console.log('📱 Google Sign-In userInfo received:', {
        hasIdToken: !!userInfo.data?.idToken,
        email: userInfo.data?.user?.email,
        id: userInfo.data?.user?.id
      });
      
      if (!userInfo.data?.idToken) {
        throw new Error('No ID token received from Google');
      }
      
      // Create Firebase credential
      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);
      
      // Sign in to Firebase with Google credential
      const userCredential = await signInWithCredential(this.auth, googleCredential);
      const firebaseUser = userCredential.user;
      console.log('🔥 Firebase sign-in successful:', firebaseUser.email);
      
      // Get Firebase auth token
      const token = await firebaseUser.getIdToken();
      
      await this.storeAuthToken(token);
      apiClient.setAuthToken(token);

      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified
      };

      this.currentUser = authUser;
      console.log('✅ Google sign in successful');
      
      // User context would be set here if we had error tracking
      
      return authUser;
    } catch (error: any) {
      console.error('❌ Google sign in failed:', {
        message: error.message,
        code: error.code,
        details: error
      });
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Sign in was cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Sign in is already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      } else if (error.code === '10') {
        throw new Error('Developer error: Check your Google Sign-In configuration');
      }
      
      throw new Error(`Google sign in failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Check if Google Sign-In is available
   */
  isGoogleSignInAvailable(): boolean {
    return GoogleSignin !== null;
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<AuthUser> {
    if (!AppleAuthentication) {
      throw new Error('Apple Sign-In is not available in this environment. Please use email/password authentication or try in a development build.');
    }

    try {
      console.log('🔐 Attempting Apple sign in');
      
      // Check if Apple Sign-In is available on this device
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }
      
      // Generate a random nonce for security (required by Firebase)
      const rawNonce = this.generateNonce();
      const hashedNonce = await this.sha256(rawNonce);
      
      console.log('🍎 Generated nonce for Apple Sign-In');
      
      // Get Apple credential with nonce
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ],
        nonce: hashedNonce
      });
      
      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }
      
      console.log('🍎 Apple credential received:', {
        hasIdentityToken: !!credential.identityToken,
        hasAuthorizationCode: !!credential.authorizationCode,
        email: credential.email,
        realUserStatus: credential.realUserStatus,
        fullName: credential.fullName,
        user: credential.user
      });
      
      // Create Firebase credential with raw nonce
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: rawNonce // Use the raw nonce, not hashed
      });
      
      // Sign in to Firebase with Apple credential
      const userCredential = await signInWithCredential(this.auth, firebaseCredential);
      const firebaseUser = userCredential.user;
      console.log('🔥 Firebase Apple sign-in successful:', {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        providerData: firebaseUser.providerData
      });
      
      // Get Firebase auth token
      const token = await firebaseUser.getIdToken();
      
      await this.storeAuthToken(token);
      apiClient.setAuthToken(token);

      // Construct display name from Apple credential if available
      let displayName = firebaseUser.displayName;
      if (!displayName && credential.fullName) {
        const { givenName, familyName } = credential.fullName;
        if (givenName || familyName) {
          displayName = [givenName, familyName].filter(Boolean).join(' ');
        }
      }

      // Use Apple credential email if Firebase doesn't have it
      const userEmail = firebaseUser.email || credential.email;
      
      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: userEmail!,
        displayName: displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified
      };

      this.currentUser = authUser;
      console.log('✅ Apple sign in successful');
      
      return authUser;
    } catch (error: any) {
      console.error('❌ Apple sign in failed:', error.message);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Sign in was cancelled');
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        throw new Error('Invalid response from Apple');
      }
      
      throw new Error('Apple sign in failed. Please try again.');
    }
  }

  /**
   * Check if Apple Sign-In is available
   */
  isAppleSignInAvailable(): boolean {
    return AppleAuthentication !== null;
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      // Sign out from Google if user signed in with Google and GoogleSignin is available
      if (GoogleSignin && typeof GoogleSignin.isSignedIn === 'function') {
        try {
          const isSignedIn = await GoogleSignin.isSignedIn();
          if (isSignedIn) {
            await GoogleSignin.signOut();
          }
        } catch (googleError) {
          console.log('Google sign out not needed or failed:', googleError);
          // Continue with Firebase sign out even if Google sign out fails
        }
      }
      
      await signOut(this.auth);
      await this.clearAuthToken();
      this.currentUser = null;
      
      // User context would be cleared here if we had error tracking
      
      console.log('✅ Sign out successful');
    } catch (error: any) {
      console.error('❌ Sign out failed:', error.message);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Pick<AuthUser, 'displayName' | 'photoURL'>>): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user found');
    }

    try {
      console.log('🔐 Updating user profile:', updates);
      
      // Update Firebase profile
      await updateProfile(this.auth.currentUser, updates);
      
      // Update local currentUser state
      if (this.currentUser) {
        this.currentUser = {
          ...this.currentUser,
          ...updates
        };
      }
      
      console.log('✅ Profile update successful');
    } catch (error: any) {
      console.error('❌ Profile update failed:', error.message);
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  /**
   * Get current auth token
   */
  async getCurrentToken(): Promise<string | null> {
    if (this.auth.currentUser) {
      try {
        return await this.auth.currentUser.getIdToken();
      } catch (error) {
        console.error('❌ Failed to get current token:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Refresh auth token
   */
  async refreshToken(): Promise<string | null> {
    if (this.auth.currentUser) {
      try {
        const token = await this.auth.currentUser.getIdToken(true); // Force refresh
        await this.storeAuthToken(token);
        apiClient.setAuthToken(token);
        return token;
      } catch (error) {
        console.error('❌ Failed to refresh token:', error);
        return null;
      }
    }
    return null;
  }

  // Private helper methods

  private async storeAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@snaptrack_auth_token', token);
    } catch (error) {
      console.error('❌ Failed to store auth token:', error);
    }
  }

  private async clearAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@snaptrack_auth_token');
    } catch (error) {
      console.error('❌ Failed to clear auth token:', error);
    }
  }

  private async getStoredAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@snaptrack_auth_token');
    } catch (error) {
      console.error('❌ Failed to get stored auth token:', error);
      return null;
    }
  }

  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Authentication failed. Please try again.';
    }
  }

  /**
   * Initialize auth on app startup
   */
  async initializeAuth(): Promise<AuthUser | null> {
    try {
      // Check if we have a stored token
      const storedToken = await this.getStoredAuthToken();
      
      if (storedToken && this.auth.currentUser) {
        // Verify token is still valid
        const currentToken = await this.getCurrentToken();
        if (currentToken) {
          apiClient.setAuthToken(currentToken);
          return this.currentUser;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
      return null;
    }
  }

  /**
   * Generate a random nonce for Apple Sign-In
   */
  private generateNonce(): string {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
    return result;
  }

  /**
   * Hash a string using SHA256 for Apple Sign-In nonce
   */
  private async sha256(str: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      str
    );
    return digest;
  }

  /**
   * Check if user has active subscription
   */
  async checkSubscriptionStatus(): Promise<{
    hasSubscription: boolean;
    status: string;
    expiresAt?: string;
  }> {
    try {
      const firebaseUser = this.auth.currentUser;
      if (!firebaseUser) {
        return { hasSubscription: false, status: 'no_auth' };
      }
      
      console.log('🔍 Checking subscription for Firebase user:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        providerId: firebaseUser.providerData[0]?.uid
      });
      
      const token = await firebaseUser.getIdToken();
      if (!token) {
        return { hasSubscription: false, status: 'no_auth' };
      }

      // Use direct fetch since this endpoint isn't in apiClient
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/subscription/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log('📋 Subscription API response:', {
        status: response.status,
        success: data.success,
        data: data.data,
        error: data.error
      });
      
      if (data.success) {
        return {
          hasSubscription: data.data.has_subscription,
          status: data.data.status,
          expiresAt: data.data.current_period_end
        };
      }
      
      return { hasSubscription: false, status: 'none' };
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return { hasSubscription: false, status: 'error' };
    }
  }

  /**
   * Check if user has a paid account (legacy method)
   */
  async checkPaidAccountStatus(): Promise<boolean> {
    try {
      const subscriptionStatus = await this.checkSubscriptionStatus();
      return subscriptionStatus.hasSubscription;
    } catch (error) {
      console.error('Error checking paid account status:', error);
      return false;
    }
  }

  /**
   * Redirect user to web signup with mobile return URL
   */
  async redirectToWebSignup(): Promise<void> {
    // Standardized return URL for App Store compliance
    const returnUrl = 'snaptrack://auth-complete';
    const signupUrl = `https://snaptrack.bot/signup?source=mobile&return=${encodeURIComponent(returnUrl)}`;
    
    try {
      const supported = await Linking.canOpenURL(signupUrl);
      if (supported) {
        await Linking.openURL(signupUrl);
      } else {
        throw new Error('Cannot open signup URL');
      }
    } catch (error) {
      console.error('Failed to open signup URL:', error);
      // Fallback: show error message to user
      Alert.alert(
        'Unable to Open Signup',
        'Please visit snaptrack.bot in your browser to create an account.'
      );
    }
  }

  /**
   * Handle return from web signup
   */
  async handlePaymentComplete(url: string): Promise<boolean> {
    try {
      // Parse URL for any tokens or parameters
      const parsedUrl = new URL(url);
      const token = parsedUrl.searchParams.get('token');
      
      if (token) {
        // If we receive a token, use it to authenticate
        await this.authenticateWithToken(token);
      }
      
      // Check subscription status to confirm payment
      const subscriptionStatus = await this.checkSubscriptionStatus();
      
      if (subscriptionStatus.hasSubscription) {
        // Payment successful, user has active subscription
        return true;
      } else {
        // Payment may have failed or not completed
        return false;
      }
    } catch (error) {
      console.error('Error handling payment completion:', error);
      return false;
    }
  }

  /**
   * Authenticate with token from deep link
   */
  async authenticateWithToken(token: string): Promise<AuthUser> {
    try {
      console.log('🔐 Authenticating with deep link token');
      
      // Exchange the token for Firebase credentials
      const response = await fetch(`${CONFIG.API_BASE_URL}/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      if (data && data.customToken) {
        // Sign in with custom token
        const userCredential = await signInWithCustomToken(this.auth, data.customToken);
        const firebaseUser = userCredential.user;
        
        const authToken = await firebaseUser.getIdToken();
        await this.storeAuthToken(authToken);
        apiClient.setAuthToken(authToken);

        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          emailVerified: firebaseUser.emailVerified
        };

        this.currentUser = authUser;
        console.log('✅ Token authentication successful');
        
        return authUser;
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error: any) {
      console.error('❌ Token authentication failed:', error.message);
      throw new Error('Failed to authenticate with token');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;