import { 
  initializeApp, 
  getApps, 
  getApp 
} from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  signInWithCredential,
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
        console.log('🔐 User signed in:', firebaseUser.email);
        
        // Convert Firebase user to our AuthUser type
        this.currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          emailVerified: firebaseUser.emailVerified,
        };

        // Get and store auth token
        const token = await firebaseUser.getIdToken();
        await this.storeAuthToken(token);
        apiClient.setAuthToken(token);

      } else {
        console.log('🔐 User signed out');
        this.currentUser = null;
        await this.clearAuthToken();
        apiClient.clearAuthToken();
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
        emailVerified: firebaseUser.emailVerified,
      };

      this.currentUser = authUser;
      console.log('✅ Sign in successful');
      
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
        emailVerified: firebaseUser.emailVerified,
      };

      this.currentUser = authUser;
      console.log('✅ Account creation successful');
      
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
      
      // Get Google user info
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.data?.idToken) {
        throw new Error('No ID token received from Google');
      }
      
      // Create Firebase credential
      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);
      
      // Sign in to Firebase with Google credential
      const userCredential = await signInWithCredential(this.auth, googleCredential);
      const firebaseUser = userCredential.user;
      
      // Get Firebase auth token
      const token = await firebaseUser.getIdToken();
      
      await this.storeAuthToken(token);
      apiClient.setAuthToken(token);

      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified,
      };

      this.currentUser = authUser;
      console.log('✅ Google sign in successful');
      
      return authUser;
    } catch (error: any) {
      console.error('❌ Google sign in failed:', error.message);
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Sign in was cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Sign in is already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      }
      
      throw new Error('Google sign in failed. Please try again.');
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
      
      // Get Apple credential
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }
      
      // Create Firebase credential
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: credential.realUserStatus,
      });
      
      // Sign in to Firebase with Apple credential
      const userCredential = await signInWithCredential(this.auth, firebaseCredential);
      const firebaseUser = userCredential.user;
      
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

      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified,
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
          ...updates,
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
}

// Export singleton instance
export const authService = new AuthService();
export default authService;