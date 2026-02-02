/**
 * App Lock Service for SnapTrack Mobile
 *
 * Tracks user activity and determines when the app should be locked.
 * Implements a 15-minute idle timeout for security.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorageService } from './secureStorageService';

// Storage keys
const LAST_ACTIVITY_KEY = '@snaptrack_last_activity';
const APP_LOCK_STATE_KEY = '@snaptrack_app_lock_state';

// Idle timeout in milliseconds (15 minutes)
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

// Lock state
export type LockState = 'unlocked' | 'locked' | 'require_auth';

// Lock state change callback
export type LockStateCallback = (state: LockState) => void;

class AppLockService {
  private lastActivityTime: number = Date.now();
  private lockState: LockState = 'unlocked';
  private stateListeners: Set<LockStateCallback> = new Set();
  private activityTimer: NodeJS.Timeout | null = null;
  private isColdStart: boolean = true;

  constructor() {
    this.loadLastActivity();
  }

  /**
   * Load last activity time from storage
   */
  private async loadLastActivity(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      if (stored) {
        this.lastActivityTime = parseInt(stored, 10);
      }
    } catch (error) {
      console.error('Failed to load last activity time:', error);
    }
  }

  /**
   * Save last activity time to storage
   */
  private async saveLastActivity(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        LAST_ACTIVITY_KEY,
        this.lastActivityTime.toString()
      );
    } catch (error) {
      console.error('Failed to save last activity time:', error);
    }
  }

  /**
   * Record user activity (call on any user interaction)
   */
  recordActivity(): void {
    this.lastActivityTime = Date.now();
    this.saveLastActivity();

    // If we're locked but activity is recorded, something is wrong
    // This shouldn't happen in normal flow
    if (this.lockState === 'locked') {
      console.warn('Activity recorded while app is locked');
    }
  }

  /**
   * Check if idle timeout has been reached
   */
  hasIdleTimeoutExpired(): boolean {
    const now = Date.now();
    const elapsed = now - this.lastActivityTime;
    return elapsed >= IDLE_TIMEOUT_MS;
  }

  /**
   * Get time until idle timeout (for UI display)
   * Returns milliseconds remaining, or 0 if already expired
   */
  getTimeUntilTimeout(): number {
    const now = Date.now();
    const elapsed = now - this.lastActivityTime;
    const remaining = IDLE_TIMEOUT_MS - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Check if this is a cold start (app was killed and relaunched)
   */
  isColdStartLaunch(): boolean {
    return this.isColdStart;
  }

  /**
   * Mark cold start as handled
   */
  markColdStartHandled(): void {
    this.isColdStart = false;
  }

  /**
   * Check if app should be locked based on biometric settings and state
   * Call this when:
   * - App comes to foreground
   * - App is launched (cold start)
   */
  async shouldRequireUnlock(): Promise<boolean> {
    // Check if biometric is enabled
    const biometricEnabled = await secureStorageService.isBiometricEnabled();

    if (!biometricEnabled) {
      return false;
    }

    // Always require auth on cold start
    if (this.isColdStart) {
      return true;
    }

    // Check if idle timeout expired
    if (this.hasIdleTimeoutExpired()) {
      return true;
    }

    // Check if lock state is already set to require auth
    if (this.lockState === 'locked' || this.lockState === 'require_auth') {
      return true;
    }

    return false;
  }

  /**
   * Lock the app (call when going to background or on timeout)
   */
  async lockApp(): Promise<void> {
    const biometricEnabled = await secureStorageService.isBiometricEnabled();

    if (!biometricEnabled) {
      return;
    }

    this.lockState = 'locked';
    this.notifyListeners();
  }

  /**
   * Set app to require authentication (used on cold start)
   */
  setRequireAuth(): void {
    this.lockState = 'require_auth';
    this.notifyListeners();
  }

  /**
   * Unlock the app (call after successful biometric auth)
   */
  unlockApp(): void {
    this.lockState = 'unlocked';
    this.lastActivityTime = Date.now();
    this.saveLastActivity();
    this.markColdStartHandled();
    this.notifyListeners();
  }

  /**
   * Get current lock state
   */
  getLockState(): LockState {
    return this.lockState;
  }

  /**
   * Check if app is currently locked
   */
  isLocked(): boolean {
    return this.lockState !== 'unlocked';
  }

  /**
   * Subscribe to lock state changes
   */
  addLockStateListener(callback: LockStateCallback): () => void {
    this.stateListeners.add(callback);
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of lock state change
   */
  private notifyListeners(): void {
    this.stateListeners.forEach((callback) => {
      try {
        callback(this.lockState);
      } catch (error) {
        console.error('Error in lock state listener:', error);
      }
    });
  }

  /**
   * Start activity monitoring timer
   * Checks every minute if idle timeout is reached
   */
  startActivityMonitoring(): void {
    this.stopActivityMonitoring();

    this.activityTimer = setInterval(async () => {
      const biometricEnabled = await secureStorageService.isBiometricEnabled();

      if (biometricEnabled && this.hasIdleTimeoutExpired() && this.lockState === 'unlocked') {
        console.log('Idle timeout reached, locking app');
        this.lockApp();
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop activity monitoring timer
   */
  stopActivityMonitoring(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  /**
   * Reset all state (call on sign out)
   */
  async reset(): Promise<void> {
    this.lockState = 'unlocked';
    this.lastActivityTime = Date.now();
    this.isColdStart = true;
    this.stopActivityMonitoring();

    try {
      await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch (error) {
      console.error('Failed to reset app lock state:', error);
    }
  }

  /**
   * Handle app state change (foreground/background)
   * @param nextAppState - 'active', 'inactive', or 'background'
   */
  async handleAppStateChange(nextAppState: string): Promise<void> {
    const biometricEnabled = await secureStorageService.isBiometricEnabled();

    if (nextAppState === 'active') {
      // App came to foreground
      if (biometricEnabled && (this.hasIdleTimeoutExpired() || this.lockState === 'locked')) {
        this.setRequireAuth();
      } else if (this.lockState !== 'require_auth') {
        // Resume normal state
        this.lockState = 'unlocked';
        this.notifyListeners();
      }
    } else if (nextAppState === 'background') {
      // App went to background - lock if biometric enabled
      if (biometricEnabled) {
        await this.lockApp();
      }
    }
    // 'inactive' state (iOS only, when sliding down notification center, etc.)
    // Don't change lock state for inactive
  }
}

// Export singleton instance
export const appLockService = new AppLockService();
export default appLockService;
