import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../styles/theme';

interface SettingItem {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showArrow?: boolean;
}

export default function SettingsScreen() {
  const navigation = useNavigation();

  const settingsItems: SettingItem[] = [
    {
      title: 'Help & Support',
      subtitle: 'Get help using SnapTrack',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('Help' as never),
      showArrow: true,
    },
    {
      title: 'Contact Support',
      subtitle: 'Get in touch with our team',
      icon: 'mail-outline',
      onPress: () => navigation.navigate('Contact' as never),
      showArrow: true,
    },
    {
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      icon: 'shield-checkmark-outline',
      onPress: () => navigation.navigate('PrivacyPolicy' as never),
      showArrow: true,
    },
    {
      title: 'Terms of Service',
      subtitle: 'Terms and conditions',
      icon: 'document-text-outline',
      onPress: () => navigation.navigate('TermsOfService' as never),
      showArrow: true,
    },
    {
      title: 'About SnapTrack',
      subtitle: 'Version info and credits',
      icon: 'information-circle-outline',
      onPress: () => navigation.navigate('About' as never),
      showArrow: true,
    },
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
        <Text style={styles.sectionTitle}>Support</Text>
        {settingsItems.slice(0, 2).map(renderSettingItem)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        {settingsItems.slice(2, 4).map(renderSettingItem)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        {settingsItems.slice(4).map(renderSettingItem)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerTitle: {
    ...typography.title1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surface,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});