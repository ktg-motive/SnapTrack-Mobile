import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../styles/theme';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <Text style={styles.headerSubtitle}>Last Updated: July 3, 2025</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By using SnapTrack mobile app, you agree to these Terms of Service. If you do not agree, please do not use the app.
        </Text>

        <Text style={styles.sectionTitle}>About SnapTrack</Text>
        <Text style={styles.paragraph}>
          SnapTrack is developed by Motive AI, a Division of Motive Development, Inc. SnapTrack is a receipt management and expense tracking application that helps you:
        </Text>
        <Text style={styles.paragraph}>
          • Capture and organize receipts{'\n'}
          • Extract data using OCR technology{'\n'}
          • Track expenses with flexible categorization{'\n'}
          • Export data for tax and accounting purposes
        </Text>

        <Text style={styles.sectionTitle}>User Responsibilities</Text>
        <Text style={styles.subsectionTitle}>Account Security</Text>
        <Text style={styles.paragraph}>
          • Maintain confidentiality of your account credentials{'\n'}
          • Notify us immediately of any unauthorized access{'\n'}
          • Use strong passwords and enable available security features
        </Text>

        <Text style={styles.subsectionTitle}>Data Accuracy</Text>
        <Text style={styles.paragraph}>
          • Verify OCR-extracted data for accuracy{'\n'}
          • Provide accurate expense categorization{'\n'}
          • Maintain proper records for tax/business purposes
        </Text>

        <Text style={styles.subsectionTitle}>Acceptable Use</Text>
        <Text style={styles.paragraph}>
          • Use the app only for legitimate expense tracking{'\n'}
          • Do not upload inappropriate or illegal content{'\n'}
          • Respect intellectual property rights{'\n'}
          • Follow all applicable laws and regulations
        </Text>

        <Text style={styles.sectionTitle}>Service Availability</Text>
        <Text style={styles.subsectionTitle}>Uptime</Text>
        <Text style={styles.paragraph}>
          • We strive for 99.9% uptime but cannot guarantee continuous availability{'\n'}
          • Scheduled maintenance will be announced in advance{'\n'}
          • Emergency maintenance may occur without notice
        </Text>

        <Text style={styles.subsectionTitle}>Data Backup</Text>
        <Text style={styles.paragraph}>
          • Regular automated backups of your data{'\n'}
          • You are responsible for maintaining your own backups{'\n'}
          • Export functionality available for data portability
        </Text>

        <Text style={styles.sectionTitle}>Limitation of Liability</Text>
        <Text style={styles.subsectionTitle}>Service Limitations</Text>
        <Text style={styles.paragraph}>
          • SnapTrack is provided "as is" without warranties{'\n'}
          • OCR technology may contain errors - user verification required{'\n'}
          • Not responsible for tax or accounting advice{'\n'}
          • Users responsible for compliance with tax laws
        </Text>

        <Text style={styles.subsectionTitle}>Liability Limits</Text>
        <Text style={styles.paragraph}>
          • Our liability is limited to the amount you paid for the service{'\n'}
          • We are not liable for indirect, incidental, or consequential damages{'\n'}
          • Some jurisdictions may not allow liability limitations
        </Text>

        <Text style={styles.sectionTitle}>Data Ownership and Usage</Text>
        <Text style={styles.subsectionTitle}>Your Data</Text>
        <Text style={styles.paragraph}>
          • You retain all rights to your receipt and expense data{'\n'}
          • We do not claim ownership of your uploaded content{'\n'}
          • You grant us license to process your data to provide the service
        </Text>

        <Text style={styles.subsectionTitle}>Service Improvements</Text>
        <Text style={styles.paragraph}>
          • We may use aggregated, anonymous data to improve the service{'\n'}
          • No personal or identifying information is used for this purpose{'\n'}
          • You can opt out of analytics in app settings
        </Text>

        <Text style={styles.sectionTitle}>Account Termination</Text>
        <Text style={styles.subsectionTitle}>User Termination</Text>
        <Text style={styles.paragraph}>
          • You may delete your account at any time{'\n'}
          • All data will be permanently deleted within 30 days{'\n'}
          • Export your data before deletion if needed
        </Text>

        <Text style={styles.subsectionTitle}>Service Termination</Text>
        <Text style={styles.paragraph}>
          • We may terminate accounts for violations of these terms{'\n'}
          • 30-day notice will be provided for service discontinuation{'\n'}
          • Data export will be available during notice period
        </Text>

        <Text style={styles.sectionTitle}>Changes to Terms</Text>
        <Text style={styles.paragraph}>
          • We reserve the right to modify these terms{'\n'}
          • Users will be notified of material changes{'\n'}
          • Continued use constitutes acceptance of new terms
        </Text>

        <Text style={styles.sectionTitle}>Governing Law</Text>
        <Text style={styles.paragraph}>
          These terms are governed by the laws of Alabama, United States.
        </Text>

        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.paragraph}>
          Company: Motive Development, Inc.{'\n'}
          Division: Motive AI{'\n'}
          Email: legal@snaptrack.bot{'\n'}
          Website: https://motiveai.ai
        </Text>
        <Text style={styles.paragraph}>
          For questions about these terms, contact legal@snaptrack.bot.
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
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerTitle: {
    ...typography.title1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.xl,
    backgroundColor: colors.card,
    margin: spacing.lg,
    borderRadius: 12,
  },
  sectionTitle: {
    ...typography.title3,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  subsectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  paragraph: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
});