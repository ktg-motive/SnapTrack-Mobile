import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Standardized return URL for App Store compliance
const RETURN_URL = 'snaptrack://auth-complete';

const EmailEntryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to continue.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      // Store email for later use
      await AsyncStorage.setItem('pending_signup_email', email);

      // Redirect to web signup with email pre-filled
      const signupUrl = `https://snaptrack.bot/signup?source=mobile&email=${encodeURIComponent(email)}&return=${encodeURIComponent(RETURN_URL)}`;
      
      const supported = await Linking.canOpenURL(signupUrl);
      if (supported) {
        await Linking.openURL(signupUrl);
      } else {
        throw new Error('Cannot open signup URL');
      }
    } catch (error) {
      console.error('Failed to open signup URL:', error);
      Alert.alert(
        'Unable to Open Signup',
        'Please visit snaptrack.bot in your browser to create an account.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Enter your email</Text>
          
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#8E8E93"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
            editable={!isLoading}
          />

          <TouchableOpacity 
            style={[styles.continueButton, (!email.trim() || isLoading) && styles.continueButtonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.9}
            disabled={!email.trim() || isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Opening...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.redirectNote}>
            You'll be redirected to complete signup
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1
  },
  content: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: '10%',
    paddingTop: 60
  },
  continueButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#009f86',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center'
  },
  continueButtonDisabled: {
    backgroundColor: '#B0B0B0'
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500'
  },
  input: {
    alignSelf: 'stretch',
    backgroundColor: '#F9F9F9',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 1,
    color: '#1C1C1E',
    fontSize: 17,
    height: 56,
    marginBottom: 24,
    paddingHorizontal: 20
  },
  keyboardView: {
    flex: 1
  },
  redirectNote: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center'
  },
  title: {
    color: '#1C1C1E',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 40
  }
});

export default EmailEntryScreen;