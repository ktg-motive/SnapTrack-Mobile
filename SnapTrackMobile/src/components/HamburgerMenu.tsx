import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Animated,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../styles/theme';
import { authService } from '../services/authService.compat';
import { apiClient } from '../services/apiClient';
import { VersionDisplay } from './VersionDisplay';

interface HamburgerMenuProps {
  isVisible: boolean;
  onClose: () => void;
  navigation: any;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

export default function HamburgerMenu({ isVisible, onClose, navigation }: HamburgerMenuProps) {
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [user, setUser] = useState<any>(authService.getCurrentUser());

  // Load full user profile when menu becomes visible
  useEffect(() => {
    if (isVisible) {
      // Load user profile data
      loadUserProfile();
    }
  }, [isVisible]);

  const loadUserProfile = async () => {
    try {
      const basicUser = authService.getCurrentUser();
      setUser(basicUser);
      
      // Fetch full profile with username data
      const profileResponse = await apiClient.get('/api/user/profile');
      const userData = profileResponse.user || profileResponse.data || profileResponse;
      
      if (userData && (userData.email_username || userData.profile)) {
        const fullUser = {
          ...basicUser,
          id: userData.id || basicUser?.uid,
          email: userData.profile?.email || userData.email || basicUser?.email,
          displayName: userData.profile?.full_name || userData.full_name || basicUser?.displayName,
          email_username: userData.email_username,
          email_address: userData.snaptrack_emails?.new_format || 
                        userData.email_address || 
                        (userData.email_username ? `${userData.email_username}@app.snaptrack.bot` : null),
          full_name: userData.profile?.full_name || userData.full_name || basicUser?.displayName
        };
        setUser(fullUser);
      }
    } catch (error) {
      console.error('Failed to load user profile in menu:', error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        })
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
          useNativeDriver: true
        }).start();
      }
    }
  });


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
    navigation.navigate('Help');
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
            {user?.displayName || user?.full_name || user?.email_username || 'User'}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email_address || user?.email || 'No email set'}
          </Text>
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
          
          {/* Version Display */}
          <View style={styles.versionContainer}>
            <VersionDisplay 
              showUpdateIndicator={true}
              showUpdateCheck={false}
              showCompactView={false}
              style={styles.versionDisplay}
            />
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
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  backdropTouch: {
    flex: 1
  },
  container: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000
  },
  infoSection: {
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    marginTop: spacing.lg
  },
  infoText: {
    color: colors.textSecondary
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md
  },
  logoutSection: {
    marginTop: 'auto',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg
  },
  logoutText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '500',
    marginLeft: spacing.sm
  },
  menu: {
    backgroundColor: colors.background,
    bottom: 0,
    elevation: 16,
    left: 0,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    top: 0,
    width: MENU_WIDTH
  },
  navItem: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  navItemText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.md
  },
  navigationSection: {
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    paddingTop: spacing.lg
  },
  profileImage: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    borderWidth: 2,
    height: 60,
    width: 60
  },
  profileImageContainer: {
    marginBottom: spacing.md
  },
  profileImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    borderWidth: 2,
    height: 60,
    justifyContent: 'center',
    width: 60
  },
  profileSection: {
    backgroundColor: colors.primary,
    paddingTop: 60, // Account for status bar
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center'
  },
  userEmail: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  userName: {
    ...typography.title3,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  versionContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomColor: colors.surface,
    borderBottomWidth: 1
  },
  versionDisplay: {
    paddingVertical: 0
  }
});