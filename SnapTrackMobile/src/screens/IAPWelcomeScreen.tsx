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
  promoApplied?: boolean;
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

  const features = [
    'Snap receipts with your camera',
    'AI-powered data extraction',
    'Forward receipts via email',
    'Organize by business entities',
    'Export for tax preparation'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <SnapTrackLogo width={180} height={54} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            You're ready to begin snapping and tracking your receipts like a pro.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What you can do:</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Email Tip Section (Minimized) */}
        <View style={styles.emailTipSection}>
          <TouchableOpacity onPress={handleCopyEmail} style={styles.emailTip}>
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
            <Text style={styles.emailTipText}>
              Tip: You can also forward receipts to expense@{params.subdomain}.snaptrack.bot
            </Text>
            <Ionicons 
              name={emailCopied ? 'checkmark' : 'copy-outline'} 
              size={16} 
              color={emailCopied ? '#4CAF50' : colors.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>Start Tracking Receipts</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'System'
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'System'
  },
  featuresSection: {
    flex: 1,
    marginBottom: 32
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    fontFamily: 'System'
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
    fontFamily: 'System'
  },
  emailTipSection: {
    marginBottom: 24
  },
  emailTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    gap: 8
  },
  emailTipText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    fontFamily: 'System'
  },
  ctaSection: {
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 28,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System'
  }
});