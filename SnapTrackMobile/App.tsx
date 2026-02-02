import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, Platform, Linking, Alert, AppStateStatus, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking as LinkingExpo } from 'react-native';

// Biometric authentication imports
import { appLockService } from './src/services/appLockService';
import { secureStorageService } from './src/services/secureStorageService';
import BiometricUnlockScreen from './src/screens/BiometricUnlockScreen';
import PrivacyOverlay from './src/components/PrivacyOverlay';
import BiometricPromptModal from './src/components/BiometricPromptModal';
import { useBiometricPrompt } from './src/hooks/useBiometricPrompt';

import TabNavigator from './src/navigation/TabNavigator';
import ReviewScreen from './src/screens/ReviewScreen';
import AuthScreen from './src/screens/AuthScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import AccountScreen from './src/screens/AccountScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EnhancedSettingsScreen from './src/screens/EnhancedSettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import ContactScreen from './src/screens/ContactScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import HelpScreen from './src/screens/HelpScreen';
import OnboardingFlow from './src/screens/OnboardingFlow';
import PaidAccountRequiredScreen from './src/screens/onboarding/PaidAccountRequiredScreen';
import AccountCreationInProgressScreen from './src/screens/onboarding/AccountCreationInProgressScreen';
import WelcomeBackScreen from './src/screens/onboarding/WelcomeBackScreen';
import UsernameSettingsScreen from './src/screens/UsernameSettingsScreen';
// New onboarding screens
import NewWelcomeScreen from './src/screens/onboarding/NewWelcomeScreen';
import GetStartedScreen from './src/screens/onboarding/GetStartedScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import IAPWelcomeScreen from './src/screens/IAPWelcomeScreen';
import { colors } from './src/styles/theme';
import { authService } from './src/services/authService.compat';

const Stack = createNativeStackNavigator();

const paperTheme = {
  colors: {
    primary: colors.primary,
    accent: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    text: colors.textPrimary,
  },
};

// Deep linking configuration
const linking = {
  prefixes: ['snaptrack://'],
  config: {
    screens: {
      WelcomeBack: 'auth-complete',
      Main: 'main',
      Auth: 'auth',
      PaidAccountRequired: 'paid-account-required',
      AccountCreationInProgress: 'account-creation-in-progress',
      NewWelcome: 'welcome',
      GetStarted: 'get-started',
      SignUp: 'signup',
    }
  }
};

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const navigationRef = useRef<any>(null);

  // Biometric lock state
  const [isLocked, setIsLocked] = useState(false);
  const [showPrivacyOverlay, setShowPrivacyOverlay] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Biometric first-login prompt
  const {
    shouldShowPrompt: showBiometricPrompt,
    biometricCapability,
    enableBiometric,
    skipBiometric,
    dismissPrompt: dismissBiometricPrompt
  } = useBiometricPrompt();

  // Remove duplicate auth check - let AuthScreen handle initial auth state
  useEffect(() => {
    setIsAuthChecked(true);
  }, []);

  // Initialize biometric lock on app start
  useEffect(() => {
    const initializeBiometricLock = async () => {
      try {
        // Migrate tokens from legacy storage
        await secureStorageService.migrateFromAsyncStorage();

        // Check if we should require biometric unlock (cold start)
        const shouldLock = await appLockService.shouldRequireUnlock();
        if (shouldLock) {
          console.log('Biometric unlock required on cold start');
          setIsLocked(true);
        }

        // Start activity monitoring
        appLockService.startActivityMonitoring();
      } catch (error) {
        console.error('Error initializing biometric lock:', error);
      }
    };

    initializeBiometricLock();

    // Cleanup on unmount
    return () => {
      appLockService.stopActivityMonitoring();
    };
  }, []);

  // Subscribe to lock state changes (fix: respond to timer-triggered locks)
  useEffect(() => {
    const unsubscribe = appLockService.addLockStateListener((newState) => {
      if (newState === 'locked' || newState === 'require_auth') {
        setIsLocked(true);
      } else if (newState === 'unlocked') {
        setIsLocked(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle biometric unlock
  const handleBiometricUnlock = useCallback(() => {
    setIsLocked(false);
    appLockService.unlockApp();
  }, []);

  // Handle force logout from biometric screen
  const handleForceLogout = useCallback(async () => {
    setIsLocked(false);
    await authService.signOut();
    navigationRef.current?.navigate('Auth');
  }, []);

  useEffect(() => {
    // Handle deep links
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      if (url.includes('auth-complete')) {
        // Extract parameters from URL
        const urlParts = url.split('?');
        const queryParams = new URLSearchParams(urlParts[1] || '');
        const token = queryParams.get('token');
        const success = queryParams.get('success');
        const error = queryParams.get('error');
        
        if (error) {
          // Handle payment/auth failure
          Alert.alert(
            'Authentication Issue',
            error === 'payment_failed' 
              ? 'There was an issue with your payment. Please try again or contact support.'
              : 'There was an issue with authentication. Please try again.'
          );
          navigationRef.current?.navigate('NewWelcome');
          return;
        }
        
        if (success === 'true' && token) {
          try {
            // Authenticate with token from successful payment
            await authService.authenticateWithToken(token);
            
            // Navigate to main app
            navigationRef.current?.navigate('Main');
            
            // Show success message
            setTimeout(() => {
              Alert.alert(
                'Welcome to SnapTrack!',
                'Your account has been created successfully.'
              );
            }, 500);
          } catch (authError) {
            console.error('Failed to authenticate with token:', authError);
            Alert.alert(
              'Authentication Error',
              'Failed to complete sign in. Please try logging in manually.'
            );
            navigationRef.current?.navigate('Auth');
          }
        } else if (token) {
          // Handle existing user authentication (legacy)
          try {
            await authService.authenticateWithToken(token);
            navigationRef.current?.navigate('WelcomeBack');
          } catch (error) {
            console.error('Failed to authenticate with token:', error);
            navigationRef.current?.navigate('Auth');
          }
        } else {
          // No token provided, navigate to welcome
          navigationRef.current?.navigate('NewWelcome');
        }
      }
    };

    // Listen for deep links
    const urlListener = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      urlListener.remove();
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('App state changed to:', nextAppState);

      // Handle privacy overlay
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        // Show privacy overlay when going to background
        const biometricEnabled = await secureStorageService.isBiometricEnabled();
        if (biometricEnabled) {
          setShowPrivacyOverlay(true);
        }
      } else if (nextAppState === 'active') {
        // Hide privacy overlay
        setShowPrivacyOverlay(false);

        // Handle biometric lock state
        await appLockService.handleAppStateChange(nextAppState);
        const shouldLock = await appLockService.shouldRequireUnlock();

        if (shouldLock) {
          setIsLocked(true);
        }

        // Refresh token if user is authenticated and not locked
        // Note: Use shouldLock (not isLocked) since React state update is async
        const user = authService.getCurrentUser();
        if (user && !isLocked && !shouldLock) {
          try {
            console.log('Refreshing token on app foreground...');
            await authService.refreshToken();
            console.log('Token refresh successful');
          } catch (error) {
            console.error('Token refresh failed on app foreground:', error);
          }
        }
      }

      // Also handle background state for app lock service
      if (nextAppState === 'background') {
        await appLockService.handleAppStateChange(nextAppState);
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Just set loading to false - let AuthScreen handle initial navigation
    setIsLoading(false);

    return () => {
      subscription?.remove();
    };
  }, [isLocked]);

  // Handle navigation when showOnboarding changes
  useEffect(() => {
    if (showOnboarding && navigationRef.current && !isLoading) {
      console.log('🎯 Navigating to Onboarding screen');
      navigationRef.current.navigate('Onboarding');
    }
  }, [showOnboarding, isLoading]);

  // Handle touch events to record user activity (resets idle timeout)
  // IMPORTANT: This hook must be before any early returns to maintain hook order
  const handleTouchActivity = useCallback(() => {
    appLockService.recordActivity();
    return false; // Don't capture the touch, just observe it
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Don't navigate here - let AuthScreen handle navigation
      // Just check if onboarding needs to be shown for authenticated users
      const user = authService.getCurrentUser();
      if (user) {
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        if (!onboardingCompleted) {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // This function should not be called from app foreground events
  const recheckOnboardingStatus = async () => {
    console.log('⚠️ recheckOnboardingStatus called - this should only happen on app launch');
    // Removed - this function was causing navigation issues
  };

  const handleOnboardingComplete = async () => {
    console.log('🎉 App.tsx - handleOnboardingComplete called');
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      console.log('✅ Onboarding completed flag saved to storage');
      setShowOnboarding(false);
      console.log('🔄 setShowOnboarding(false) called');
      
      // Navigate back to Main screen
      if (navigationRef.current) {
        console.log('🏠 Navigating back to Main screen');
        navigationRef.current.navigate('Main');
      }
    } catch (error) {
      console.error('❌ Error saving onboarding completion:', error);
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  console.log('App render - showOnboarding:', showOnboarding, ', isLocked:', isLocked);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        {/* Biometric unlock screen as overlay - keeps NavigationContainer mounted */}
        {isLocked && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
            <BiometricUnlockScreen
              onUnlock={handleBiometricUnlock}
              onForceLogout={handleForceLogout}
            />
          </View>
        )}

        {/* Privacy overlay for app switcher */}
        <PrivacyOverlay visible={showPrivacyOverlay} />

        {/* Biometric prompt modal for first login */}
        <BiometricPromptModal
          visible={showBiometricPrompt}
          capability={biometricCapability}
          onEnable={enableBiometric}
          onSkip={skipBiometric}
          onClose={dismissBiometricPrompt}
        />

        {/* Wrap navigation in View to track user touch activity */}
        <View
          style={{ flex: 1 }}
          onStartShouldSetResponderCapture={handleTouchActivity}
        >
        <NavigationContainer 
          ref={navigationRef} 
          linking={linking}
          onReady={() => {
            console.log('🚀 NavigationContainer ready');
          }}
        >
          <StatusBar 
            style="dark" 
            backgroundColor={colors.background}
            translucent={false}
          />
          <Stack.Navigator 
            initialRouteName="NewWelcome"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
            screenListeners={{
              state: (e) => {
                console.log('🗺️ Navigation state changed:', e.data.state.routes.map(r => r.name).join(' → '));
                // Record user activity on navigation (resets idle timeout)
                appLockService.recordActivity();
              }
            }}
          >
            <Stack.Screen 
              name="Onboarding" 
              options={{ headerShown: false }}
            >
              {(props) => {
                console.log('🎯 OnboardingFlow component being rendered');
                return (
                  <OnboardingFlow 
                    {...props} 
                    onComplete={handleOnboardingComplete}
                  />
                );
              }}
            </Stack.Screen>
            <Stack.Screen 
              name="Main" 
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Review" 
              component={ReviewScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen 
              name="PaidAccountRequired" 
              component={PaidAccountRequiredScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen 
              name="AccountCreationInProgress" 
              component={AccountCreationInProgressScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen 
              name="WelcomeBack" 
              component={WelcomeBackScreen}
              options={{
                headerShown: false,
                animation: 'fade',
              }}
            />
            {/* New onboarding screens */}
            <Stack.Screen 
              name="NewWelcome" 
              component={NewWelcomeScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="GetStarted" 
              component={GetStartedScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerBackTitle: 'Back',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerBackTitle: 'Back',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="IAPWelcome" 
              component={IAPWelcomeScreen}
              options={{
                headerShown: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen 
              name="Feedback" 
              component={FeedbackScreen} 
              options={{ 
                title: 'Feedback',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
              }} 
            />
            <Stack.Screen 
              name="AccountTab" 
              component={AccountScreen} 
              options={{ 
                title: 'Account',
                headerShown: true,
                headerBackVisible: true,
                headerStyle: { 
                  backgroundColor: colors.background,
                },
                headerTintColor: colors.primary,
                headerTitleStyle: {
                  fontSize: 20,
                  fontWeight: '600',
                  color: colors.textPrimary,
                },
              }} 
            />
            <Stack.Screen 
              name="Settings" 
              options={{ 
                title: 'Settings',
                headerShown: true,
                headerBackVisible: true,
                headerStyle: { 
                  backgroundColor: colors.background,
                },
                headerTintColor: colors.primary,
                headerTitleStyle: {
                  fontSize: 20,
                  fontWeight: '600',
                  color: colors.textPrimary,
                },
              }} 
            >
              {(props) => (
                <EnhancedSettingsScreen 
                  {...props} 
                  onRestartOnboarding={() => setShowOnboarding(true)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="About" 
              component={AboutScreen} 
              options={{ 
                title: 'About SnapTrack',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
              }} 
            />
            <Stack.Screen 
              name="Contact" 
              component={ContactScreen} 
              options={{ 
                title: 'Contact Support',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
              }} 
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen} 
              options={{ 
                title: 'Privacy Policy',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
              }} 
            />
            <Stack.Screen 
              name="TermsOfService" 
              component={TermsOfServiceScreen} 
              options={{ 
                title: 'Terms of Service',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
              }} 
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen} 
              options={{ 
                title: 'Edit Profile',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
              }} 
            />
            <Stack.Screen 
              name="UsernameSettings" 
              component={UsernameSettingsScreen} 
              options={{ 
                title: 'Email & Username',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
              }} 
            />
            <Stack.Screen 
              name="Help" 
              component={HelpScreen} 
              options={{ 
                title: 'Help & Support',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
              }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
