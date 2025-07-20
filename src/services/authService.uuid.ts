import { 
  initializeApp, 
  getApps, 
  getApp 
} from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  User as FirebaseUser,
  Auth,
  signOut as firebaseSignOut,
  onAuthStateChanged
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
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

import { CONFIG } from '../config';
import { apiClient } from './apiClient';

// Types for UUID-based auth
export interface User {
  id: string;                    // Our UUID (always present)
  firebase_uid: string;          // Firebase UID (always present)
  auth_version: number;          // 1 = legacy, 2 = UUID-based
  email_username?: string;       // For receipt forwarding
  created_at: string;
  last_active: string;
  has_email?: boolean;           // For v2 users
  email?: string;                // For v1 users
}

export interface UserEmail {
  id: string;
  email: string;
  email_type: 'primary' | 'apple_relay' | 'receipt_forward';
  is_verified: boolean;
  is_primary: boolean;
  opted_in_marketing: boolean;
  opted_in_transactional: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: {
    id: string;
    firebase_uid: string;
    has_email: boolean;
    email_username?: string;
    auth_version: number;
    email?: string; // For v1 compatibility
  };
  token: string;
  is_new_user: boolean;
  email_verification_needed?: boolean;
}

export interface AuthState {
  user: User | null;
  userEmails: UserEmail[];
  isAuthenticated: boolean;
  isLoading: boolean;
  authVersion: 1 | 2;
}

export type AuthProvider = 'google' | 'apple' | 'email' | 'anonymous';

const UNIVERSAL_AUTH_URL = 'https://snaptrack-receipts-6b4ae7a14b3e.herokuapp.com/api/auth/universal';

class UUIDAuthService {
  private auth: Auth;
  private currentUser: User | null = null;
  private userEmails: UserEmail[] = [];
  private authStateListeners: ((state: AuthState) => void)[] = [];

  constructor() {
    // Initialize Firebase if not already initialized
    const app = getApps().length === 0 
      ? initializeApp(CONFIG.FIREBASE_CONFIG)
      : getApp();
    
    // Initialize Auth - Firebase v9+ handles React Native persistence automatically
    this.auth = getApps().length === 0 
      ? initializeAuth(app, {
          // AsyncStorage persistence is automatic in React Native
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
        offlineAccess: false,
      });
    }
  }

  private initializeAuthListener() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔐 Firebase user signed in:', firebaseUser.email || firebaseUser.uid);
        await this.handleFirebaseUser(firebaseUser);
      } else {
        console.log('🔐 Firebase user signed out');
        await this.handleSignOut();
      }
    });
  }

  private async handleFirebaseUser(firebaseUser: FirebaseUser) {
    try {
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Store token for API requests
      await AsyncStorage.setItem('auth_token', idToken);
      apiClient.setAuthToken(idToken);
      
      // Get user data from our backend (if already authenticated)
      const storedUserId = await AsyncStorage.getItem('snaptrack_user_id');
      if (storedUserId) {
        // User already authenticated with backend, just fetch latest data
        try {
          const userResponse = await fetch(`${CONFIG.API_URL}/user/profile`, {
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            this.currentUser = userData.user;
            
            // Get user emails
            const emailsResponse = await fetch(`${CONFIG.API_URL}/user/emails`, {
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (emailsResponse.ok) {
              const emailsData = await emailsResponse.json();
              this.userEmails = emailsData.emails || [];
            }
            
            this.notifyAuthStateChange();
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      }
    } catch (error) {
      console.error('Failed to handle Firebase user:', error);
    }
  }

  private async handleSignOut() {
    await AsyncStorage.multiRemove([
      'auth_token',
      'snaptrack_user_id',
      'snaptrack_jwt_token',
      'show_onboarding',
      'prompt_for_email'
    ]);
    apiClient.clearAuthToken();
    
    this.currentUser = null;
    this.userEmails = [];
    this.notifyAuthStateChange();
  }

  private notifyAuthStateChange() {
    const state: AuthState = {
      user: this.currentUser,
      userEmails: this.userEmails,
      isAuthenticated: !!this.currentUser,
      isLoading: false,
      authVersion: this.currentUser?.auth_version || 2
    };
    
    this.authStateListeners.forEach(listener => listener(state));
  }

  /**
   * Sign in with Google using the universal auth endpoint
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    if (!GoogleSignin) {
      throw new Error('Google Sign-In is not available in this environment. Please use a development build.');
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
      
      // Create Firebase credential
      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);
      
      // Sign in to Firebase with Google credential
      const userCredential = await signInWithCredential(this.auth, googleCredential);
      const firebaseToken = await userCredential.user.getIdToken();
      console.log('🔥 Firebase sign-in successful');
      
      // Call our universal auth endpoint
      const response = await fetch(UNIVERSAL_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          firebase_token: firebaseToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const authData: AuthResponse = await response.json();
      console.log('✅ Universal auth successful:', {
        userId: authData.user.id,
        hasEmail: authData.user.has_email,
        isNewUser: authData.is_new_user,
        authVersion: authData.user.auth_version
      });
      
      // Store auth data
      await AsyncStorage.setItem('snaptrack_user_id', authData.user.id);
      await AsyncStorage.setItem('snaptrack_jwt_token', authData.token);
      apiClient.setAuthToken(authData.token);
      
      // Update current user
      this.currentUser = {
        id: authData.user.id,
        firebase_uid: authData.user.firebase_uid,
        auth_version: authData.user.auth_version,
        email_username: authData.user.email_username,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        has_email: authData.user.has_email,
        email: authData.user.email
      };
      
      // Handle new user onboarding
      if (authData.is_new_user) {
        await AsyncStorage.setItem('show_onboarding', 'true');
      }
      
      // Fetch user emails
      await this.refreshUserEmails();
      
      this.notifyAuthStateChange();
      
      return authData;
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
   * Sign in with Apple using the universal auth endpoint
   */
  async signInWithApple(): Promise<AuthResponse> {
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
      
      // Generate a random nonce for security (required by Firebase)
      const rawNonce = this.generateNonce();
      const hashedNonce = await this.sha256(rawNonce);
      
      console.log('🍎 Generated nonce for Apple Sign-In');
      
      // Get Apple credential with nonce
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      
      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }
      
      console.log('🍎 Apple credential received:', {
        hasIdentityToken: !!credential.identityToken,
        hasAuthorizationCode: !!credential.authorizationCode,
        email: credential.email,
        realUserStatus: credential.realUserStatus
      });
      
      // Create Firebase credential with raw nonce
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: rawNonce, // Use the raw nonce, not hashed
      });
      
      // Sign in to Firebase with Apple credential
      const userCredential = await signInWithCredential(this.auth, firebaseCredential);
      const firebaseToken = await userCredential.user.getIdToken();
      console.log('🔥 Firebase Apple sign-in successful');
      
      // Extract Apple data
      const appleData: any = {
        provider: 'apple',
        firebase_token: firebaseToken
      };
      
      // Add Apple-specific data if available
      if (credential.user) {
        appleData.provider_data = {
          apple_user: credential.user
        };
      }
      
      if (credential.fullName) {
        const { givenName, familyName } = credential.fullName;
        if (givenName || familyName) {
          appleData.provider_data = {
            ...appleData.provider_data,
            full_name: [givenName, familyName].filter(Boolean).join(' ')
          };
        }
      }
      
      if (credential.email) {
        appleData.provider_data = {
          ...appleData.provider_data,
          email: credential.email
        };
      }
      
      // Call our universal auth endpoint
      const response = await fetch(UNIVERSAL_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const authData: AuthResponse = await response.json();
      console.log('✅ Universal auth successful:', {
        userId: authData.user.id,
        hasEmail: authData.user.has_email,
        isNewUser: authData.is_new_user,
        authVersion: authData.user.auth_version
      });
      
      // Store auth data
      await AsyncStorage.setItem('snaptrack_user_id', authData.user.id);
      await AsyncStorage.setItem('snaptrack_jwt_token', authData.token);
      apiClient.setAuthToken(authData.token);
      
      // Update current user
      this.currentUser = {
        id: authData.user.id,
        firebase_uid: authData.user.firebase_uid,
        auth_version: authData.user.auth_version,
        email_username: authData.user.email_username,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        has_email: authData.user.has_email,
        email: authData.user.email
      };
      
      // Handle new user onboarding
      if (authData.is_new_user) {
        await AsyncStorage.setItem('show_onboarding', 'true');
        
        // If Apple didn't provide email, we might want to ask
        if (!authData.user.has_email) {
          await AsyncStorage.setItem('prompt_for_email', 'true');
        }
      }
      
      // Fetch user emails
      await this.refreshUserEmails();
      
      this.notifyAuthStateChange();
      
      return authData;
    } catch (error: any) {
      console.error('❌ Apple sign in failed:', error);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Sign in was cancelled');
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        throw new Error('Invalid response from Apple');
      }
      
      throw new Error('Apple sign in failed. Please try again.');
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
      
      // Sign out from Firebase
      await firebaseSignOut(this.auth);
      
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
   * Get primary email (if any)
   */
  getPrimaryEmail(): UserEmail | null {
    const primaryEmail = this.userEmails.find(e => e.is_primary && e.is_verified);
    return primaryEmail || this.userEmails.find(e => e.is_verified) || null;
  }

  /**
   * Check if user has a verified email
   */
  hasVerifiedEmail(): boolean {
    return this.userEmails.some(e => e.is_verified);
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
    if (!this.currentUser) return;
    
    try {
      const token = await AsyncStorage.getItem('snaptrack_jwt_token');
      if (!token) return;
      
      const response = await fetch(`${CONFIG.API_URL}/user/emails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.userEmails = data.emails || [];
        this.notifyAuthStateChange();
      }
    } catch (error) {
      console.error('Failed to refresh emails:', error);
    }
  }

  /**
   * Add auth state listener
   */
  addAuthStateListener(listener: (state: AuthState) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Initialize auth on app startup
   */
  async initializeAuth(): Promise<User | null> {
    try {
      // Check if we have stored auth data
      const [userId, jwtToken] = await AsyncStorage.multiGet([
        'snaptrack_user_id',
        'snaptrack_jwt_token'
      ]);
      
      if (userId[1] && jwtToken[1] && this.auth.currentUser) {
        // Set API token
        apiClient.setAuthToken(jwtToken[1]);
        
        // Verify token is still valid by fetching user profile
        const response = await fetch(`${CONFIG.API_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${jwtToken[1]}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          this.currentUser = userData.user;
          
          // Fetch emails
          await this.refreshUserEmails();
          
          this.notifyAuthStateChange();
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
   * Check if Google Sign-In is available
   */
  isGoogleSignInAvailable(): boolean {
    return GoogleSignin !== null;
  }

  /**
   * Check if Apple Sign-In is available
   */
  isAppleSignInAvailable(): boolean {
    return AppleAuthentication !== null && Platform.OS === 'ios';
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
}

// Export singleton instance
export const uuidAuthService = new UUIDAuthService();
export default uuidAuthService;