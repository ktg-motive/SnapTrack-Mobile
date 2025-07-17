import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { colors, typography, spacing } from '../styles/theme';
import { FeedbackType } from '../types/feedback';

interface SettingItem {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showArrow?: boolean;
}

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const settingsItems: SettingItem[] = [
    // Feedback & Support Section
    {
      title: 'Send Feedback',
      subtitle: 'Share your overall experience',
      icon: 'star-outline',
      onPress: () => navigation.navigate('Feedback', { 
        initialType: FeedbackType.GENERAL_RATING,
        initialContext: 'Settings menu - General feedback'
      }),
      showArrow: true
    },
    {
      title: 'Report Problem',
      subtitle: 'Found a bug or issue?',
      icon: 'bug-outline',
      onPress: () => navigation.navigate('Feedback', { 
        initialType: FeedbackType.PROBLEM_REPORT,
        initialContext: 'Settings menu - Problem report'
      }),
      showArrow: true
    },
    {
      title: 'Request Feature',
      subtitle: 'Suggest new features or improvements',
      icon: 'bulb-outline',
      onPress: () => navigation.navigate('Feedback', { 
        initialType: FeedbackType.FEATURE_REQUEST,
        initialContext: 'Settings menu - Feature request'
      }),
      showArrow: true
    },
    {
      title: 'Help & Support',
      subtitle: 'Get help using SnapTrack',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('Help'),
      showArrow: true
    },
    {
      title: 'Contact Support',
      subtitle: 'Submit feedback and support requests',
      icon: 'chatbubbles-outline',
      onPress: () => navigation.navigate('Contact'),
      showArrow: true
    },
    {
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      icon: 'shield-checkmark-outline',
      onPress: () => navigation.navigate('PrivacyPolicy'),
      showArrow: true
    },
    {
      title: 'Terms of Service',
      subtitle: 'Terms and conditions',
      icon: 'document-text-outline',
      onPress: () => navigation.navigate('TermsOfService'),
      showArrow: true
    },
    {
      title: 'About SnapTrack',
      subtitle: 'Version info and credits',
      icon: 'information-circle-outline',
      onPress: () => navigation.navigate('About'),
      showArrow: true
    }
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity 
      key={item.title} 
      style={styles.settingItem} 
      onPress={item.onPress}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons 
          name={item.icon} 
          size={24} 
          color={colors.primary} 
          style={styles.settingIcon}
        />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      {item.showArrow && (
        <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your SnapTrack experience</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        {settingsItems.slice(0, 1).map(renderSettingItem)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feedback & Support</Text>
        {settingsItems.slice(1, 4).map(renderSettingItem)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        {settingsItems.slice(4, 6).map(renderSettingItem)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        {settingsItems.slice(6, 8).map(renderSettingItem)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        {settingsItems.slice(8).map(renderSettingItem)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    backgroundColor: colors.card,
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    padding: spacing.xl
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary
  },
  headerTitle: {
    ...typography.title1,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  section: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.surface,
    borderTopWidth: 1,
    marginTop: spacing.lg
  },
  sectionTitle: {
    ...typography.caption,
    backgroundColor: colors.background,
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    color: colors.textSecondary,
    fontWeight: '600',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    textTransform: 'uppercase'
  },
  settingIcon: {
    marginRight: spacing.md
  },
  settingItem: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  settingItemLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.textSecondary
  },
  settingText: {
    flex: 1
  },
  settingTitle: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 2
  }
});