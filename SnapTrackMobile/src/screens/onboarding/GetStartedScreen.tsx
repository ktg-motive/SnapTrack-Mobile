import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { IAPManager } from '../../services/IAPManager';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GetStartedScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasIAPSupport, setHasIAPSupport] = useState(true);

  useEffect(() => {
    // Check if IAP is available in this environment
    checkIAPAvailability();
  }, []);

  const checkIAPAvailability = async () => {
    try {
      const iapManager = IAPManager.getInstance();
      await iapManager.initialize();
      const products = await iapManager.getProducts();
      setHasIAPSupport(products.length > 0);
    } catch (error) {
      console.log('IAP not available in this environment');
      setHasIAPSupport(false);
    }
  };

  const handleContinueToIAP = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Auth');
  };

  const handleContinueToWeb = () => {
    // Fallback to web signup if IAP not available
    Linking.openURL('https://snaptrack.bot/signup');
  };

  const features = [
    'Unlimited receipt storage',
    'Multi-business organization',
    'Professional exports',
    'Email automation',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Get Started</Text>
        
        <Text style={styles.description}>
          SnapTrack requires an account to{'\n'}
          sync your receipts across devices{'\n'}
          and keep your data secure.
        </Text>

        {/* Show appropriate button based on IAP availability */}
        {hasIAPSupport ? (
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={handleContinueToIAP}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaButtonText}>Continue with Apple</Text>
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={handleContinueToWeb}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaButtonText}>Continue to snaptrack.bot</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What's included:</Text>
          {features.map((feature, index) => (
            <Text key={index} style={styles.featureItem}>
              • {feature}
            </Text>
          ))}
          
          {/* Add payment method info for IAP */}
          {hasIAPSupport && (
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentText}>
                $4.99/month • Billed through Apple
              </Text>
              <Text style={styles.paymentSubtext}>
                Cancel anytime in Settings
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    gap: 16,
    marginBottom: 20
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: 32,
    paddingTop: 60
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 28,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8
  },
  description: {
    color: '#666666',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 40,
    textAlign: 'center'
  },
  featureItem: {
    color: '#666666',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8
  },
  featuresContainer: {
    alignSelf: 'stretch',
    maxWidth: 300
  },
  featuresTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40
  },
  mainSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: -80
  },
  title: {
    color: '#000000',
    fontSize: 68,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 80,
    marginBottom: 24,
    textAlign: 'center'
  },
  paymentInfo: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center'
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4
  },
  paymentSubtext: {
    fontSize: 12,
    color: '#666666'
  }
});

export default GetStartedScreen;