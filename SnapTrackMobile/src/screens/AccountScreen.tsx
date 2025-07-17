import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../styles/theme';
import { authService } from '../services/authService';
import { iapManager } from '../services/IAPManager';
import { apiClient } from '../services/apiClient';

export default function AccountScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isRestoring, setIsRestoring] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setUser(authService.getCurrentUser());
      loadSubscriptionStatus();
    }, [])
  );

  const loadSubscriptionStatus = async () => {
    try {
      const response = await apiClient.get<any>('/api/subscription/status');
      setSubscriptionStatus((response as any).data);
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  const handleGetInTouch = () => {
    Alert.alert(
      'Get in Touch',
      'How would you like to contact us?',
      [
        { text: 'Send Feedback', onPress: () => navigation.navigate('Feedback' as never) },
        { 
          text: 'Contact Support', 
          onPress: () => {
            // Navigate to Help tab then to Contact screen
            const parentNavigation = navigation.getParent();
            if (parentNavigation) {
              parentNavigation.navigate('HelpTab', { screen: 'Contact' });
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleViewPrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy' as never);
  };

  const handleHelpAndDocs = () => {
    navigation.navigate('Help' as never);
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(
        'Not Available',
        'Restore purchases is only available on iOS devices.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsRestoring(true);
      
      // Initialize IAP if not already initialized
      if (!iapManager.isInitialized()) {
        await iapManager.initialize();
      }
      
      // Attempt to restore purchases
      await iapManager.restorePurchases();
      
      Alert.alert(
        'Success!',
        'Your subscription has been restored.',
        [{ text: 'OK' }]
      );
      
      // Reload subscription status
      await loadSubscriptionStatus();
      
    } catch (error: any) {
      console.error('Restore error:', error);
      
      if (error.message === 'No active subscription found') {
        Alert.alert(
          'No Active Subscription',
          'No active subscription found for this Apple ID.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Restore Failed',
          'Unable to restore purchases. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManageSubscription = () => {
    // For iOS users with Apple subscriptions, open Settings
    if (Platform.OS === 'ios' && subscriptionStatus?.subscription_source === 'apple') {
      Alert.alert(
        'Manage Apple Subscription',
        'Your subscription is managed through your Apple ID. You can view or cancel it in your iPhone Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              // Open iPhone Settings -> Apple ID -> Subscriptions
              Linking.openURL('https://apps.apple.com/account/subscriptions');
            }
          }
        ]
      );
      return;
    }

    // For web subscriptions, redirect to web portal
    const subscriptionUrl = 'https://app.snaptrack.bot/login';
    
    Alert.alert(
      'Manage Subscription',
      'You will be redirected to the web to manage your subscription, including updating payment methods and billing details.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: async () => {
            try {
              const canOpen = await Linking.canOpenURL(subscriptionUrl);
              if (canOpen) {
                await Linking.openURL(subscriptionUrl);
              } else {
                Alert.alert(
                  'Unable to Open',
                  'Could not open the subscription management page. Please visit app.snaptrack.bot/login in your browser.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Error opening subscription URL:', error);
              Alert.alert(
                'Error',
                'Could not open the subscription management page. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await authService.signOut();
              navigation.navigate('Auth' as never);
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your receipts and data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Feature Coming Soon',
              'Account deletion will be available in a future update. Please contact support if you need immediate assistance.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header - Removed since navigation stack handles it */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color={colors.textMuted} />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <Text style={styles.editProfileText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Get in Touch Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Get in touch</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.sectionItem} onPress={handleGetInTouch}>
            <Text style={styles.sectionItemText}>Send feedback or report an issue</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Data and Privacy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Data and privacy</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.sectionItem} onPress={handleViewPrivacyPolicy}>
            <Text style={styles.sectionItemText}>View privacy policy</Text>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Subscription Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="card-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Subscription</Text>
            </View>
          </View>
          
          {subscriptionStatus?.has_subscription && (
            <View style={styles.subscriptionStatus}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>Active</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                </View>
              </View>
              {subscriptionStatus.subscription_source === 'apple' && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Billed through:</Text>
                  <View style={styles.billingContainer}>
                    <Ionicons name="logo-apple" size={16} color={colors.textPrimary} />
                    <Text style={styles.billingText}>Apple</Text>
                  </View>
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity style={styles.sectionItem} onPress={handleManageSubscription}>
            <Text style={styles.sectionItemText}>Manage subscription</Text>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          
          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={[styles.sectionItem, isRestoring && styles.disabledItem]} 
              onPress={handleRestorePurchases}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <>
                  <Text style={styles.sectionItemText}>Restoring...</Text>
                  <ActivityIndicator size="small" color={colors.primary} />
                </>
              ) : (
                <>
                  <Text style={styles.sectionItemText}>Restore purchases</Text>
                  <Ionicons name="refresh-outline" size={16} color={colors.textMuted} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Help and Documentation Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="help-circle-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Help and documentation</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.sectionItem} onPress={handleHelpAndDocs}>
            <Text style={styles.sectionItemText}>How to use SnapTrack</Text>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteAccountText}>Delete account</Text>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  billingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  billingText: {
    ...typography.body,
    color: colors.textPrimary
  },
  bottomSpacing: {
    height: spacing.xl
  },
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    flex: 1,
    // Platform-specific top padding adjustment
    paddingTop: Platform.OS === 'android' ? spacing.md : 0
  },
  deleteAccountButton: {
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md
  },
  deleteAccountText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '500'
  },
  disabledItem: {
    opacity: 0.6
  },
  editProfileButton: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm
  },
  editProfileText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500'
  },
  profileImage: {
    borderRadius: 40,
    height: 80,
    width: 80
  },
  profileImageContainer: {
    marginBottom: spacing.md
  },
  profileImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl
  },
  sectionHeader: {
    marginBottom: spacing.md
  },
  sectionItem: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  sectionItemText: {
    ...typography.body,
    color: colors.textPrimary
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: spacing.sm
  },
  sectionTitleContainer: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.md
  },
  signOutText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500'
  },
  statusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  statusLabel: {
    ...typography.body,
    color: colors.textSecondary
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  statusText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500'
  },
  subscriptionStatus: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  userEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg
  },
  userName: {
    ...typography.title2,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: spacing.xs
  }
});