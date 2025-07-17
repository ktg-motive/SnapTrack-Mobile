import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  Linking
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { colors } from '../styles/theme';
import SnapTrackLogo from '../components/SnapTrackLogo';

interface RouteParams {
  receiptEmail: string;
  isProxyEmail: boolean;
  subdomain: string;
}

export default function IAPWelcomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = async () => {
    const email = `expense@${params.subdomain}.snaptrack.bot`;
    await Clipboard.setStringAsync(email);
    
    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleEmailToMe = async () => {
    const email = `expense@${params.subdomain}.snaptrack.bot`;
    const subject = 'Your SnapTrack Receipt Email';
    const body = `Save this email address for forwarding receipts:\n\n${email}\n\nThis is your personalized SnapTrack email address.`;
    
    const url = `mailto:${params.receiptEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open email app');
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert('Error', 'Unable to open email app');
    }
  };

  const handleContinue = () => {
    navigation.navigate('Main' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <SnapTrackLogo width={80} height={80} />
        </View>

        {/* Welcome Message */}
        <Text style={styles.welcomeTitle}>Welcome to SnapTrack!</Text>
        <Text style={styles.welcomeSubtitle}>Your account is ready to go.</Text>

        {/* Warning for Hide My Email users */}
        {params.isProxyEmail && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ Important: Save This Email! ⚠️</Text>
          </View>
        )}

        {/* Email Container */}
        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>📧 Your Receipt Email:</Text>
          <View style={styles.emailBox}>
            <Text style={styles.email} selectable>
              expense@{params.subdomain}.snaptrack.bot
            </Text>
            <TouchableOpacity onPress={handleCopyEmail} style={styles.copyButton}>
              <Ionicons 
                name={emailCopied ? 'checkmark' : 'copy-outline'} 
                size={20} 
                color={emailCopied ? '#4CAF50' : colors.primary} 
              />
              <Text style={[styles.copyText, emailCopied && styles.copiedText]}>
                {emailCopied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Email to Me button for Hide My Email users */}
        {params.isProxyEmail && (
          <TouchableOpacity onPress={handleEmailToMe} style={styles.emailToMeButton}>
            <Ionicons name="mail-outline" size={20} color="#000" />
            <Text style={styles.emailToMeText}>Email to Me</Text>
          </TouchableOpacity>
        )}

        {/* Instructions */}
        <Text style={styles.instruction}>
          Forward email receipts to this address and they'll appear in your app.
        </Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to App</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    bottom: 40,
    left: 20,
    paddingVertical: 16,
    position: 'absolute',
    right: 20
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600'
  },
  copiedText: {
    color: '#4CAF50'
  },
  copyButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  copyText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4
  },
  email: {
    color: colors.primary,
    flex: 1,
    fontFamily: 'Menlo',
    fontSize: 18
  },
  emailBox: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16
  },
  emailContainer: {
    marginBottom: 24
  },
  emailLabel: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12
  },
  emailToMeButton: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  emailToMeText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4
  },
  instruction: {
    color: '#666666',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center'
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24
  },
  warningBanner: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12
  },
  warningText: {
    color: '#856404',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  welcomeSubtitle: {
    color: '#666666',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center'
  },
  welcomeTitle: {
    color: '#1a1a1a',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center'
  }
});