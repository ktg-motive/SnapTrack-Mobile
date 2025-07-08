import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import OnboardingFlow from './src/screens/OnboardingFlow';
import { colors } from './src/styles/theme';
import { authService } from './src/services/authService';

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

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      console.log('🔄 App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        // App came to foreground - refresh token if user is authenticated
        const user = authService.getCurrentUser();
        if (user) {
          try {
            console.log('🔐 Refreshing token on app foreground...');
            await authService.refreshToken();
            console.log('✅ Token refresh successful');
            
            // Also check if onboarding should be shown (in case it was cleared)
            console.log('🔄 About to call recheckOnboardingStatus...');
            await recheckOnboardingStatus();
          } catch (error) {
            console.error('❌ Token refresh failed on app foreground:', error);
            // Don't immediately sign out - let individual API calls handle 401s
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Check onboarding status when app loads
    checkOnboardingStatus();
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // Handle navigation when showOnboarding changes
  useEffect(() => {
    if (showOnboarding && navigationRef.current && !isLoading) {
      console.log('🎯 Navigating to Onboarding screen');
      navigationRef.current.navigate('Onboarding');
    }
  }, [showOnboarding, isLoading]);

  const checkOnboardingStatus = async () => {
    try {
      const user = authService.getCurrentUser();
      if (user) {
        // Check if user has completed onboarding
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

  const recheckOnboardingStatus = async () => {
    try {
      console.log('🔍 Rechecking onboarding status...');
      const user = authService.getCurrentUser();
      console.log('👤 Current user:', user ? 'authenticated' : 'not authenticated');
      if (user) {
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        console.log('📋 Onboarding completed flag:', onboardingCompleted);
        if (!onboardingCompleted) {
          console.log('🚀 Setting showOnboarding to true');
          setShowOnboarding(true);
          console.log('📱 showOnboarding state should now be true');
        } else {
          console.log('✅ Onboarding already completed, not showing');
        }
      } else {
        console.log('❌ No user authenticated, not showing onboarding');
      }
    } catch (error) {
      console.error('❌ Error rechecking onboarding status:', error);
    }
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

  console.log('📺 App render - showOnboarding:', showOnboarding);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="auto" />
          <Stack.Navigator 
            initialRouteName="Main"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
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
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
              }} 
            />
            <Stack.Screen 
              name="Settings" 
              options={{ 
                title: 'Settings',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
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
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
