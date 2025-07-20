// UUID-Based Auth Service for SnapTrack Mobile
// Implements email-optional authentication with backward compatibility

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

// Conditional imports for platform-specific authentication
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (error) {
  console.log('Google Sign-In not available in this environment');
}

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
import { 
  User, 
  UserEmail, 
  AuthUser, 
  AuthCredentials, 
  AuthResponse, 
  AuthProvider,
  UsernameValidationResponse 
} from '../types/auth';
import { apiClient } from './apiClient';

class UUIDAuthService {
  private auth: Auth;
  private currentUser: User | null = null;
  private userEmails: UserEmail[] = [];
  private authVersion: 1 | 2 = 2;

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
        webClientId: CONFIG.GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false
      });
    }
  }

  private initializeAuthListener() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔐 User signed in:', firebaseUser.email || firebaseUser.uid);
        await this.handleFirebaseUser(firebaseUser);
      } else {
        console.log('🔐 User signed out');
        await this.handleSignOut();
      }
    });
  }

  private async handleFirebaseUser(firebaseUser: FirebaseUser) {
    try {
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Store token for API requests
      await this.storeAuthToken(idToken);
      apiClient.setAuthToken(idToken);
      
      // Get user data from our backend
      const userData = await apiClient.get('/api/user/profile');
      
      // Get user emails (might be empty for email-optional users)
      try {
        const emailsData = await apiClient.get('/api/user/emails');
        this.userEmails = emailsData.emails || [];
      } catch (error) {
        console.log('No emails found for user (email-optional account)');
        this.userEmails = [];
      }
      
      this.currentUser = userData.user;
      this.authVersion = userData.user.auth_version || 2;
      
    } catch (error) {
      console.error('Failed to handle Firebase user:', error);
      // If backend call fails, we might have a new user that needs to be created
      // This will be handled by the universal auth endpoint
    }
  }

  private async handleSignOut() {
    await this.clearAuthToken();
    apiClient.clearAuthToken();
    this.currentUser = null;
    this.userEmails = [];
  }

  /**
   * Universal authentication method - handles both new and existing users
   */
  private async authenticateWithUniversalEndpoint(
    provider: AuthProvider,
    firebaseToken: string,
    additionalData: any = {}
  ): Promise<AuthResponse> {
    try {
      const response: AuthResponse = await apiClient.post('/api/auth/universal', {
        provider,
        firebase_token: firebaseToken,
        ...additionalData
      });

      // Store onboarding flags for new users
      if (response.is_new_user) {
        await AsyncStorage.setItem('show_onboarding', 'true');
        
        // If no email provided, we might want to ask later
        if (!response.user.has_email) {
          await AsyncStorage.setItem('prompt_for_email', 'true');
        }
      }

      return response;
    } catch (error) {
      console.error('Universal auth failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    if (!GoogleSignin) {
      throw new Error('Google Sign-In is not available in this environment.');
    }

    try {
      console.log('🔐 Attempting Google sign in');
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Sign out first to ensure clean state
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
      
      // TEMPORARY: Use existing Supabase auth flow until backend implements /api/auth/universal
      // This matches what the web app does
      try {
        // Create Firebase credential
        const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);
        
        // Sign in to Firebase with Google credential
        const userCredential = await signInWithCredential(this.auth, googleCredential);
        const firebaseUser = userCredential.user;
        console.log('🔥 Firebase sign-in successful:', firebaseUser.email);
        
        // Get Firebase auth token
        const token = await firebaseUser.getIdToken();
        
        // Store token for API requests
        await this.storeAuthToken(token);
        apiClient.setAuthToken(token);
        
        // For now, just use the Firebase user data directly
        // When backend implements /api/auth/universal, uncomment the code below
        this.currentUser = {
          id: firebaseUser.uid,
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          full_name: firebaseUser.displayName,
          auth_version: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User;
        
        // Get user profile from backend if it exists
        try {
          const userData = await apiClient.get('/api/user/profile');
          if (userData.user) {
            this.currentUser = userData.user;
          }
        } catch (profileError) {
          console.log('User profile not found, using Firebase data');
        }
        
        // TODO: Uncomment when backend implements /api/auth/universal
        // await this.authenticateWithUniversalEndpoint('google', token, {
        //   google_user_id: userInfo.data.user?.id,
        //   email: userInfo.data.user?.email,
        //   name: userInfo.data.user?.name,
        //   picture: userInfo.data.user?.photo
        // });
        
        return this.currentUser!;
      } catch (fallbackError) {
        console.error('Fallback auth failed:', fallbackError);
        throw fallbackError;
      }
      
    } catch (error: any) {
      console.error('❌ Google sign in failed:', error);
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Sign in was cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Sign in is already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      }
      
      throw new Error(`Google sign in failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<User> {
    if (!AppleAuthentication) {
      throw new Error('Apple Sign-In is not available in this environment.');
    }

    try {
      console.log('🔐 Attempting Apple sign in');
      
      // Check if Apple Sign-In is available on this device
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }
      
      // Generate a random nonce for security
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
        rawNonce: rawNonce
      });
      
      // Sign in to Firebase with Apple credential
      const userCredential = await signInWithCredential(this.auth, firebaseCredential);
      const firebaseUser = userCredential.user;
      console.log('🔥 Firebase Apple sign-in successful:', {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName
      });
      
      // Get Firebase auth token
      const token = await firebaseUser.getIdToken();
      
      // Construct display name from Apple credential if available
      let displayName = firebaseUser.displayName;
      if (!displayName && credential.fullName) {
        const { givenName, familyName } = credential.fullName;
        if (givenName || familyName) {
          displayName = [givenName, familyName].filter(Boolean).join(' ');
        }
      }

      // Call universal auth endpoint with Apple data
      await this.authenticateWithUniversalEndpoint('apple', token, {
        apple_user: credential.user,
        full_name: displayName,
        email: credential.email // Might be relay or null
      });
      
      // Firebase auth listener will handle the rest
      return this.currentUser!;
      
    } catch (error: any) {
      console.error('❌ Apple sign in failed:', error);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Apple sign in cancelled');
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        throw new Error('Invalid response from Apple');
      }
      
      throw new Error('Apple sign in failed. Please try again.');
    }
  }

  /**
   * Legacy email/password sign in - still supported
   */
  async signIn(credentials: AuthCredentials): Promise<User> {
    try {
      console.log('🔐 Attempting email sign in for:', credentials.email);
      
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      // For email users, we still need to call the universal endpoint
      // to ensure they're properly set up in the new system
      await this.authenticateWithUniversalEndpoint('email', token, {
        email: credentials.email
      });

      return this.currentUser!;
    } catch (error: any) {
      console.error('❌ Sign in failed:', error.message);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Legacy email/password sign up - still supported
   */
  async signUp(credentials: AuthCredentials): Promise<User> {
    try {
      console.log('🔐 Attempting account creation for:', credentials.email);
      
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      // Call universal auth endpoint for new email user
      await this.authenticateWithUniversalEndpoint('email', token, {
        email: credentials.email,
        is_signup: true
      });

      return this.currentUser!;
    } catch (error: any) {
      console.error('❌ Account creation failed:', error.message);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      // Sign out from Google if user signed in with Google
      if (GoogleSignin && typeof GoogleSignin.isSignedIn === 'function') {
        try {
          const isSignedIn = await GoogleSignin.isSignedIn();
          if (isSignedIn) {
            await GoogleSignin.signOut();
          }
        } catch (googleError) {
          console.log('Google sign out not needed or failed:', googleError);
        }
      }
      
      await signOut(this.auth);
      await this.clearAuthToken();
      this.currentUser = null;
      this.userEmails = [];
      
      // Clear onboarding flags
      await AsyncStorage.multiRemove([
        'show_onboarding',
        'prompt_for_email'
      ]);
      
      console.log('✅ Sign out successful');
    } catch (error: any) {
      console.error('❌ Sign out failed:', error.message);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get user emails
   */
  getUserEmails(): UserEmail[] {
    return this.userEmails;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Check if user has verified email
   */
  hasVerifiedEmail(): boolean {
    return this.userEmails.some(email => email.is_verified);
  }

  /**
   * Get primary email
   */
  getPrimaryEmail(): UserEmail | null {
    const primaryEmail = this.userEmails.find(e => e.is_primary && e.is_verified);
    return primaryEmail || this.userEmails.find(e => e.is_verified) || null;
  }

  /**
   * Check if user can receive emails of a specific type
   */
  canReceiveEmails(type: 'marketing' | 'transactional'): boolean {
    const optInKey = type === 'marketing' ? 'opted_in_marketing' : 'opted_in_transactional';
    return this.userEmails.some(e => e.is_verified && e[optInKey]);
  }

  /**
   * Refresh user emails from backend
   */
  async refreshUserEmails(): Promise<void> {
    if (!this.isAuthenticated()) return;
    
    try {
      const emailsData = await apiClient.get('/api/user/emails');
      this.userEmails = emailsData.emails || [];
    } catch (error) {
      console.error('Failed to refresh emails:', error);
    }
  }

  /**
   * Add email to user account
   */
  async addEmail(email: string, optIns: { transactional: boolean; marketing: boolean }): Promise<void> {
    try {
      await apiClient.post('/api/user/emails', {
        email,
        opted_in_transactional: optIns.transactional,
        opted_in_marketing: optIns.marketing
      });

      // Send verification email
      await apiClient.post('/api/user/emails/send-verification', { email });
      
      // Refresh emails
      await this.refreshUserEmails();
    } catch (error) {
      console.error('Failed to add email:', error);
      throw error;
    }
  }

  /**
   * Check username availability
   */
  async checkUsername(username: string): Promise<UsernameValidationResponse> {
    try {
      const response = await apiClient.post('/api/auth/check-username', { username });
      return response.data;
    } catch (error) {
      console.error('Failed to check username:', error);
      throw error;
    }
  }

  /**
   * Set or update username
   */
  async setUsername(username: string): Promise<void> {
    try {
      await apiClient.post('/api/user/username', { username });
      
      // Refresh user data
      if (this.currentUser) {
        const userData = await apiClient.get('/api/user/profile');
        this.currentUser = userData.user;
      }
    } catch (error) {
      console.error('Failed to set username:', error);
      throw error;
    }
  }

  /**
   * Check subscription status using new UUID system
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
      
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/subscription/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
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
   * Legacy method for backward compatibility
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
  async initializeAuth(): Promise<User | null> {
    try {
      const storedToken = await this.getStoredAuthToken();
      
      if (storedToken && this.auth.currentUser) {
        const currentToken = await this.auth.currentUser.getIdToken();
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
   * Get auth version (1 = legacy, 2 = UUID-based)
   */
  getAuthVersion(): 1 | 2 {
    return this.authVersion;
  }

  /**
   * Compatibility method to get legacy AuthUser format
   */
  getLegacyAuthUser(): AuthUser | null {
    if (!this.currentUser) return null;
    
    const primaryEmail = this.getPrimaryEmail();
    
    return {
      uid: this.currentUser.firebase_uid,
      email: primaryEmail?.email,
      displayName: this.currentUser.full_name,
      photoURL: undefined,
      emailVerified: !!primaryEmail?.is_verified
    };
  }
}

// Export singleton instance
export const uuidAuthService = new UUIDAuthService();
export default uuidAuthService;