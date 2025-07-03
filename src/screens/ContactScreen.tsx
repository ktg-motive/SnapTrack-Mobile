import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../styles/theme';

export default function ContactScreen() {
  const [feedbackType, setFeedbackType] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const contactMethods = [
    {
      title: 'Email Support',
      subtitle: 'support@snaptrack.bot',
      icon: 'mail' as keyof typeof Ionicons.glyphMap,
      action: () => Linking.openURL('mailto:support@snaptrack.bot'),
    },
    {
      title: 'Privacy Questions',
      subtitle: 'privacy@snaptrack.bot',
      icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
      action: () => Linking.openURL('mailto:privacy@snaptrack.bot'),
    },
    {
      title: 'Bug Reports',
      subtitle: 'bugs@snaptrack.bot',
      icon: 'bug' as keyof typeof Ionicons.glyphMap,
      action: () => Linking.openURL('mailto:bugs@snaptrack.bot'),
    },
  ];

  const feedbackTypes = [
    { value: 'general', label: 'General Support' },
    { value: 'bug', label: 'Report a Bug' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'data', label: 'Data/Privacy Issue' },
  ];

  const handleSendFeedback = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message fields.');
      return;
    }

    const emailSubject = `[SnapTrack Mobile] ${subject}`;
    const emailBody = `
Feedback Type: ${feedbackTypes.find(t => t.value === feedbackType)?.label}

Message:
${message}

---
Device Information:
• Platform: iOS
• App Version: 1.0.0
• User: ${new Date().toISOString()}
    `.trim();

    const emailTo = feedbackType === 'bug' ? 'bugs@snaptrack.bot' : 
                   feedbackType === 'feature' ? 'features@snaptrack.bot' : 
                   'support@snaptrack.bot';

    const mailtoURL = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    Linking.openURL(mailtoURL);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <Text style={styles.headerSubtitle}>
          Get help with SnapTrack or send us your feedback
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Contact</Text>
        {contactMethods.map((method, index) => (
          <TouchableOpacity
            key={index}
            style={styles.contactItem}
            onPress={method.action}
          >
            <View style={styles.contactLeft}>
              <Ionicons 
                name={method.icon} 
                size={24} 
                color={colors.primary} 
                style={styles.contactIcon}
              />
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Feedback</Text>
        
        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Feedback Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {feedbackTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    feedbackType === type.value && styles.typeButtonActive
                  ]}
                  onPress={() => setFeedbackType(type.value)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    feedbackType === type.value && styles.typeButtonTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief description of your issue or request"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Please provide details about your issue, including any error messages or steps to reproduce the problem."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.sendButton} onPress={handleSendFeedback}>
            <Ionicons name="send" size={20} color="white" style={styles.sendIcon} />
            <Text style={styles.sendButtonText}>Send Feedback</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.responseSection}>
        <Text style={styles.responseTitle}>Response Time</Text>
        <Text style={styles.responseText}>
          We typically respond to support requests within 24-48 hours. 
          For urgent issues, please mark your email as "High Priority" in the subject line.
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
  contactIcon: {
    marginRight: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  contactSubtitle: {
    ...typography.caption,
    color: colors.primary,
  },
  formContainer: {
    padding: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  messageInput: {
    height: 120,
    paddingTop: spacing.sm,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  sendIcon: {
    marginRight: spacing.sm,
  },
  sendButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: 'white',
  },
  responseSection: {
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  responseTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  responseText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});