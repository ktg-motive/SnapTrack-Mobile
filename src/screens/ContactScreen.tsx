import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../styles/theme';
import { FeedbackType } from '../types/feedback';

export default function ContactScreen() {
  const navigation = useNavigation();

  const contactMethods = [
    {
      title: 'General Support',
      subtitle: 'Get help with your account or general questions',
      icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
      action: () => navigation.navigate('Feedback' as never, { 
        initialType: FeedbackType.GENERAL_RATING,
        initialContext: 'Contact screen - General support'
      }),
    },
    {
      title: 'Report a Problem',
      subtitle: 'Something not working? Let us know about bugs or issues',
      icon: 'bug' as keyof typeof Ionicons.glyphMap,
      action: () => navigation.navigate('Feedback' as never, { 
        initialType: FeedbackType.PROBLEM_REPORT,
        initialContext: 'Contact screen - Problem report'
      }),
    },
    {
      title: 'Request a Feature',
      subtitle: 'Suggest improvements or new features',
      icon: 'bulb' as keyof typeof Ionicons.glyphMap,
      action: () => navigation.navigate('Feedback' as never, { 
        initialType: FeedbackType.FEATURE_REQUEST,
        initialContext: 'Contact screen - Feature request'
      }),
    },
    {
      title: 'Privacy Questions',
      subtitle: 'Questions about data privacy and security',
      icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
      action: () => navigation.navigate('Feedback' as never, { 
        initialType: FeedbackType.GENERAL_RATING,
        initialContext: 'Contact screen - Privacy question'
      }),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <Text style={styles.headerSubtitle}>
          Get help with SnapTrack or send us your feedback. All messages are submitted securely through our feedback system.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How can we help?</Text>
        {contactMethods.map((method, index) => (
          <TouchableOpacity
            key={index}
            style={styles.contactItem}
            onPress={method.action}
          >
            <View style={styles.contactLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons 
                  name={method.icon} 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="time" size={24} color={colors.primary} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Response Time</Text>
            <Text style={styles.infoText}>
              We typically respond to feedback within 24-48 hours. For urgent issues, please provide detailed information in your message.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.success} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Privacy & Security</Text>
            <Text style={styles.infoText}>
              Your feedback is submitted securely and can be sent anonymously if you prefer. We protect your privacy while helping you get the support you need.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="chatbubbles" size={24} color={colors.warning} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Better Support</Text>
            <Text style={styles.infoText}>
              Our structured feedback system helps us categorize and prioritize your requests, ensuring you get faster and more relevant assistance.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footerSection}>
        <Text style={styles.footerText}>
          Need immediate help? Check out our Help section for common questions and troubleshooting guides.
        </Text>
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => navigation.navigate('Help' as never)}
        >
          <Ionicons name="library" size={16} color={colors.primary} style={styles.helpIcon} />
          <Text style={styles.helpButtonText}>View Help Articles</Text>
        </TouchableOpacity>
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
    lineHeight: 20,
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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  contactSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  infoSection: {
    margin: spacing.lg,
    gap: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  infoIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footerSection: {
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  helpIcon: {
    marginRight: spacing.xs,
  },
  helpButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
});