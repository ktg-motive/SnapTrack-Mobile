/**
 * Firebase Configuration - DO NOT MODIFY
 * 
 * This file contains the production Firebase configuration for SnapTrack.
 * These values are public client-side configuration and are safe to commit.
 * 
 * IMPORTANT: This configuration should NEVER be modified or made dependent
 * on environment variables. It must always work in all environments.
 * 
 * Platform-specific API keys:
 * - Web/JS SDK: Uses the configuration below
 * - iOS: Uses GoogleService-Info.plist
 * - Android: Uses google-services.json
 */

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA6mOB17sDdUZaN3Enmd1j0cBeecJ8BF3k',
  authDomain: 'snaptrack-expense.firebaseapp.com',
  projectId: 'snaptrack-expense',
  storageBucket: 'snaptrack-expense.firebasestorage.app',
  messagingSenderId: '925529316912',
  appId: '1:925529316912:web:d3086c5dde4c1f5f6d57f5'
} as const;

// Google Sign-In Web Client ID (used for OAuth)
export const GOOGLE_WEB_CLIENT_ID = '925529316912-a9sruocj84bbk5jec36s2dnktq601hhd.apps.googleusercontent.com';

// Type assertion to ensure these values are never undefined
export type FirebaseConfig = typeof FIREBASE_CONFIG;