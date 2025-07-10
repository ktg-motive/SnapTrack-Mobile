import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing } from '../styles/theme';
import { apiClient } from '../services/apiClient';
import { HelpCategory, HelpArticle } from '../types';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful_count: number;
}

type ViewType = 'categories' | 'articles' | 'article';

interface HelpScreenProps {
  onRestartOnboarding?: () => void;
}

export default function HelpScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { onRestartOnboarding } = (route.params as HelpScreenProps) || {};
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [currentArticle, setCurrentArticle] = useState<HelpArticle | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [view, setView] = useState<ViewType>('categories');
  const [loading, setLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<string>>(new Set());

  // Load categories and articles on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getHelpCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Failed to load help categories:', error);
      // Fallback to static categories if API fails
      setCategories([
        { id: '1', key: 'getting-started', title: '🚀 Getting Started', description: 'App tutorial and basics', article_count: 6 },
        { id: '2', key: 'organizing', title: 'Organizing Expenses', description: 'Manage your receipts', article_count: 4 },
        { id: '3', key: 'troubleshooting', title: 'Troubleshooting', description: 'Solve common issues', article_count: 3 },
        { id: '4', key: 'reports-export', title: 'Reports & Export', description: 'Export and analyze data', article_count: 4 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async (category?: string, search?: string) => {
    try {
      setLoading(true);
      const params: { category?: string; search?: string } = {};
      if (category && category !== 'all') params.category = category;
      if (search) params.search = search;

      const response = await apiClient.getHelpArticles(params);
      setArticles(response.articles);
    } catch (error) {
      console.error('Failed to load help articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecificArticle = async (articleKey: string) => {
    try {
      setLoading(true);
      const response = await apiClient.getHelpArticle(articleKey);
      setCurrentArticle(response.article);
    } catch (error) {
      console.error('Failed to load help article:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic category and search handling
  const handleCategorySelect = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setView('articles');
    loadArticles(categoryKey, searchQuery);
  };

  const handleArticleSelect = (article: HelpArticle) => {
    setCurrentArticle(article);
    setView('article');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setView('articles');
      loadArticles(selectedCategory, query);
    } else if (selectedCategory !== 'all') {
      loadArticles(selectedCategory, '');
    } else {
      setView('categories');
    }
  };

  const goBack = () => {
    if (view === 'article') {
      setView('articles');
      setCurrentArticle(null);
    } else if (view === 'articles') {
      setView('categories');
      setSelectedCategory('all');
      setSearchQuery('');
    }
  };

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const submitFeedback = async (articleId: string, isHelpful: boolean, feedbackText?: string) => {
    try {
      await apiClient.submitHelpFeedback(articleId, isHelpful, feedbackText);
      setFeedbackSubmitted(prev => new Set(prev).add(articleId));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleContactSupport = () => {
    navigation.navigate('Contact');
  };

  const handleRestartTutorial = async () => {
    console.log('🔄 Tutorial restart button pressed');
    Alert.alert(
      'Restart Tutorial',
      'This will restart the interactive app tutorial to show you how to use SnapTrack.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Tutorial', 
          onPress: async () => {
            try {
              console.log('🚀 Starting tutorial restart process...');
              // Clear onboarding completion flag
              await AsyncStorage.removeItem('onboarding_completed');
              console.log('✅ Onboarding flag cleared from storage');
              
              if (onRestartOnboarding) {
                console.log('📲 Using onRestartOnboarding callback');
                // Use the callback if available (when navigated from Settings)
                onRestartOnboarding();
              } else {
                console.log('📱 Triggering app state change to restart onboarding');
                // Trigger app state change by navigating away and back
                // This will cause the AppState handler in App.tsx to recheck onboarding
                Alert.alert(
                  'Tutorial Reset',
                  'The tutorial has been reset. Tap OK and put the app in background briefly, then return to start the tutorial.',
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      // Navigate to home to ensure we're in a good state
                      navigation.navigate('Main', { screen: 'HomeTab' });
                    }
                  }]
                );
              }
            } catch (error) {
              console.error('❌ Error restarting tutorial:', error);
              Alert.alert('Error', 'Failed to restart tutorial. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderArticleItem = (article: HelpArticle, index: number) => (
    <TouchableOpacity
      key={article.id}
      style={styles.faqItem}
      onPress={() => handleArticleSelect(article)}
    >
      <View style={styles.questionHeader}>
        <Text style={styles.questionText}>{article.title}</Text>
        <View style={styles.questionMeta}>
          <Ionicons name="thumbs-up" size={12} color={colors.success} />
          <Text style={styles.helpfulCount}>{article.helpful_count}</Text>
        </View>
      </View>
      <Text style={styles.excerptText}>{article.excerpt}</Text>
      <View style={styles.tags}>
        {article.tags.slice(0, 3).map((tag, tagIndex) => (
          <View key={tagIndex} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <Ionicons
        name="chevron-forward"
        size={24}
        color={colors.primary}
        style={styles.chevronIcon}
      />
    </TouchableOpacity>
  );

  const renderCategoryItem = (category: HelpCategory) => (
    <TouchableOpacity
      key={category.key}
      style={styles.categoryCard}
      onPress={() => handleCategorySelect(category.key)}
    >
      <Text style={styles.categoryTitle}>{category.title}</Text>
      <Text style={styles.categoryDescription}>{category.description}</Text>
      <Text style={styles.categoryArticleCount}>{category.article_count} articles</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {view !== 'categories' && (
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {view === 'categories' ? 'Help & Support' :
               view === 'articles' ? (categories.find(c => c.key === selectedCategory)?.title || 'Articles') :
               currentArticle?.title || 'Article'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {view === 'categories' ? 'Find answers to common questions about using SnapTrack' :
               view === 'articles' ? `${articles.length} articles available` :
               currentArticle?.help_categories.title || ''}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading help content...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Search - only show in categories and articles views */}
          {view !== 'article' && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search help articles..."
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )}

          {/* Categories View */}
          {view === 'categories' && (
            <View style={styles.categoriesContainer}>
              <Text style={styles.sectionTitle}>Choose a Help Category</Text>
              
              {/* Tutorial Card */}
              <TouchableOpacity 
                style={styles.tutorialCard} 
                onPress={handleRestartTutorial}
                onPressIn={() => console.log('🔍 Tutorial card touch detected')}
                activeOpacity={0.7}
              >
                <View style={styles.tutorialIcon}>
                  <Ionicons name="play-circle" size={32} color={colors.primary} />
                </View>
                <View style={styles.tutorialContent}>
                  <Text style={styles.tutorialTitle}>📱 Interactive App Tutorial</Text>
                  <Text style={styles.tutorialDescription}>
                    Restart the guided walkthrough to learn how to use SnapTrack step-by-step
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
              
              {categories.map(renderCategoryItem)}
            </View>
          )}

          {/* Articles View */}
          {view === 'articles' && (
            <View style={styles.articlesContainer}>
              <Text style={styles.sectionTitle}>
                {searchQuery ? `Search Results for "${searchQuery}"` : 'Help Articles'}
              </Text>
              {articles.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No articles found. Try adjusting your search.</Text>
                </View>
              ) : (
                articles.map(renderArticleItem)
              )}
            </View>
          )}

          {/* Article View */}
          {view === 'article' && currentArticle && (
            <View style={styles.articleContainer}>
              <Text style={styles.articleTitle}>{currentArticle.title}</Text>
              <MarkdownRenderer content={currentArticle.content} />
              
              {/* Tags */}
              <View style={styles.tags}>
                {currentArticle.tags.map((tag, tagIndex) => (
                  <View key={tagIndex} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Feedback */}
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackQuestion}>Was this helpful?</Text>
                {feedbackSubmitted.has(currentArticle.id) ? (
                  <Text style={styles.feedbackThanks}>Thanks for your feedback!</Text>
                ) : (
                  <View style={styles.feedbackButtons}>
                    <TouchableOpacity
                      style={[styles.feedbackButton, styles.helpfulButton]}
                      onPress={() => submitFeedback(currentArticle.id, true)}
                    >
                      <Ionicons name="thumbs-up" size={16} color={colors.success} />
                      <Text style={styles.helpfulText}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.feedbackButton, styles.notHelpfulButton]}
                      onPress={() => submitFeedback(currentArticle.id, false)}
                    >
                      <Ionicons name="thumbs-down" size={16} color={colors.error} />
                      <Text style={styles.notHelpfulText}>No</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Contact Support - show in all views */}
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>Still need help?</Text>
            <Text style={styles.footerText}>
              Contact our support team for personalized assistance with your SnapTrack account.
            </Text>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
              <Ionicons name="mail" size={20} color="white" />
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.title2,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  categoriesContainer: {
    padding: spacing.lg,
  },
  tutorialCard: {
    backgroundColor: colors.primary + '10', // Primary color with low opacity
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorialIcon: {
    marginRight: spacing.md,
  },
  tutorialContent: {
    flex: 1,
  },
  tutorialTitle: {
    ...typography.title3,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tutorialDescription: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  categoryTitle: {
    ...typography.title3,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  categoryDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  categoryArticleCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  articlesContainer: {
    padding: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  articleContainer: {
    padding: spacing.lg,
  },
  articleTitle: {
    ...typography.title1,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  articleContent: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  excerptText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  chevronIcon: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
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
  faqItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface,
    position: 'relative',
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