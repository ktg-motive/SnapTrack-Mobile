import Constants from 'expo-constants';

export const CONFIG = {
  API_BASE_URL: __DEV__ 
    ? 'https://snaptrack-receipts-6b4ae7a14b3e.herokuapp.com' // Use prod for now since no local dev
    : 'https://snaptrack-receipts-6b4ae7a14b3e.herokuapp.com',
  
  FIREBASE_CONFIG: {
    // Firebase configuration from Firebase console
    apiKey: "AIzaSyA6mOB17sDdUZaN3Enmd1j0cBeecJ8BF3k",
    authDomain: "snaptrack-expense.firebaseapp.com",
    projectId: "snaptrack-expense",
    storageBucket: "snaptrack-expense.firebasestorage.app",
    messagingSenderId: "925529316912",
    appId: "1:925529316912:web:d3086c5dde4c1f5f6d57f5"
  },
  
  // Google Sign-In Configuration  
  GOOGLE_WEB_CLIENT_ID: "925529316912-a9sruocj84bbk5jec36s2dnktq601hhd.apps.googleusercontent.com",
  
  APP_VERSION: Constants.expoConfig?.version || '1.0.0',
  
  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/heic'],
  
  // OCR Configuration
  OCR_CONFIDENCE_THRESHOLD: 0.7,
  
  // Offline Configuration
  SYNC_INTERVAL: 30000, // 30 seconds
  MAX_OFFLINE_ITEMS: 100,
};