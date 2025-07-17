import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { colors, typography, spacing } from '../styles/theme';
import { FeedbackType } from '../types/feedback';
import type { RootStackParamList } from '../types/navigation';

export default function ContactScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const contactMethods = [
    {
      title: 'General Support',
      subtitle: 'Get help with your account or general questions',
      icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
      action: () => navigation.navigate('Feedback', { 
        initialType: FeedbackType.GENERAL_RATING,
        initialContext: 'Contact screen - General support'
      })
    },
    {
      title: 'Report a Problem',
      subtitle: 'Something not working? Let us know about bugs or issues',
      icon: 'bug' as keyof typeof Ionicons.glyphMap,
      action: () => navigation.navigate('Feedback', { 
        initialType: FeedbackType.PROBLEM_REPORT,
        initialContext: 'Contact screen - Problem report'
      })
    },
    {
      title: 'Request a Feature',
      subtitle: 'Suggest improvements or new features',
      icon: 'bulb' as keyof typeof Ionicons.glyphMap,
      action: () => navigation.navigate('Feedback', { 
        initialType: FeedbackType.FEATURE_REQUEST,
        initialContext: 'Contact screen - Feature request'
      })
    },
    {
      title: 'Privacy Questions',
      subtitle: 'Questions about data privacy and security',
      icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
      action: () => navigation.navigate('Feedback', { 
        initialType: FeedbackType.GENERAL_RATING,
        initialContext: 'Contact screen - Privacy question'
      })
    }
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
  contactInfo: {
    flex: 1
  },
  contactItem: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  contactLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1
  },
  contactSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16
  },
  contactTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2
  },
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  footerSection: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    margin: spacing.lg,
    padding: spacing.md
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  header: {
    backgroundColor: colors.card,
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    padding: spacing.xl
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20
  },
  headerTitle: {
    ...typography.title1,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  helpButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  helpButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600'
  },
  helpIcon: {
    marginRight: spacing.xs
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 48
  },
  infoCard: {
    backgroundColor: colors.card,
    borderColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.md
  },
  infoContent: {
    flex: 1
  },
  infoIcon: {
    marginRight: spacing.md,
    marginTop: 2
  },
  infoSection: {
    gap: spacing.md,
    margin: spacing.lg
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18
  },
  infoTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
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
  }
});