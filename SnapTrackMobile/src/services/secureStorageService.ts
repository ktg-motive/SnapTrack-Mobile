/**
 * Secure Storage Service for SnapTrack Mobile
 *
 * Provides biometric-bound secure storage using expo-secure-store.
 * Uses WHEN_UNLOCKED_THIS_DEVICE_ONLY keychain accessibility for maximum security.
 *
 * Key features:
 * - Biometric authentication required for reading sensitive data
 * - Hardware-backed encryption on iOS (Secure Enclave)
 * - One-time migration from AsyncStorage legacy tokens
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
export const SECURE_STORAGE_KEYS = {
  AUTH_TOKEN: 'snaptrack_secure_auth_token',
  REFRESH_TOKEN: 'snaptrack_secure_refresh_token',
  BIOMETRIC_ENABLED: 'snaptrack_biometric_enabled',
  TOKEN_MIGRATED: 'snaptrack_token_migrated',
} as const;

// Legacy AsyncStorage key for migration
const LEGACY_AUTH_TOKEN_KEY = '@snaptrack_auth_token';

// Secure store options for biometric-bound access
const BIOMETRIC_SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  // Require device to be unlocked (keychain accessibility)
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  // Require biometric authentication to read (iOS only)
  // This binds the secret to the biometric - changing biometrics invalidates
  requireAuthentication: true,
  // Prompt shown during biometric authentication
  authenticationPrompt: 'Authenticate to access your SnapTrack account',
};

// Standard secure options (no biometric required, but still secure)
const STANDARD_SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: false,
};

class SecureStorageService {
  private isMigrationComplete: boolean = false;

  constructor() {
    // Check migration status on init
    this.checkMigrationStatus();
  }

  /**
   * Check if token migration has been completed
   */
  private async checkMigrationStatus(): Promise<void> {
    try {
      const migrated = await SecureStore.getItemAsync(
        SECURE_STORAGE_KEYS.TOKEN_MIGRATED,
        STANDARD_SECURE_OPTIONS
      );
      this.isMigrationComplete = migrated === 'true';
    } catch (error) {
      console.error('Error checking migration status:', error);
      this.isMigrationComplete = false;
    }
  }

  /**
   * Store auth token securely with biometric binding (when enabled)
   * @param token - The auth token to store
   * @param useBiometric - Whether to bind to biometric (default: based on user setting)
   */
  async setAuthToken(token: string, useBiometric?: boolean): Promise<void> {
    try {
      // Check if biometric is enabled if not explicitly specified
      const biometricEnabled = useBiometric ?? (await this.isBiometricEnabled());

      const options = biometricEnabled
        ? BIOMETRIC_SECURE_OPTIONS
        : STANDARD_SECURE_OPTIONS;

      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEYS.AUTH_TOKEN,
        token,
        options
      );

      console.log('Secure auth token stored successfully (biometric:', biometricEnabled, ')');
    } catch (error) {
      console.error('Failed to store auth token securely:', error);
      throw new Error('Failed to store authentication token securely');
    }
  }

  /**
   * Retrieve auth token from secure storage
   * Will prompt for biometric if biometric-bound
   * @returns The stored auth token or null
   */
  async getAuthToken(): Promise<string | null> {
    try {
      const biometricEnabled = await this.isBiometricEnabled();

      const options = biometricEnabled
        ? BIOMETRIC_SECURE_OPTIONS
        : STANDARD_SECURE_OPTIONS;

      const token = await SecureStore.getItemAsync(
        SECURE_STORAGE_KEYS.AUTH_TOKEN,
        options
      );

      return token;
    } catch (error: any) {
      // Handle biometric authentication failure
      if (error.message?.includes('authentication') ||
          error.message?.includes('canceled') ||
          error.message?.includes('User canceled')) {
        console.log('Biometric authentication required but not provided');
        throw new Error('BIOMETRIC_REQUIRED');
      }

      console.error('Failed to retrieve auth token:', error);
      return null;
    }
  }

  /**
   * Clear auth token from secure storage
   */
  async clearAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.AUTH_TOKEN);
      console.log('Auth token cleared from secure storage');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  /**
   * Clear all secure storage data (for sign out or security wipe)
   */
  async clearAllSecureData(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.AUTH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.REFRESH_TOKEN),
        // Don't clear BIOMETRIC_ENABLED or TOKEN_MIGRATED - those are preferences
      ]);
      console.log('All secure data cleared');
    } catch (error) {
      console.error('Failed to clear secure data:', error);
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_ENABLED,
        STANDARD_SECURE_OPTIONS
      );
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check biometric status:', error);
      return false;
    }
  }

  /**
   * Enable or disable biometric authentication
   * When enabling, re-stores the token with biometric binding
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      // Store the preference
      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_ENABLED,
        enabled ? 'true' : 'false',
        STANDARD_SECURE_OPTIONS
      );

      // If we have a stored token, re-store it with/without biometric binding
      // First, try to get the current token without biometric
      const currentToken = await SecureStore.getItemAsync(
        SECURE_STORAGE_KEYS.AUTH_TOKEN,
        STANDARD_SECURE_OPTIONS
      );

      if (currentToken) {
        // Re-store with new biometric setting
        await this.setAuthToken(currentToken, enabled);
      }

      console.log('Biometric authentication', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Failed to set biometric status:', error);
      throw error;
    }
  }

  /**
   * Migrate token from AsyncStorage (legacy) to SecureStore
   * Should be called once during app upgrade
   */
  async migrateFromAsyncStorage(): Promise<boolean> {
    // Skip if already migrated
    if (this.isMigrationComplete) {
      console.log('Token migration already complete');
      return true;
    }

    try {
      // Check for legacy token
      const legacyToken = await AsyncStorage.getItem(LEGACY_AUTH_TOKEN_KEY);

      if (legacyToken) {
        console.log('Found legacy token, migrating to secure storage...');

        // Store in secure storage (without biometric initially - user can enable later)
        await this.setAuthToken(legacyToken, false);

        // Clear legacy storage
        await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);

        console.log('Token migration successful');
      } else {
        console.log('No legacy token found, migration not needed');
      }

      // Mark migration as complete
      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEYS.TOKEN_MIGRATED,
        'true',
        STANDARD_SECURE_OPTIONS
      );

      this.isMigrationComplete = true;
      return true;
    } catch (error) {
      console.error('Token migration failed:', error);
      return false;
    }
  }

  /**
   * Store a generic value securely (non-biometric)
   */
  async setSecureValue(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, STANDARD_SECURE_OPTIONS);
    } catch (error) {
      console.error(`Failed to store secure value for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a generic value from secure storage (non-biometric)
   */
  async getSecureValue(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key, STANDARD_SECURE_OPTIONS);
    } catch (error) {
      console.error(`Failed to retrieve secure value for ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a generic value from secure storage
   */
  async deleteSecureValue(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to delete secure value for ${key}:`, error);
    }
  }
}

// Export singleton instance
export const secureStorageService = new SecureStorageService();
export default secureStorageService;
