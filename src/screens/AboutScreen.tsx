import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../styles/theme';
import SnapTrackLogo from '../components/SnapTrackLogo';
import { VERSION_INFO } from '../utils/version';

export default function AboutScreen() {
  // Dynamic version info from Expo config
  const appVersion = VERSION_INFO.version;
  const buildNumber = VERSION_INFO.buildNumber;

  const openURL = (url: string) => {
    Linking.openURL(url);
  };

  const credits = [
    {
      library: 'React Native',
      purpose: 'Mobile app framework',
      license: 'MIT',
    },
    {
      library: 'Expo',
      purpose: 'Development and deployment platform',
      license: 'MIT',
    },
    {
      library: 'Google Cloud Vision',
      purpose: 'OCR text extraction',
      license: 'Commercial',
    },
    {
      library: 'Supabase',
      purpose: 'Database and backend services',
      license: 'Apache 2.0',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <SnapTrackLogo width={120} height={120} />
        </View>
        
        <Text style={styles.appName}>SnapTrack</Text>
        <Text style={styles.appSubtitle}>by Motive AI</Text>
        <Text style={styles.versionText}>Version {appVersion} ({buildNumber})</Text>
        
        <Text style={styles.description}>
          Smart receipt processing that transforms expense tracking from tedious monthly chore to effortless real-time capture.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Motive AI</Text>
        <View style={styles.creatorInfo}>
          <Text style={styles.creatorRole}>Creator of SnapTrack</Text>
          <Text style={styles.creatorDescription}>
            Motive AI, a Division of Motive Development, Inc., specializes in creating intelligent 
            solutions that streamline business operations through advanced AI technology.
          </Text>
          <TouchableOpacity
            style={styles.websiteButton}
            onPress={() => openURL('https://motiveai.ai')}
          >
            <Text style={styles.websiteButtonText}>Visit motiveai.ai</Text>
            <Ionicons name="open-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Open Source Licenses</Text>
        {credits.map((credit, index) => (
          <View key={index} style={styles.creditItem}>
            <View style={styles.creditInfo}>
              <Text style={styles.creditTitle}>{credit.library}</Text>
              <Text style={styles.creditPurpose}>{credit.purpose}</Text>
            </View>
            <Text style={styles.creditLicense}>{credit.license}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 Motive Development, Inc. All rights reserved.
        </Text>
        <Text style={styles.footerText}>
          Motive AI Division
        </Text>
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.title1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  appSubtitle: {
    ...typography.title3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
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
  creatorInfo: {
    padding: spacing.lg,
  },
  creatorRole: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  creatorDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
    ...shadows.button,
  },
  websiteButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
    marginRight: spacing.xs,
  },
  creditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  creditInfo: {
    flex: 1,
  },
  creditTitle: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  creditPurpose: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  creditLicense: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});