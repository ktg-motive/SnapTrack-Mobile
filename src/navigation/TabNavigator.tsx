import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import HelpScreen from '../screens/HelpScreen';
import AccountScreen from '../screens/AccountScreen';
import EnhancedSettingsScreen from '../screens/EnhancedSettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigators for each tab
function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function CaptureStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CaptureMain" component={CameraScreen} />
    </Stack.Navigator>
  );
}

function ReceiptsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReceiptsMain" component={ReceiptsScreen} />
    </Stack.Navigator>
  );
}

function StatisticsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StatisticsMain" component={StatisticsScreen} />
    </Stack.Navigator>
  );
}

function AccountStackNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerStyle: { 
          backgroundColor: colors.background,
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          ...typography.title3,
          color: colors.textPrimary,
          fontWeight: '600',
        },
        headerBackVisible: true,
        headerBackTitleVisible: Platform.OS === 'ios',
      }}
    >
      <Stack.Screen 
        name="AccountMain" 
        component={AccountScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={EnhancedSettingsScreen}
        options={{ 
          title: 'Settings',
          headerBackTitle: 'Account', // Only shown on iOS
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Edit Profile',
          headerBackTitle: 'Account', // Only shown on iOS
        }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ 
          title: 'About SnapTrack',
          headerBackTitle: 'Settings', // Only shown on iOS
        }}
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{ 
          title: 'Privacy Policy',
          headerBackTitle: 'Account', // Only shown on iOS
        }}
      />
      <Stack.Screen 
        name="TermsOfService" 
        component={TermsOfServiceScreen}
        options={{ 
          title: 'Terms of Service',
          headerBackTitle: 'Account', // Only shown on iOS
        }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ 
          title: 'Help & Support',
          headerBackTitle: 'Account', // Only shown on iOS
        }}
      />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CaptureTab') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'ReceiptsTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'StatisticsTab') {
            iconName = Platform.OS === 'ios' 
              ? (focused ? 'stats-chart' : 'stats-chart-outline')
              : (focused ? 'analytics' : 'analytics-outline');
          }

          return <Ionicons name={iconName!} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.surface,
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: Platform.OS === 'ios' 
            ? Math.max(insets.bottom - 10, 15) // Add extra padding for iOS app switcher
            : Math.max(insets.bottom + 10, 20), // Add more padding for Android navigation bar
          height: Platform.OS === 'ios' 
            ? 60 + Math.max(insets.bottom - 10, 15)
            : 60 + Math.max(insets.bottom + 10, 20),
        },
        tabBarLabelStyle: {
          fontSize: 12, // Standard size for 4 labels
          marginTop: -2,
          marginBottom: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="CaptureTab"
        component={CaptureStackNavigator}
        options={{ tabBarLabel: 'Capture' }}
      />
      <Tab.Screen
        name="ReceiptsTab"
        component={ReceiptsStackNavigator}
        options={{ tabBarLabel: 'Receipts' }}
      />
      <Tab.Screen
        name="StatisticsTab"
        component={StatisticsStackNavigator}
        options={{ tabBarLabel: 'Stats' }}
      />
    </Tab.Navigator>
  );
}