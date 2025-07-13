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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../styles/theme';
import { authService } from '../services/authService';

export default function AccountScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(authService.getCurrentUser());

  // Refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setUser(authService.getCurrentUser());
    }, [])
  );

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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    // Platform-specific top padding adjustment
    paddingTop: Platform.OS === 'android' ? spacing.md : 0,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 16,
  },
  profileImageContainer: {
    marginBottom: spacing.md,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    ...typography.title2,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  editProfileButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  editProfileText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.title3,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  sectionItemText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  signOutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  signOutText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  deleteAccountButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  deleteAccountText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});