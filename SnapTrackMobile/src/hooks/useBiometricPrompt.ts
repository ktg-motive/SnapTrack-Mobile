/**
 * useBiometricPrompt Hook
 *
 * Handles the logic for prompting users to enable biometric authentication
 * after their first successful login.
 */

import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { biometricService, BiometricCapability } from '../services/biometricService';
import { secureStorageService } from '../services/secureStorageService';

// Storage key for tracking if user has been prompted
const BIOMETRIC_PROMPTED_KEY = '@snaptrack_biometric_prompted';

interface UseBiometricPromptResult {
  shouldShowPrompt: boolean;
  biometricCapability: BiometricCapability | null;
  isLoading: boolean;
  showPrompt: () => void;
  dismissPrompt: () => void;
  enableBiometric: () => Promise<boolean>;
  skipBiometric: () => Promise<void>;
}

export function useBiometricPrompt(): UseBiometricPromptResult {
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if we should show the biometric prompt
   */
  const checkShouldPrompt = useCallback(async () => {
    setIsLoading(true);

    try {
      // Check if biometric is available and enrolled
      const capability = await biometricService.checkBiometricCapability();
      setBiometricCapability(capability);

      if (!capability.isAvailable || !capability.isEnrolled) {
        setShouldShowPrompt(false);
        setIsLoading(false);
        return;
      }

      // Check if biometric is already enabled
      const alreadyEnabled = await secureStorageService.isBiometricEnabled();
      if (alreadyEnabled) {
        setShouldShowPrompt(false);
        setIsLoading(false);
        return;
      }

      // Check if user has already been prompted
      const wasPrompted = await AsyncStorage.getItem(BIOMETRIC_PROMPTED_KEY);
      if (wasPrompted === 'true') {
        setShouldShowPrompt(false);
        setIsLoading(false);
        return;
      }

      // Should show prompt
      setShouldShowPrompt(true);
    } catch (error) {
      console.error('Error checking biometric prompt status:', error);
      setShouldShowPrompt(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkShouldPrompt();
  }, [checkShouldPrompt]);

  /**
   * Manually show the prompt (can be called after login)
   */
  const showPrompt = useCallback(() => {
    if (biometricCapability?.isAvailable && biometricCapability?.isEnrolled) {
      setShouldShowPrompt(true);
    }
  }, [biometricCapability]);

  /**
   * Dismiss the prompt without enabling
   */
  const dismissPrompt = useCallback(() => {
    setShouldShowPrompt(false);
  }, []);

  /**
   * Enable biometric authentication
   * @returns true if successful
   */
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const result = await biometricService.enableBiometric();

      if (result.success) {
        // Mark as prompted so we don't ask again
        await AsyncStorage.setItem(BIOMETRIC_PROMPTED_KEY, 'true');
        setShouldShowPrompt(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }, []);

  /**
   * Skip biometric for now (mark as prompted but don't enable)
   */
  const skipBiometric = useCallback(async () => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_PROMPTED_KEY, 'true');
      setShouldShowPrompt(false);
    } catch (error) {
      console.error('Error skipping biometric:', error);
    }
  }, []);

  /**
   * Reset the prompt flag (useful for testing or after sign out)
   */
  const resetPromptFlag = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_PROMPTED_KEY);
    } catch (error) {
      console.error('Error resetting biometric prompt flag:', error);
    }
  }, []);

  return {
    shouldShowPrompt,
    biometricCapability,
    isLoading,
    showPrompt,
    dismissPrompt,
    enableBiometric,
    skipBiometric
  };
}

export default useBiometricPrompt;
