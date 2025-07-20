import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, typography, spacing, borderRadius } from '../styles/theme';
import SnapTrackLogo from '../components/SnapTrackLogo';
import { uuidAuthService } from '../services/authService.uuid';
import { Platform } from 'react-native';

export default function AuthScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const user = await uuidAuthService.initializeAuth();
    if (user) {
      // Check if user needs onboarding
      const showOnboarding = await AsyncStorage.getItem('show_onboarding');
      if (showOnboarding === 'true') {
        navigation.navigate('Onboarding' as never);
      } else {
        navigation.navigate('Main' as never);
      }
    }
  };


  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const authResponse = await uuidAuthService.signInWithGoogle();
      
      // Check if new user needs onboarding
      const showOnboarding = await AsyncStorage.getItem('show_onboarding');
      if (showOnboarding === 'true') {
        navigation.navigate('Onboarding' as never);
      } else {
        // Show success feedback before navigation
        Alert.alert(
          'Sign In Successful!',
          'Welcome to SnapTrack!',
          [{ 
            text: 'Continue', 
            onPress: () => navigation.navigate('Main' as never)
          }]
        );
      }
    } catch (error: any) {
      Alert.alert('Google Sign-In Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);

    try {
      const authResponse = await uuidAuthService.signInWithApple();
      
      // Check if new user needs onboarding
      const showOnboarding = await AsyncStorage.getItem('show_onboarding');
      if (showOnboarding === 'true') {
        navigation.navigate('Onboarding' as never);
      } else {
        // Show success feedback before navigation
        Alert.alert(
          'Sign In Successful!',
          'Welcome to SnapTrack!',
          [{ 
            text: 'Continue', 
            onPress: () => navigation.navigate('Main' as never)
          }]
        );
      }
    } catch (error: any) {
      Alert.alert('Apple Sign-In Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsPress = () => {
    navigation.navigate('TermsOfService' as never);
  };

  const handlePrivacyPress = () => {
    navigation.navigate('PrivacyPolicy' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <SnapTrackLogo width={200} height={60} />
        </View>

        {/* Hero Tagline */}
        <View style={styles.taglineSection}>
          <Text style={styles.taglineNormal}>Snap it.</Text>
          <Text style={styles.taglineGradient}>Track it.</Text>
          <Text style={styles.taglineSubtext}>No email required to get started</Text>
        </View>

        {/* Authentication Buttons */}
        <View style={styles.buttonsSection}>
          {/* Continue with Google */}
          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <View style={styles.primaryButtonContent}>
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Continue with Google</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Continue with Apple - iOS only */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={[styles.secondaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <View style={styles.secondaryButtonContent}>
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text style={styles.secondaryButtonText}>Continue with Apple</Text>
              </View>
            </TouchableOpacity>
          )}

        </View>

        {/* Legal Footer */}
        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            By continuing, you acknowledge that you have read and agreed to our{' '}
            <Text style={styles.legalLink} onPress={handleTermsPress}>Terms of Service</Text> and{' '}
            <Text style={styles.legalLink} onPress={handlePrivacyPress}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  taglineSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: -80,
  },
  taglineNormal: {
    fontSize: 68,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -2,
    textAlign: 'center',
    lineHeight: 80,
  },
  taglineGradient: {
    fontSize: 68,
    fontWeight: '700',
    letterSpacing: -2,
    color: '#009f86', // SnapTrack brand teal
    textAlign: 'center',
    lineHeight: 80,
  },
  taglineSubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
  buttonsSection: {
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderRadius: 28,
    height: 56,
    overflow: 'hidden',
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 28,
    height: 56,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 12,
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  legalSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  legalText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  legalLink: {
    color: '#000000',
    fontWeight: '600',
  },
});