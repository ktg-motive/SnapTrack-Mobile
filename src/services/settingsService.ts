import AsyncStorage from '@react-native-async-storage/async-storage';
import { shareService } from './shareService';

export interface AppSettings {
  autoSaveToCameraRoll: boolean;
  // Add more settings here in the future
}

const DEFAULT_SETTINGS: AppSettings = {
  autoSaveToCameraRoll: false,
};

const SETTINGS_STORAGE_KEY = '@snaptrack_app_settings';

export class SettingsService {
  private settings: AppSettings = DEFAULT_SETTINGS;
  private isLoaded: boolean = false;

  /**
   * Load settings from AsyncStorage
   */
  async loadSettings(): Promise<AppSettings> {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        this.settings = { ...DEFAULT_SETTINGS, ...parsedSettings };
      } else {
        this.settings = DEFAULT_SETTINGS;
      }
      
      this.isLoaded = true;
      
      // Sync with shareService
      await shareService.updateConfig({
        autoSaveToCameraRoll: this.settings.autoSaveToCameraRoll,
      });
      
      console.log('✅ Settings loaded:', this.settings);
      return this.settings;
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      this.settings = DEFAULT_SETTINGS;
      this.isLoaded = true;
      return this.settings;
    }
  }

  /**
   * Save settings to AsyncStorage
   */
  async saveSettings(newSettings: Partial<AppSettings>): Promise<boolean> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      
      // Sync with shareService
      await shareService.updateConfig({
        autoSaveToCameraRoll: this.settings.autoSaveToCameraRoll,
      });
      
      console.log('✅ Settings saved:', this.settings);
      return true;
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      return false;
    }
  }

  /**
   * Get current settings (load if not already loaded)
   */
  async getSettings(): Promise<AppSettings> {
    if (!this.isLoaded) {
      await this.loadSettings();
    }
    return this.settings;
  }

  /**
   * Get a specific setting
   */
  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const settings = await this.getSettings();
    return settings[key];
  }

  /**
   * Update a specific setting
   */
  async updateSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<boolean> {
    return this.saveSettings({ [key]: value } as Partial<AppSettings>);
  }

  /**
   * Reset all settings to defaults
   */
  async resetSettings(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
      this.settings = DEFAULT_SETTINGS;
      this.isLoaded = true;
      
      // Sync with shareService
      await shareService.updateConfig({
        autoSaveToCameraRoll: this.settings.autoSaveToCameraRoll,
      });
      
      console.log('✅ Settings reset to defaults');
      return true;
    } catch (error) {
      console.error('❌ Failed to reset settings:', error);
      return false;
    }
  }

  /**
   * Check if settings have been loaded
   */
  isSettingsLoaded(): boolean {
    return this.isLoaded;
  }
}

// Export singleton instance
export const settingsService = new SettingsService();