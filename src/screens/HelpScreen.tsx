import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../styles/theme';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful_count: number;
}

export default function HelpScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<number>>(new Set());

  const categories = [
    { key: 'all', title: 'All Topics', count: 13 },
    { key: 'getting-started', title: 'Getting Started', count: 2 },
    { key: 'organizing', title: 'Organizing Expenses', count: 3 },
    { key: 'troubleshooting', title: 'Troubleshooting', count: 2 },
    { key: 'security', title: 'Security & Privacy', count: 2 },
  ];

  const faqData: FAQItem[] = [
    {
      category: 'getting-started',
      question: 'How do I capture my first receipt?',
      answer: 'Tap the "Capture Receipt" button on the main screen, then take a photo of your receipt. The app will automatically extract the vendor name, amount, and date using OCR technology. Make sure your receipt is well-lit and clearly visible for best results.',
      tags: ['capture', 'photo', 'ocr', 'first-time'],
      helpful_count: 24,
    },
    {
      category: 'getting-started',
      question: 'What types of receipts work best?',
      answer: 'SnapTrack works with most paper receipts including restaurants, retail stores, gas stations, and professional services. For best OCR accuracy: ensure good lighting, avoid wrinkled receipts, and capture the entire receipt in the frame.',
      tags: ['receipt-types', 'paper', 'accuracy'],
      helpful_count: 18,
    },
    {
      category: 'organizing',
      question: 'How do I edit receipt information?',
      answer: 'After capturing a receipt, you can edit the vendor name, amount, date, and add tags or notes. Simply tap on any field in the review screen to modify it. All changes are saved automatically.',
      tags: ['editing', 'modify', 'details'],
      helpful_count: 22,
    },
    {
      category: 'organizing',
      question: 'What are tags and how do I use them?',
      answer: 'Tags help you categorize expenses for easier tracking and reporting. You can add multiple tags like "business", "travel", "meals", or custom tags. This makes it easy to filter and analyze your expenses later.',
      tags: ['tags', 'categories', 'organization'],
      helpful_count: 19,
    },
    {
      category: 'organizing',
      question: 'How do I organize expenses by project or client?',
      answer: 'Use tags to categorize expenses by project, client, or department. You can add multiple tags to each receipt. This helps with project cost tracking, client billing, and business reporting.',
      tags: ['projects', 'clients', 'tracking'],
      helpful_count: 16,
    },
    {
      category: 'troubleshooting',
      question: 'Why is my receipt amount wrong?',
      answer: 'OCR technology is very accurate but not perfect. Always verify extracted amounts and edit if needed. For best results: ensure receipts are clear, well-lit, and not wrinkled. You can always manually correct any extracted information.',
      tags: ['ocr', 'accuracy', 'amounts', 'verification'],
      helpful_count: 41,
    },
    {
      category: 'troubleshooting',
      question: 'My receipt image is blurry, what should I do?',
      answer: 'Retake the photo with better lighting and steady hands. Ensure the entire receipt is visible in the frame. You can retake photos by going back to the camera screen if needed.',
      tags: ['blurry', 'lighting', 'retake'],
      helpful_count: 16,
    },
    {
      category: 'security',
      question: 'How secure is my financial data?',
      answer: 'Very secure! All data is encrypted in transit and at rest using bank-grade security measures. We never share your data with third parties. You have full control to export or delete your data at any time.',
      tags: ['security', 'encryption', 'privacy'],
      helpful_count: 28,
    },
    {
      category: 'security',
      question: 'Can I delete my account and data?',
      answer: 'Yes, you have complete control over your data. Contact support@snaptrack.bot to delete your account. All data will be permanently removed within 30 days. You can export your data before deletion.',
      tags: ['delete', 'account', 'data-control'],
      helpful_count: 12,
    },
  ];

  const filteredFAQs = faqData.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const submitFeedback = (index: number, isHelpful: boolean) => {
    setFeedbackSubmitted(prev => new Set(prev).add(index));
  };

  const renderFAQItem = (item: FAQItem, index: number) => (
    <View key={index} style={styles.faqItem}>
      <TouchableOpacity
        style={styles.questionContainer}
        onPress={() => toggleExpanded(index)}
      >
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>{item.question}</Text>
          <View style={styles.questionMeta}>
            <Ionicons name="thumbs-up" size={12} color={colors.success} />
            <Text style={styles.helpfulCount}>{item.helpful_count}</Text>
          </View>
        </View>
        <Ionicons
          name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>
      {expandedIndex === index && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{item.answer}</Text>
          <View style={styles.tags}>
            {item.tags.slice(0, 3).map((tag, tagIndex) => (
              <View key={tagIndex} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackQuestion}>Was this helpful?</Text>
            {feedbackSubmitted.has(index) ? (
              <Text style={styles.feedbackThanks}>Thanks for your feedback!</Text>
            ) : (
              <View style={styles.feedbackButtons}>
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.helpfulButton]}
                  onPress={() => submitFeedback(index, true)}
                >
                  <Ionicons name="thumbs-up" size={16} color={colors.success} />
                  <Text style={styles.helpfulText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.notHelpfulButton]}
                  onPress={() => submitFeedback(index, false)}
                >
                  <Ionicons name="thumbs-down" size={16} color={colors.error} />
                  <Text style={styles.notHelpfulText}>No</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>
          Find answers to common questions about using SnapTrack
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search help articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.key && styles.categoryButtonTextActive
            ]}>
              {category.title}
            </Text>
            <Text style={[
              styles.categoryCount,
              selectedCategory === category.key && styles.categoryCountActive
            ]}>
              {category.count}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          {searchQuery ? `Results for "${searchQuery}"` : 
           selectedCategory === 'all' ? 'All Help Topics' : 
           categories.find(c => c.key === selectedCategory)?.title}
        </Text>
        <Text style={styles.resultsCount}>
          {filteredFAQs.length} article{filteredFAQs.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* FAQ Items */}
      <View style={styles.faqContainer}>
        {filteredFAQs.map((item, index) => renderFAQItem(item, index))}
      </View>

      {/* Contact Support */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Still need help?</Text>
        <Text style={styles.footerText}>
          Contact our support team for personalized assistance with your SnapTrack account.
        </Text>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="mail" size={20} color="white" />
          <Text style={styles.contactButtonText}>Contact Support</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  categoryScroll: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  categoryCount: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCountActive: {
    color: colors.primary,
    backgroundColor: 'white',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  resultsTitle: {
    ...typography.title3,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resultsCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  faqContainer: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  questionHeader: {
    flex: 1,
    marginRight: spacing.sm,
  },
  questionText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulCount: {
    ...typography.caption,
    fontSize: 12,
    color: colors.success,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  answerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  answerText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  feedbackContainer: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  feedbackQuestion: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  feedbackButtons: {
    flexDirection: 'row',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  helpfulButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.success,
  },
  notHelpfulButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.error,
  },
  helpfulText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  notHelpfulText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  feedbackThanks: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
  },
  footer: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerTitle: {
    ...typography.title3,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  contactButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: 'white',
    marginLeft: spacing.sm,
  },
});