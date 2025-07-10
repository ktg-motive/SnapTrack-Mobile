import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../styles/theme';
import { authService } from '../services/authService';

interface HamburgerMenuProps {
  isVisible: boolean;
  onClose: () => void;
  navigation: any;
  userStats?: {
    totalReceipts: number;
    totalAmount: number;
    currentMonthReceipts: number;
  };
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

export default function HamburgerMenu({ isVisible, onClose, navigation, userStats }: HamburgerMenuProps) {
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx < 0;
    },
    onPanResponderMove: (evt, gestureState) => {
      const newTranslateX = Math.min(0, gestureState.dx);
      slideAnim.setValue(newTranslateX);
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx < -50) {
        onClose();
      } else {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleAccountSettings = () => {
    onClose();
    navigation.navigate('AccountTab');
  };

  const handleAppSettings = () => {
    onClose();
    navigation.navigate('Settings');
  };

  const handleHelp = () => {
    onClose();
    // Navigate to Help screen in the Account tab since Help is now part of the Account stack
    navigation.navigate('AccountTab', {
      screen: 'Help'
    });
  };

  const handleFeedback = () => {
    onClose();
    navigation.navigate('Feedback');
  };

  const handleAbout = () => {
    onClose();
    navigation.navigate('About');
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
              onClose();
              await authService.signOut();
              navigation.navigate('Auth');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        }
      ]
    );
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop, 
          { opacity: backdropOpacity }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouch} 
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Menu */}
      <Animated.View 
        style={[
          styles.menu,
          { transform: [{ translateX: slideAnim }] }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={32} color={colors.textMuted} />
              </View>
            )}
          </View>
          
          <Text style={styles.userName} numberOfLines={1}>
            {user?.displayName || user?.email?.split('@')[0] || 'User'}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email}
          </Text>
          
          {/* Quick Stats */}
          {userStats && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="receipt" size={14} color={colors.primary} />
                <Text style={styles.statText}>{userStats.totalReceipts} receipts</Text>
              </View>
              <Text style={styles.statSeparator}>•</Text>
              <View style={styles.statItem}>
                <Ionicons name="trending-up" size={14} color={colors.success} />
                <Text style={styles.statText}>{formatCurrency(userStats.totalAmount)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Navigation Items */}
        <View style={styles.navigationSection}>
          <TouchableOpacity style={styles.navItem} onPress={handleAccountSettings}>
            <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.navItemText}>Account Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={handleAppSettings}>
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.navItemText}>App Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={handleHelp}>
            <Ionicons name="help-circle-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.navItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={handleFeedback}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.navItemText}>Send Feedback</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* App Information */}
        <View style={styles.infoSection}>
          <TouchableOpacity style={styles.navItem} onPress={handleAbout}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.navItemText, styles.infoText]}>About SnapTrack</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  profileSection: {
    backgroundColor: colors.primary,
    paddingTop: 60, // Account for status bar
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: spacing.md,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userName: {
    ...typography.title3,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  userEmail: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    ...typography.caption,
    color: '#ffffff',
    marginLeft: spacing.xs,
    fontWeight: '500',
    fontSize: 12,
  },
  statSeparator: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: spacing.sm,
  },
  navigationSection: {
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  navItemText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.md,
  },
  infoSection: {
    marginTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  infoText: {
    color: colors.textSecondary,
  },
  versionContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  logoutSection: {
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  logoutText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
});