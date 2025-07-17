import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SnapTrackLogo from '../../components/SnapTrackLogo';
import { theme } from '../../styles/theme';

const colors = theme.colors;

export default function WelcomeBackScreen() {
  const navigation = useNavigation();
  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Mark that user has completed the paid signup flow
    AsyncStorage.setItem('paid_signup_completed', 'true');

    // Animation sequence
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('Main' as never);
  };

  const features = [
    {
      icon: 'camera',
      text: 'Snap receipts instantly'
    },
    {
      icon: 'mail',
      text: 'Forward receipts to your email'
    },
    {
      icon: 'stats-chart',
      text: 'Track spending patterns'
    },
    {
      icon: 'download',
      text: 'Export for accounting'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <SnapTrackLogo width={160} height={48} />
        </View>

        {/* Success Animation */}
        <Animated.View 
          style={[
            styles.successContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.successCircle}
          >
            <Ionicons name="checkmark" size={48} color="white" />
          </LinearGradient>
        </Animated.View>

        {/* Welcome Message */}
        <Animated.View 
          style={[
            styles.messageContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.title}>Welcome to SnapTrack!</Text>
          <Text style={styles.subtitle}>
            Your account is ready. Let's get you started with smart receipt management.
          </Text>
        </Animated.View>

        {/* Quick Features */}
        <Animated.View 
          style={[
            styles.featuresContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.featuresTitle}>What you can do now:</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons 
                  name={feature.icon as any} 
                  size={20} 
                  color={colors.primary} 
                />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View 
          style={[
            styles.ctaContainer,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, '#069196']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.tipText}>
            💡 Tip: Start by taking a photo of your first receipt
          </Text>
        </Animated.View>
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
    paddingHorizontal: 24,
    paddingTop: 32
  },
  ctaContainer: {
    marginBottom: 32,
    marginTop: 'auto'
  },
  featureIcon: {
    alignItems: 'center',
    backgroundColor: '#E6F7F7',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginRight: 12,
    width: 32
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12
  },
  featureText: {
    color: colors.text,
    flex: 1,
    fontSize: 15
  },
  featuresContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 40,
    padding: 20
  },
  featuresTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  primaryButton: {
    borderRadius: 28,
    elevation: 2,
    marginBottom: 20,
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 20,
    textAlign: 'center'
  },
  successCircle: {
    alignItems: 'center',
    borderRadius: 48,
    elevation: 4,
    height: 96,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: 96
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  tipText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center'
  }
});