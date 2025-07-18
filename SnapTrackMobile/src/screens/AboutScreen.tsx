import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../styles/theme';
import SnapTrackLogo from '../components/SnapTrackLogo';

export default function AboutScreen() {

  const openURL = (url: string) => {
    Linking.openURL(url);
  };

  const credits = [
    {
      library: 'React Native',
      purpose: 'Mobile app framework',
      license: 'MIT'
    },
    {
      library: 'Expo',
      purpose: 'Development and deployment platform',
      license: 'MIT'
    },
    {
      library: 'AI Vision Services',
      purpose: 'OCR text extraction',
      license: 'Commercial'
    },
    {
      library: 'Cloud Database',
      purpose: 'Data storage and backend services',
      license: 'Apache 2.0'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <SnapTrackLogo width={120} height={120} />
        </View>
        
        <Text style={styles.appName}>SnapTrack</Text>
        <Text style={styles.appSubtitle}>by Motive AI</Text>
        
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
  appName: {
    ...typography.title1,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  appSubtitle: {
    ...typography.title3,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  creatorDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20
  },
  creatorInfo: {
    padding: spacing.lg
  },
  creatorRole: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm
  },
  creditInfo: {
    flex: 1
  },
  creditItem: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  creditLicense: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500'
  },
  creditPurpose: {
    ...typography.caption,
    color: colors.textSecondary
  },
  creditTitle: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 2
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
    textAlign: 'center'
  },
  footer: {
    alignItems: 'center',
    padding: spacing.xl
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    padding: spacing.xl
  },
  logoContainer: {
    marginBottom: spacing.md
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
  websiteButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.button
  },
  websiteButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
    marginRight: spacing.xs
  }
});