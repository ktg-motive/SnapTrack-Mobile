import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../styles/theme';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.headerSubtitle}>Last Updated: July 3, 2025</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>About SnapTrack</Text>
        <Text style={styles.paragraph}>
          SnapTrack is developed by Motive AI, a Division of Motive Development, Inc. This privacy policy explains how we collect, use, and protect your personal information.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.subsectionTitle}>Receipt Data</Text>
        <Text style={styles.paragraph}>
          • Images of receipts you choose to upload{'\n'}
          • Extracted text data from receipts (vendor, amount, date){'\n'}
          • Expense categories and notes you add
        </Text>

        <Text style={styles.subsectionTitle}>Account Information</Text>
        <Text style={styles.paragraph}>
          • Email address for account identification{'\n'}
          • Device information for app functionality{'\n'}
          • Usage analytics to improve the app
        </Text>

        <Text style={styles.subsectionTitle}>Financial Data Protection</Text>
        <Text style={styles.paragraph}>
          • All receipt data is encrypted in transit and at rest{'\n'}
          • We use bank-grade security measures{'\n'}
          • Your data is never shared with third parties for marketing{'\n'}
          • You maintain full control over your data
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.subsectionTitle}>Primary Uses</Text>
        <Text style={styles.paragraph}>
          • Process and organize your receipt data{'\n'}
          • Provide expense tracking and reporting{'\n'}
          • Sync data across your devices{'\n'}
          • Improve app functionality and user experience
        </Text>

        <Text style={styles.subsectionTitle}>Data Retention</Text>
        <Text style={styles.paragraph}>
          • Receipt data is stored until you delete it{'\n'}
          • Account data is retained while your account is active{'\n'}
          • You can export or delete all data at any time
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.subsectionTitle}>Data Control</Text>
        <Text style={styles.paragraph}>
          • Export all your data in standard formats{'\n'}
          • Delete individual receipts or your entire account{'\n'}
          • Correct any inaccurate information{'\n'}
          • Opt out of analytics collection
        </Text>

        <Text style={styles.subsectionTitle}>Contact for Privacy Concerns</Text>
        <Text style={styles.paragraph}>
          Use the Contact Support feature in Settings{'\n'}
          Select "Privacy Questions" for data-related concerns{'\n'}
          Response time: Within 48 hours
        </Text>

        <Text style={styles.sectionTitle}>Security Measures</Text>
        <Text style={styles.subsectionTitle}>Technical Safeguards</Text>
        <Text style={styles.paragraph}>
          • End-to-end encryption for all data transmission{'\n'}
          • Secure cloud storage with enterprise-grade protection{'\n'}
          • Regular security audits and updates{'\n'}
          • No storage of receipt images on device
        </Text>

        <Text style={styles.subsectionTitle}>Access Controls</Text>
        <Text style={styles.paragraph}>
          • Multi-factor authentication support{'\n'}
          • Session timeouts for inactive accounts{'\n'}
          • Audit logs for all data access
        </Text>

        <Text style={styles.sectionTitle}>Third-Party Services</Text>
        <Text style={styles.subsectionTitle}>OCR Processing</Text>
        <Text style={styles.paragraph}>
          • Google Cloud Vision API for text extraction{'\n'}
          • Receipt images are processed but not stored by Google{'\n'}
          • No personal data shared beyond processing needs
        </Text>

        <Text style={styles.subsectionTitle}>Analytics</Text>
        <Text style={styles.paragraph}>
          • Anonymous usage statistics only{'\n'}
          • No personal or financial data in analytics{'\n'}
          • Opt-out available in app settings
        </Text>

        <Text style={styles.sectionTitle}>Changes to Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We will notify you of any material changes to this policy via:{'\n'}
          • In-app notification{'\n'}
          • Email to your registered address{'\n'}
          • Updated "Last Modified" date
        </Text>

        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.paragraph}>
          Company: Motive Development, Inc.{'\n'}
          Division: Motive AI{'\n'}
          Website: https://motiveai.ai
        </Text>
        <Text style={styles.paragraph}>
          For immediate privacy concerns, use the Contact Support feature in Settings and select "Privacy Questions" for fastest response.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: 12,
    margin: spacing.lg,
    padding: spacing.xl
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
    marginBottom: spacing.sm
  },
  paragraph: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.md
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    marginTop: spacing.lg
  },
  subsectionTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md
  }
});