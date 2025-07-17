import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SnapTrackLogo from '../../components/SnapTrackLogo';
import { colors, typography } from '../../styles/theme';

const SIGNUP_URL = 'https://snaptrack.bot/signup?source=mobile&return=snaptrack://auth-complete';

export default function PaidAccountRequiredScreen() {
  const navigation = useNavigation();

  const handleContinueOnWeb = async () => {
    // Import authService dynamically to avoid circular imports
    const { authService } = await import('../../services/authService');
    await authService.redirectToWebSignup();
  };

  const handleExistingAccount = () => {
    navigation.navigate('Auth' as never);
  };

  const features = [
    {
      icon: 'scan-outline',
      title: 'Smart OCR Processing',
      description: 'Intelligent receipt scanning with 95% accuracy'
    },
    {
      icon: 'business-outline',
      title: 'Multi-Entity Support',
      description: 'Manage expenses across multiple businesses'
    },
    {
      icon: 'mail-outline',
      title: 'Email Integration',
      description: 'Forward receipts directly to your inbox'
    },
    {
      icon: 'cloud-outline',
      title: 'Cloud Sync',
      description: 'Access your receipts from any device'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <SnapTrackLogo width={180} height={54} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Professional Receipt Management</Text>
          <Text style={styles.subtitle}>
            Streamline your business expenses with intelligent automation
          </Text>

          {/* Features Grid */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons 
                    name={feature.icon as any} 
                    size={28} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>

          {/* Account Required Message */}
          <View style={styles.messageContainer}>
            <View style={styles.messageBadge}>
              <Text style={styles.messageBadgeText}>ACCOUNT REQUIRED</Text>
            </View>
            <Text style={styles.messageText}>
              SnapTrack requires a paid account to access all features
            </Text>
          </View>

          {/* CTAs */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleContinueOnWeb}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, '#069196']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Continue on Web</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleExistingAccount}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>I Have an Account</Text>
            </TouchableOpacity>
          </View>

          {/* Legal */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text 
                style={styles.legalLink}
                onPress={() => navigation.navigate('TermsOfService' as never)}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text 
                style={styles.legalLink}
                onPress={() => navigation.navigate('PrivacyPolicy' as never)}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 40
  },
  ctaContainer: {
    gap: 12,
    marginBottom: 24
  },
  featureCard: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    width: '48%'
  },
  featureDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center'
  },
  featureIconContainer: {
    alignItems: 'center',
    backgroundColor: '#E6F7F7',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
    width: 56
  },
  featureTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center'
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40
  },
  legalContainer: {
    marginTop: 'auto',
    paddingTop: 16
  },
  legalLink: {
    color: colors.textPrimary,
    fontWeight: '600'
  },
  legalText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center'
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  messageBadge: {
    backgroundColor: '#FFF3CD',
    borderRadius: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  messageBadgeText: {
    color: '#856404',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center'
  },
  primaryButton: {
    borderRadius: 28,
    elevation: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  primaryButtonGradient: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  scrollContent: {
    flexGrow: 1
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 16
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 40,
    textAlign: 'center'
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center'
  }
});