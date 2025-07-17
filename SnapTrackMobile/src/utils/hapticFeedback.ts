import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utility for consistent tactile feedback throughout the app
 * Provides semantic naming for different interaction types
 */
export class HapticFeedbackService {
  private static isAvailable = Platform.OS === 'ios'; // Haptics work best on iOS

  /**
   * Light haptic feedback for button presses and light interactions
   */
  static async light(): Promise<void> {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Medium haptic feedback for important actions and confirmations
   */
  static async medium(): Promise<void> {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Heavy haptic feedback for significant actions and alerts
   */
  static async heavy(): Promise<void> {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Success haptic feedback for completed actions
   */
  static async success(): Promise<void> {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Warning haptic feedback for caution states
   */
  static async warning(): Promise<void> {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Error haptic feedback for error states and failed actions
   */
  static async error(): Promise<void> {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Selection haptic feedback for changing selection states
   */
  static async selection(): Promise<void> {
    if (!this.isAvailable) return;
    
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Semantic methods for common UI interactions

  /**
   * Button press feedback - light haptic for most button interactions
   */
  static async buttonPress(): Promise<void> {
    return this.light();
  }

  /**
   * Tab switch feedback - selection haptic for changing tabs
   */
  static async tabSwitch(): Promise<void> {
    return this.selection();
  }

  /**
   * Card tap feedback - medium haptic for card interactions
   */
  static async cardTap(): Promise<void> {
    return this.medium();
  }

  /**
   * Delete action feedback - heavy haptic for destructive actions
   */
  static async deleteAction(): Promise<void> {
    return this.heavy();
  }

  /**
   * Receipt captured feedback - success haptic for successful receipt capture
   */
  static async receiptCaptured(): Promise<void> {
    return this.success();
  }

  /**
   * Navigation feedback - light haptic for navigation transitions
   */
  static async navigation(): Promise<void> {
    return this.light();
  }

  /**
   * Edit mode feedback - medium haptic for entering edit states
   */
  static async editMode(): Promise<void> {
    return this.medium();
  }

  /**
   * Save action feedback - success haptic for successful saves
   */
  static async saveAction(): Promise<void> {
    return this.success();
  }

  /**
   * Error state feedback - error haptic for failed operations
   */
  static async errorState(): Promise<void> {
    return this.error();
  }

  /**
   * Long press feedback - heavy haptic for long press actions
   */
  static async longPress(): Promise<void> {
    return this.heavy();
  }

  /**
   * Refresh action feedback - light haptic for pull-to-refresh
   */
  static async refresh(): Promise<void> {
    return this.light();
  }

  /**
   * Toggle switch feedback - selection haptic for toggle states
   */
  static async toggle(): Promise<void> {
    return this.selection();
  }

  /**
   * Camera focus feedback - light haptic for camera focus
   */
  static async cameraFocus(): Promise<void> {
    return this.light();
  }

  /**
   * Camera capture feedback - medium haptic for taking photos
   */
  static async cameraCapture(): Promise<void> {
    return this.medium();
  }
}

// Export default instance for easier usage
export const hapticFeedback = HapticFeedbackService;