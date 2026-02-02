/**
 * Biometric Authentication Service for SnapTrack Mobile
 *
 * Handles Face ID / Touch ID authentication using expo-local-authentication.
 *
 * Security features:
 * - disableDeviceFallback: true (no passcode fallback - biometric only)
 * - Hardware-level biometric verification
 * - Clear user prompts explaining data protection
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';
import { secureStorageService } from './secureStorageService';

// Biometric authentication result
export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorType?: 'user_cancel' | 'not_enrolled' | 'not_available' | 'lockout' | 'unknown';
}

// Biometric capability info
export interface BiometricCapability {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: 'face' | 'fingerprint' | 'iris' | 'none';
  biometricTypeDisplay: string;
}

class BiometricService {
  private failedAttempts: number = 0;
  private readonly MAX_FAILED_ATTEMPTS = 3;

  /**
   * Check if device supports and has enrolled biometrics
   */
  async checkBiometricCapability(): Promise<BiometricCapability> {
    try {
      // Check if hardware supports biometrics
      const compatible = await LocalAuthentication.hasHardwareAsync();
      console.log('🔐 checkBiometricCapability - hasHardware:', compatible);

      if (!compatible) {
        return {
          isAvailable: false,
          isEnrolled: false,
          biometricType: 'none',
          biometricTypeDisplay: 'Not Available',
        };
      }

      // Check if biometrics are enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      console.log('🔐 checkBiometricCapability - isEnrolled:', enrolled);

      // Get supported authentication types
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: 'face' | 'fingerprint' | 'iris' | 'none' = 'none';
      let biometricTypeDisplay = 'Biometric';

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'face';
        biometricTypeDisplay = Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint';
        biometricTypeDisplay = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
        biometricTypeDisplay = 'Iris Recognition';
      }

      return {
        isAvailable: compatible,
        isEnrolled: enrolled,
        biometricType,
        biometricTypeDisplay,
      };
    } catch (error) {
      console.error('Error checking biometric capability:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        biometricType: 'none',
        biometricTypeDisplay: 'Not Available',
      };
    }
  }

  /**
   * Authenticate user with biometrics
   * @param promptMessage - Custom message to show in biometric prompt
   * @returns Authentication result
   */
  async authenticate(promptMessage?: string): Promise<BiometricAuthResult> {
    try {
      const capability = await this.checkBiometricCapability();

      if (!capability.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device',
          errorType: 'not_available',
        };
      }

      if (!capability.isEnrolled) {
        return {
          success: false,
          error: `No ${capability.biometricTypeDisplay} enrolled. Please set up ${capability.biometricTypeDisplay} in your device settings.`,
          errorType: 'not_enrolled',
        };
      }

      // Perform biometric authentication
      // IMPORTANT: disableDeviceFallback = true means NO passcode fallback
      console.log('🔐 authenticate - calling LocalAuthentication.authenticateAsync...');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authenticate to access SnapTrack',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true, // No passcode fallback - biometric only
        fallbackLabel: '', // Empty since we disabled fallback
      });
      console.log('🔐 authenticate - result:', JSON.stringify(result));

      if (result.success) {
        // Reset failed attempts on success
        this.failedAttempts = 0;
        return { success: true };
      }

      // Handle failure cases
      this.failedAttempts++;

      if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        return {
          success: false,
          error: 'Authentication cancelled',
          errorType: 'user_cancel',
        };
      }

      if (result.error === 'lockout') {
        return {
          success: false,
          error: `${capability.biometricTypeDisplay} is temporarily locked. Please try again later.`,
          errorType: 'lockout',
        };
      }

      return {
        success: false,
        error: 'Authentication failed. Please try again.',
        errorType: 'unknown',
      };
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      this.failedAttempts++;

      return {
        success: false,
        error: error.message || 'Authentication failed',
        errorType: 'unknown',
      };
    }
  }

  /**
   * Get number of failed authentication attempts
   */
  getFailedAttempts(): number {
    return this.failedAttempts;
  }

  /**
   * Check if max failed attempts reached (should force re-login)
   */
  shouldForceRelogin(): boolean {
    return this.failedAttempts >= this.MAX_FAILED_ATTEMPTS;
  }

  /**
   * Reset failed attempts counter
   */
  resetFailedAttempts(): void {
    this.failedAttempts = 0;
  }

  /**
   * Check if biometric is enabled for the app
   */
  async isBiometricEnabled(): Promise<boolean> {
    return secureStorageService.isBiometricEnabled();
  }

  /**
   * Enable biometric authentication for the app
   * Performs a biometric check first to confirm identity
   */
  async enableBiometric(): Promise<BiometricAuthResult> {
    const capability = await this.checkBiometricCapability();
    console.log('🔐 enableBiometric - capability:', JSON.stringify(capability));

    if (!capability.isAvailable || !capability.isEnrolled) {
      console.log('🔐 enableBiometric - not available or not enrolled');
      return {
        success: false,
        error: `${capability.biometricTypeDisplay} is not available or not set up on this device.`,
        errorType: 'not_available',
      };
    }

    // Authenticate first to confirm identity
    console.log('🔐 enableBiometric - calling authenticate...');
    const authResult = await this.authenticate(
      `Verify your identity to enable ${capability.biometricTypeDisplay}`
    );
    console.log('🔐 enableBiometric - authResult:', JSON.stringify(authResult));

    if (!authResult.success) {
      return authResult;
    }

    // Enable biometric in settings
    try {
      await secureStorageService.setBiometricEnabled(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to enable biometric authentication',
        errorType: 'unknown',
      };
    }
  }

  /**
   * Disable biometric authentication for the app
   * Requires current biometric verification before disabling
   */
  async disableBiometric(): Promise<BiometricAuthResult> {
    const capability = await this.checkBiometricCapability();

    // If biometrics available, verify identity first
    if (capability.isAvailable && capability.isEnrolled) {
      const authResult = await this.authenticate(
        `Verify your identity to disable ${capability.biometricTypeDisplay}`
      );

      if (!authResult.success) {
        return authResult;
      }
    }

    // Disable biometric in settings
    try {
      await secureStorageService.setBiometricEnabled(false);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to disable biometric authentication',
        errorType: 'unknown',
      };
    }
  }

  /**
   * Prompt user to enable biometric (for first-login flow)
   * Returns true if user enabled, false if declined
   */
  async promptToEnableBiometric(): Promise<boolean> {
    return new Promise((resolve) => {
      (async () => {
        const capability = await this.checkBiometricCapability();

        if (!capability.isAvailable || !capability.isEnrolled) {
          resolve(false);
          return;
        }

        Alert.alert(
          `Enable ${capability.biometricTypeDisplay}?`,
          `Use ${capability.biometricTypeDisplay} to quickly and securely unlock SnapTrack and protect your financial data.`,
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Enable',
              onPress: async () => {
                const result = await this.enableBiometric();
                resolve(result.success);
              },
            },
          ],
          { cancelable: false }
        );
      })();
    });
  }
}

// Export singleton instance
export const biometricService = new BiometricService();
export default biometricService;
