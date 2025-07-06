import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import HelpScreen from '../screens/HelpScreen';
import AccountScreen from '../screens/AccountScreen';
import SettingsScreen from '../screens/SettingsScreen';
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

function HelpStackNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen 
        name="HelpMain" 
        component={HelpScreen}
        options={{ title: 'Help & Support' }}
      />
      <Stack.Screen 
        name="Contact" 
        component={ContactScreen}
        options={{ title: 'Contact Support' }}
      />
    </Stack.Navigator>
  );
}

function AccountStackNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen 
        name="AccountMain" 
        component={AccountScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ title: 'About SnapTrack' }}
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{ title: 'Privacy Policy' }}
      />
      <Stack.Screen 
        name="TermsOfService" 
        component={TermsOfServiceScreen}
        options={{ title: 'Terms of Service' }}
      />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
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
          } else if (route.name === 'HelpTab') {
            iconName = focused ? 'help-circle' : 'help-circle-outline';
          } else if (route.name === 'AccountTab') {
            iconName = focused ? 'person' : 'person-outline';
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
          paddingBottom: 4,
          height: 60, // Slightly taller to accommodate 5 tabs
        },
        tabBarLabelStyle: {
          fontSize: 11, // Slightly smaller to fit 5 labels
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
        name="HelpTab"
        component={HelpStackNavigator}
        options={{ tabBarLabel: 'Help' }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountStackNavigator}
        options={{ tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
}