import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SnapTrackLogo from '../../components/SnapTrackLogo';
import { theme, typography } from '../../styles/theme';

const colors = theme.colors;
import { authService } from '../../services/authService';

const CONTINUE_SIGNUP_URL = 'https://snaptrack.bot/signup?source=mobile&return=snaptrack://auth-complete';

export default function AccountCreationInProgressScreen() {
  const navigation = useNavigation();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check if user completed signup every time screen focuses
    const unsubscribe = navigation.addListener('focus', () => {
      checkAccountStatus();
    });

    return unsubscribe;
  }, [navigation]);

  const checkAccountStatus = async () => {
    setIsChecking(true);
    try {
      // Check if user is now authenticated
      const user = await authService.getCurrentUser();
      if (user) {
        // User completed signup!
        navigation.navigate('WelcomeBack' as never);
      }
    } catch (error) {
      console.log('User not authenticated yet');
    } finally {
      setIsChecking(false);
    }
  };

  const handleContinueSignup = async () => {
    try {
      const supported = await Linking.canOpenURL(CONTINUE_SIGNUP_URL);
      if (supported) {
        await Linking.openURL(CONTINUE_SIGNUP_URL);
      } else {
        Alert.alert(
          'Unable to Open Browser',
          'Please visit snaptrack.bot in your web browser to complete signup.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const handleTrySignIn = () => {
    navigation.navigate('Auth' as never);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@snaptrack.bot?subject=Help with account creation');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <SnapTrackLogo width={160} height={48} />
        </View>

        {/* Status Icon */}
        <View style={styles.statusContainer}>
          <View style={styles.statusIconWrapper}>
            <Ionicons name="time-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.statusTitle}>Account Creation In Progress</Text>
          <Text style={styles.statusSubtitle}>
            Complete your signup on the web to get started with SnapTrack
          </Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Almost there!</Text>
              <Text style={styles.infoText}>
                Return to your browser to complete payment and activate your account
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="lock-closed" size={24} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Secure checkout</Text>
              <Text style={styles.infoText}>
                Your payment information is processed securely on our website
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleContinueSignup}
            activeOpacity={0.8}
          >
            <View style={styles.primaryButtonContent}>
              <Text style={styles.primaryButtonText}>Continue Signup on Web</Text>
              <Ionicons name="open-outline" size={18} color="white" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={checkAccountStatus}
            disabled={isChecking}
            activeOpacity={0.7}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Check Status</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.tertiaryButton}
            onPress={handleTrySignIn}
            activeOpacity={0.7}
          >
            <Text style={styles.tertiaryButtonText}>
              Already completed? Sign in here
            </Text>
          </TouchableOpacity>
        </View>

        {/* Support Link */}
        <TouchableOpacity 
          style={styles.supportLink}
          onPress={handleContactSupport}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.supportText}>Need help? Contact support</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    gap: 12
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 8
  },
  dividerLine: {
    backgroundColor: '#E0E0E0',
    flex: 1,
    height: 1
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 16
  },
  infoCard: {
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 16
  },
  infoContainer: {
    gap: 16,
    marginBottom: 40
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18
  },
  infoTextContainer: {
    flex: 1
  },
  infoTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    elevation: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  primaryButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600'
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  statusIconWrapper: {
    alignItems: 'center',
    backgroundColor: '#E6F7F7',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 20,
    width: 80
  },
  statusSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 20,
    textAlign: 'center'
  },
  statusTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center'
  },
  supportLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 'auto',
    paddingVertical: 8
  },
  supportText: {
    color: colors.textMuted,
    fontSize: 14
  },
  tertiaryButton: {
    alignItems: 'center',
    paddingVertical: 12
  },
  tertiaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '500'
  }
});