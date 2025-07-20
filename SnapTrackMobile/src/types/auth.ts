// UUID-based Auth Types for SnapTrack Mobile
// Based on EMAIL_USERNAME_MIGRATION_PLAN.md and UUID_AUTH_MOBILE_IMPLEMENTATION.md

export interface User {
  id: string;                    // Our UUID (always present)
  firebase_uid: string;          // Firebase UID (always present)
  auth_version: number;          // 1 = legacy, 2 = UUID-based
  email_username?: string;       // Username part (e.g., 'john-doe')
  email_address?: string;        // Full address (e.g., 'john-doe@app.snaptrack.bot')
  legacy_email?: string;         // Legacy format (e.g., 'expense@johndoe.snaptrack.bot')
  personal_subdomain?: string;   // Legacy subdomain (for backward compatibility)
  email?: string;                // Primary email address
  created_at: string;
  last_active?: string;
  updated_at?: string;
  full_name?: string;            // Display name for the user
}

export interface UserEmail {
  id: string;
  email: string;
  email_type: 'primary' | 'apple_relay' | 'receipt_forward';
  is_verified: boolean;
  is_primary: boolean;
  opted_in_marketing: boolean;
  opted_in_transactional: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  userEmails: UserEmail[];
  isAuthenticated: boolean;
  isLoading: boolean;
  authVersion: 1 | 2;
}

export interface AuthResponse {
  user: {
    id: string;
    firebase_uid: string;
    has_email: boolean;
    email_username?: string;
    auth_version: number;
    full_name?: string;
    personal_subdomain?: string; // Legacy compatibility
  };
  token: string;
  is_new_user: boolean;
  email_verification_needed?: boolean;
  email?: string;
}

export type AuthProvider = 'google' | 'apple' | 'email' | 'anonymous';

// Username validation types
export interface UsernameValidationResponse {
  available: boolean;
  errors: string[];
  suggestions: string[];
}

export interface UsernameChangeRequest {
  new_username: string;
}

// Legacy auth types (keep for backward compatibility)
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  uid: string;
  email?: string;  // Made optional for UUID-based auth
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
}

// Email collection types for onboarding
export interface EmailCollectionData {
  email: string;
  opted_in_transactional: boolean;
  opted_in_marketing: boolean;
}

// Onboarding flow types
export type OnboardingStep = 'email' | 'username' | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  skippedEmail: boolean;
  hasUsername: boolean;
}