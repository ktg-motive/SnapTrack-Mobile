// Auth Service Compatibility Layer
// Provides backward compatibility while migrating to UUID-based auth

import { uuidAuthService } from './authService.uuid';
import { AuthUser, AuthCredentials } from '../types';

/**
 * Compatibility wrapper that provides the same interface as the old authService
 * but uses the new UUID-based system under the hood
 */
class AuthServiceCompatibility {
  // Delegate all new methods to the UUID service
  get currentUser() {
    return uuidAuthService.getCurrentUser();
  }

  get userEmails() {
    return uuidAuthService.getUserEmails();
  }

  isAuthenticated() {
    return uuidAuthService.isAuthenticated();
  }

  hasVerifiedEmail() {
    return uuidAuthService.hasVerifiedEmail();
  }

  getPrimaryEmail() {
    return uuidAuthService.getPrimaryEmail();
  }

  canReceiveEmails(type: 'marketing' | 'transactional') {
    return uuidAuthService.canReceiveEmails(type);
  }

  async refreshUserEmails() {
    return uuidAuthService.refreshUserEmails();
  }

  async addEmail(email: string, optIns: { transactional: boolean; marketing: boolean }) {
    return uuidAuthService.addEmail(email, optIns);
  }

  async checkUsername(username: string) {
    return uuidAuthService.checkUsername(username);
  }

  async setUsername(username: string) {
    return uuidAuthService.setUsername(username);
  }

  // Legacy compatibility methods - convert between old and new interfaces
  
  /**
   * Legacy method: Get current user in old AuthUser format
   */
  getCurrentUser(): AuthUser | null {
    return uuidAuthService.getLegacyAuthUser();
  }

  /**
   * Legacy method: Sign in with email/password
   */
  async signIn(credentials: AuthCredentials): Promise<AuthUser> {
    const user = await uuidAuthService.signIn(credentials);
    const legacyUser = uuidAuthService.getLegacyAuthUser();
    if (!legacyUser) {
      throw new Error('Failed to get user data after sign in');
    }
    return legacyUser;
  }

  /**
   * Legacy method: Sign up with email/password
   */
  async signUp(credentials: AuthCredentials): Promise<AuthUser> {
    const user = await uuidAuthService.signUp(credentials);
    const legacyUser = uuidAuthService.getLegacyAuthUser();
    if (!legacyUser) {
      throw new Error('Failed to get user data after sign up');
    }
    return legacyUser;
  }

  /**
   * Enhanced method: Sign in with Google (email-optional)
   */
  async signInWithGoogle(): Promise<AuthUser> {
    const user = await uuidAuthService.signInWithGoogle();
    const legacyUser = uuidAuthService.getLegacyAuthUser();
    if (!legacyUser) {
      throw new Error('Failed to get user data after Google sign in');
    }
    return legacyUser;
  }

  /**
   * Enhanced method: Sign in with Apple (email-optional)
   */
  async signInWithApple(): Promise<AuthUser> {
    const user = await uuidAuthService.signInWithApple();
    const legacyUser = uuidAuthService.getLegacyAuthUser();
    if (!legacyUser) {
      throw new Error('Failed to get user data after Apple sign in');
    }
    return legacyUser;
  }

  /**
   * Legacy method: Sign out
   */
  async signOut(): Promise<void> {
    return uuidAuthService.signOut();
  }

  /**
   * Legacy method: Check subscription status
   */
  async checkSubscriptionStatus() {
    return uuidAuthService.checkSubscriptionStatus();
  }

  /**
   * Legacy method: Check paid account status
   */
  async checkPaidAccountStatus(): Promise<boolean> {
    return uuidAuthService.checkPaidAccountStatus();
  }

  /**
   * Legacy method: Initialize auth
   */
  async initializeAuth(): Promise<AuthUser | null> {
    const user = await uuidAuthService.initializeAuth();
    return uuidAuthService.getLegacyAuthUser();
  }

  /**
   * Legacy method: Update profile
   */
  async updateProfile(updates: Partial<Pick<AuthUser, 'displayName' | 'photoURL'>>): Promise<void> {
    // For now, this just logs - we'll implement user profile updates later
    console.log('Profile update requested:', updates);
    // TODO: Implement profile updates in UUID system
  }

  /**
   * Legacy method: Get current token
   */
  async getCurrentToken(): Promise<string | null> {
    // This needs to be implemented in the UUID service if needed
    return null;
  }

  /**
   * Legacy method: Refresh token
   */
  async refreshToken(): Promise<string | null> {
    // This needs to be implemented in the UUID service if needed
    return null;
  }

  // Platform availability checks
  isGoogleSignInAvailable(): boolean {
    try {
      return require('@react-native-google-signin/google-signin').GoogleSignin !== null;
    } catch {
      return false;
    }
  }

  isAppleSignInAvailable(): boolean {
    try {
      return require('expo-apple-authentication') !== null;
    } catch {
      return false;
    }
  }

  // Redirect methods (kept for compatibility)
  async redirectToWebSignup(): Promise<void> {
    // This method is deprecated in UUID auth - users can sign up directly in app
    console.warn('redirectToWebSignup is deprecated - users can sign up directly in app');
  }

  async handlePaymentComplete(url: string): Promise<boolean> {
    // This method is deprecated in UUID auth - payments handled differently
    console.warn('handlePaymentComplete is deprecated - payments handled through RevenueCat');
    return false;
  }

  async authenticateWithToken(token: string): Promise<AuthUser> {
    // This method is deprecated in UUID auth
    console.warn('authenticateWithToken is deprecated in UUID auth');
    throw new Error('Method not supported in UUID auth');
  }
}

// Export singleton instance for backward compatibility
export const authService = new AuthServiceCompatibility();
export default authService;