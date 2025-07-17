import Constants from 'expo-constants';
import { FIREBASE_CONFIG, GOOGLE_WEB_CLIENT_ID } from './firebase.config';

export const CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://snaptrack-receipts-6b4ae7a14b3e.herokuapp.com',
  
  // Firebase configuration is hardcoded and immutable - see firebase.config.ts
  FIREBASE_CONFIG,
  
  // Google Sign-In Configuration is hardcoded and immutable
  GOOGLE_WEB_CLIENT_ID,
  
  APP_VERSION: Constants.expoConfig?.version || '1.0.0',
  
  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/heic'],
  
  // OCR Configuration
  OCR_CONFIDENCE_THRESHOLD: 0.7,
  
  // Offline Configuration
  SYNC_INTERVAL: 30000, // 30 seconds
  MAX_OFFLINE_ITEMS: 100
};