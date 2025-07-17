import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing } from '../styles/theme';

// Import shared types
import { 
  FeedbackType, 
  FeedbackCategory, 
  FeedbackSubmission,
  FEEDBACK_CATEGORIES,
  validateFeedbackSubmission 
} from '../types/feedback';

interface FeedbackScreenProps {
  route?: {
    params?: {
      initialType?: FeedbackType;
      initialContext?: string;
    };
  };
}

interface CategoryOption {
  value: FeedbackCategory;
  label: string;
  description?: string;
}

const FEEDBACK_TYPES = [
  {
    type: FeedbackType.GENERAL_RATING,
    title: 'General Feedback',
    description: 'Share your overall experience',
    icon: 'star-outline',
    color: colors.primary
  },
  {
    type: FeedbackType.PROBLEM_REPORT,
    title: 'Report Problem',
    description: 'Something isn\'t working correctly',
    icon: 'bug-outline',
    color: colors.error
  },
  {
    type: FeedbackType.FEATURE_REQUEST,
    title: 'Feature Request',
    description: 'Suggest new features or improvements',
    icon: 'bulb-outline',
    color: colors.success
  }
];

export default function FeedbackScreen({ route }: FeedbackScreenProps) {
  const navigation = useNavigation();
  const { initialType = FeedbackType.GENERAL_RATING, initialContext } = route?.params || {};

  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | ''>('');
  const [rating, setRating] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState(initialContext || '');
  const [anonymous, setAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Load categories when feedback type changes
  useEffect(() => {
    const typeCategories = FEEDBACK_CATEGORIES[feedbackType] || [];
    setCategories(typeCategories);
    
    // Set first category as default
    if (typeCategories.length > 0) {
      setSelectedCategory(typeCategories[0].value);
    }
  }, [feedbackType]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Required Field', 'Please provide a message describing your feedback.');
      return;
    }

    // Validate with shared validation
    const submission: FeedbackSubmission = {
      type: feedbackType,
      category: selectedCategory as FeedbackCategory,
      rating,
      subject: subject.trim() || undefined,
      message: message.trim(),
      context: initialContext,
      platform: 'mobile',
      app_version: '1.0.0',
      device_info: `${Platform.OS} ${Platform.Version}`,
      anonymous
    };

    const validation = validateFeedbackSubmission(submission);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Replace with actual API endpoint when backend is available
      const response = await fetch('https://snaptrack-receipts-6b4ae7a14b3e.herokuapp.com/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submission)
      });

      const result = await response.json();

      if (result.success) {
        // Haptic feedback removed for compatibility
        
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully. We appreciate you helping us improve SnapTrack!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(result.error?.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert(
        'Submission Failed',
        'Failed to submit your feedback. Please check your internet connection and try again.',
        [
          { text: 'OK' }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => {
    if (feedbackType !== FeedbackType.GENERAL_RATING) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Rating *</Text>
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={async () => {
                // Haptic feedback removed for compatibility
                setRating(star);
              }}
              style={styles.starButton}
            >
              <Ionicons
                name={rating && star <= rating ? 'star' : 'star-outline'}
                size={32}
                color={rating && star <= rating ? colors.warning : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const selectedType = FEEDBACK_TYPES.find(type => type.type === feedbackType);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Feedback Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback Type *</Text>
            <View style={styles.typeContainer}>
              {FEEDBACK_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.type}
                  onPress={async () => {
                  // Haptic feedback removed for compatibility
                    setFeedbackType(type.type);
                    setSelectedCategory('');
                    setRating(null);
                  }}
                  style={[
                    styles.typeButton,
                    feedbackType === type.type && styles.typeButtonSelected
                  ]}
                >
                  <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
                    <Ionicons name={type.icon as any} size={20} color="white" />
                  </View>
                  <View style={styles.typeContent}>
                    <Text style={[
                      styles.typeTitle,
                      feedbackType === type.type && styles.typeTextSelected
                    ]}>
                      {type.title}
                    </Text>
                    <Text style={[
                      styles.typeDescription,
                      feedbackType === type.type && styles.typeDescriptionSelected
                    ]}>
                      {type.description}
                    </Text>
                  </View>
                  {feedbackType === type.type && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Selection */}
          {categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category *</Text>
              <View style={styles.categoryContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    onPress={async () => {
                    // Haptic feedback removed for compatibility
                      setSelectedCategory(category.value);
                    }}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.value && styles.categoryButtonSelected
                    ]}
                  >
                    <View style={styles.categoryContent}>
                      <Text style={[
                        styles.categoryTitle,
                        selectedCategory === category.value && styles.categoryTextSelected
                      ]}>
                        {category.label}
                      </Text>
                      {category.description && (
                        <Text style={[
                          styles.categoryDescription,
                          selectedCategory === category.value && styles.categoryDescriptionSelected
                        ]}>
                          {category.description}
                        </Text>
                      )}
                    </View>
                    {selectedCategory === category.value && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Star Rating */}
          {renderStarRating()}

          {/* Subject */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subject (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief summary of your feedback"
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
            />
          </View>

          {/* Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message *</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Please provide detailed feedback..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />
            <View style={styles.characterCount}>
              <Text style={styles.characterCountText}>
                {message.length}/2000 characters
              </Text>
              {message.length >= 10 && (
                <Text style={styles.validationText}>✓ Minimum length met</Text>
              )}
            </View>
          </View>

          {/* Anonymous Option */}
          <TouchableOpacity
            onPress={async () => {
            // Haptic feedback removed for compatibility
              setAnonymous(!anonymous);
            }}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, anonymous && styles.checkboxChecked]}>
              {anonymous && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
            Submit anonymously (we won't be able to follow up with you)
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              (!message.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            disabled={!message.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </View>
            ) : (
              <View style={styles.submitButtonContent}>
                <Ionicons name="send" size={16} color="white" />
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: spacing.xs
  },
  bottomPadding: {
    height: spacing.xl
  },
  categoryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderRadius: spacing.xs,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.sm
  },
  categoryButtonSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary
  },
  categoryContainer: {
    gap: spacing.xs
  },
  categoryContent: {
    flex: 1
  },
  categoryDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2
  },
  categoryDescriptionSelected: {
    color: colors.primary
  },
  categoryTextSelected: {
    color: colors.primary
  },
  categoryTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  characterCount: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs
  },
  characterCountText: {
    ...typography.body2,
    color: colors.textSecondary
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.outline,
    borderRadius: 4,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 20
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkboxLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    flex: 1
  },
  checkboxRow: {
    alignItems: 'center',
    borderBottomColor: colors.outline,
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: spacing.md
  },
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.outline,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  headerRight: {
    width: 40
  },
  headerTitle: {
    ...typography.title2,
    color: colors.textPrimary
  },
  keyboardView: {
    flex: 1
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: 'top'
  },
  scrollContent: {
    paddingBottom: spacing.xl
  },
  scrollView: {
    flex: 1
  },
  section: {
    borderBottomColor: colors.outline,
    borderBottomWidth: 1,
    padding: spacing.md
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  starButton: {
    padding: spacing.xs
  },
  starContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center'
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    margin: spacing.md,
    padding: spacing.md
  },
  submitButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  submitButtonDisabled: {
    backgroundColor: colors.outline
  },
  submitButtonText: {
    ...typography.title3,
    color: 'white'
  },
  textInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderRadius: spacing.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    padding: spacing.sm
  },
  typeButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderRadius: spacing.sm,
    borderWidth: 2,
    flexDirection: 'row',
    padding: spacing.md
  },
  typeButtonSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary
  },
  typeContainer: {
    gap: spacing.sm
  },
  typeContent: {
    flex: 1
  },
  typeDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2
  },
  typeDescriptionSelected: {
    color: colors.primary
  },
  typeIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 40
  },
  typeTextSelected: {
    color: colors.primary
  },
  typeTitle: {
    ...typography.title3,
    color: colors.textPrimary
  },
  validationText: {
    ...typography.body2,
    color: colors.success
  }
});