import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TabNavigator from './src/navigation/TabNavigator';
import ReviewScreen from './src/screens/ReviewScreen';
import AuthScreen from './src/screens/AuthScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
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
          } catch (error) {
            console.error('❌ Token refresh failed on app foreground:', error);
            // Don't immediately sign out - let individual API calls handle 401s
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator 
            initialRouteName="Main"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
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
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
