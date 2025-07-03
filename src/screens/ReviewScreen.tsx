import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { colors, typography, shadows, spacing, borderRadius } from '../styles/theme';
import { apiClient, ApiError } from '../services/apiClient';
import { UploadedReceipt, Entity } from '../types';
import NetInfo from '@react-native-community/netinfo';
import { offlineStorage } from '../services/offlineStorage';
import { errorReporting } from '../services/errorReporting';

interface RouteParams {
  imageUri: string;
  source: 'camera' | 'library';
  mockData?: {
    vendor: string;
    amount: number;
    date: string;
    tags: string;
    confidence_score: number;
  };
}

interface ExpenseData {
  vendor: string;
  amount: string;
  date: string;
  entity: string;
  tags: string;
  notes: string;
  confidence_score?: number;
}

interface ProcessingState {
  stage: 'uploading' | 'processing' | 'extracting' | 'complete' | 'error';
  progress: number;
  message: string;
}

export default function ReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, source, mockData } = route.params as RouteParams;

  const [isProcessing, setIsProcessing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: 'uploading',
    progress: 0,
    message: 'Uploading receipt image...'
  });
  const [uploadedReceipt, setUploadedReceipt] = useState<UploadedReceipt | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [expenseData, setExpenseData] = useState<ExpenseData>({
    vendor: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    entity: '',
    tags: '',
    notes: '',
    confidence_score: 0,
  });
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Load entities first, then start OCR processing
    loadEntities();
    processReceiptWithAPI();
  }, []);

  const loadEntities = async () => {
    try {
      setLoadingEntities(true);
      const userEntities = await apiClient.getEntities();
      setEntities(userEntities);
      
      // Set default entity to first one if available
      if (userEntities.length > 0 && !expenseData.entity) {
        setExpenseData(prev => ({ ...prev, entity: userEntities[0].name }));
      }
    } catch (error) {
      console.error('❌ Failed to load entities:', error);
      // Fallback to default entities if API fails
      const fallbackEntities: Entity[] = [
        { id: '1', name: 'Personal', email_identifier: 'personal', created_at: '', updated_at: '' },
        { id: '2', name: 'Business', email_identifier: 'business', created_at: '', updated_at: '' },
        { id: '3', name: 'Travel', email_identifier: 'travel', created_at: '', updated_at: '' }
      ];
      setEntities(fallbackEntities);
      setExpenseData(prev => ({ ...prev, entity: fallbackEntities[0].name }));
    } finally {
      setLoadingEntities(false);
    }
  };

  const searchTags = async (query: string) => {
    if (query.length < 2) {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
      return;
    }

    try {
      const suggestions = await apiClient.searchTags(query, 10);
      setTagSuggestions(suggestions);
      setShowTagSuggestions(true);
    } catch (error) {
      console.error('❌ Failed to search tags:', error);
      setTagSuggestions([]);
      setShowTagSuggestions(false);
    }
  };

  const selectTag = (tag: string) => {
    const allTags = expenseData.tags.split(',').map(t => t.trim());
    // Remove the last (incomplete) tag and replace with selected tag
    const completeTags = allTags.slice(0, -1).filter(t => t);
    
    if (!completeTags.includes(tag)) {
      const newTags = [...completeTags, tag].join(', ');
      setExpenseData(prev => ({ ...prev, tags: newTags }));
    }
    setShowTagSuggestions(false);
  };

  const processReceiptWithAPI = async () => {
    try {
      if (mockData) {
        // Use mock data for simulator testing
        console.log('📱 Using mock receipt data for simulator');
        
        setProcessingState({
          stage: 'processing',
          progress: 50,
          message: 'Processing mock receipt...'
        });

        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time

        // Create mock uploaded receipt
        const mockUploadedReceipt = {
          id: `mock_${Date.now()}`,
          extracted_data: {
            vendor: mockData.vendor,
            amount: mockData.amount,
            date: mockData.date,
            tags: mockData.tags,
            confidence_score: mockData.confidence_score
          },
          receipt_url: imageUri,
          status: 'completed' as const
        };

        setUploadedReceipt(mockUploadedReceipt);

        // Update form with mock data
        setExpenseData(prev => ({
          ...prev,
          vendor: mockData.vendor,
          amount: mockData.amount.toString(),
          date: mockData.date,
          tags: mockData.tags,
          confidence_score: mockData.confidence_score,
        }));

        setProcessingState({
          stage: 'completed',
          progress: 100,
          message: 'Mock processing complete!'
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsProcessing(false);
        return;
      }

      // Stage 1: Upload image
      setProcessingState({
        stage: 'uploading',
        progress: 0,
        message: 'Uploading receipt image...'
      });

      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      
      setProcessingState({
        stage: 'processing',
        progress: 25,
        message: 'Processing with OCR...'
      });

      // Upload to API for OCR processing
      const uploadedReceipt = await apiClient.uploadReceipt(
        imageUri,
        expenseData.entity,
        expenseData.tags,
        expenseData.notes
      );

      console.log('🔍 Upload response:', uploadedReceipt);
      setUploadedReceipt(uploadedReceipt);

      // Stage 2: Extract data
      setProcessingState({
        stage: 'extracting',
        progress: 75,
        message: 'Extracting receipt details...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000)); // Allow processing time

      // Update form with extracted data - handle multiple possible response formats
      // The backend returns data in the 'expense' object, not 'extracted_data'
      const extractedData = uploadedReceipt.expense || uploadedReceipt.extracted_data || uploadedReceipt || {};
      console.log('🔍 Raw upload response:', JSON.stringify(uploadedReceipt, null, 2));
      console.log('🔍 Upload response keys:', Object.keys(uploadedReceipt));
      console.log('🔍 Extracted data structure:', JSON.stringify(extractedData, null, 2));
      console.log('🔍 Extracted data keys:', Object.keys(extractedData));
      
      // Check for data in ALL possible locations in the response
      // Primary: Check the expense object from database (most reliable)
      // Secondary: Check extracted/corrected data from AI validation
      const vendor = extractedData.vendor || 
                     extractedData.corrected_vendor || 
                     extractedData.parsed_vendor || 
                     extractedData.vendor_name || 
                     extractedData.business_name || 
                     extractedData.merchant || '';
                     
      const amount = extractedData.amount || 
                     extractedData.corrected_amount || 
                     extractedData.parsed_amount || 
                     extractedData.total_amount || 
                     extractedData.total || 
                     extractedData.price || '';
                     
      const date = extractedData.expense_date || 
                   extractedData.date || 
                   extractedData.corrected_date || 
                   extractedData.parsed_date || 
                   extractedData.receipt_date || 
                   extractedData.transaction_date || 
                   new Date().toISOString().split('T')[0];
      const tags = extractedData.tags || extractedData.parsed_tags || '';
      const confidence = uploadedReceipt.confidence?.amount || extractedData.confidence_score || extractedData.validation_confidence || extractedData.confidence || 0;
      
      console.log('🔍 Parsed values:', { vendor, amount, date, tags, confidence });
      console.log('🔍 Setting form values - vendor:', vendor, 'amount:', amount);
      
      // Additional validation logging
      if (!vendor) {
        console.warn('⚠️ No vendor found in response. Available fields:', Object.keys(extractedData));
        console.warn('⚠️ Full response structure:', Object.keys(uploadedReceipt));
      }
      if (!amount) {
        console.warn('⚠️ No amount found in response. Available fields:', Object.keys(extractedData));
        console.warn('⚠️ Full response structure:', Object.keys(uploadedReceipt));
      }
      
      setExpenseData(prev => ({
        ...prev,
        vendor: vendor,
        amount: amount?.toString() || '',
        date: date,
        tags: tags,
        confidence_score: confidence,
      }));

      // Stage 3: Complete
      setProcessingState({
        stage: 'complete',
        progress: 100,
        message: 'Processing complete!'
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      setIsProcessing(false);

    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      
      setProcessingState({
        stage: 'error',
        progress: 0,
        message: error instanceof ApiError ? error.message : 'Processing failed'
      });

      // Fall back to manual entry after showing error
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    }
  };

  const updateExpenseData = (field: keyof ExpenseData, value: string) => {
    setExpenseData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!expenseData.vendor || !expenseData.amount) {
      Alert.alert('Missing Information', 'Please fill in vendor and amount fields.');
      return;
    }

    setIsSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (!isConnected) {
      // Queue for offline upload
      try {
        const receiptId = await offlineStorage.queueReceiptUpload({
          imageUri: imageUri,
          entity: expenseData.entity,
          vendor: expenseData.vendor,
          amount: parseFloat(expenseData.amount) || 0,
          date: expenseData.date,
          tags: expenseData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          notes: expenseData.notes,
        });
        
        console.log('📱 Receipt queued for offline upload:', receiptId);
        
        Alert.alert(
          'Saved Offline',
          `Your receipt has been saved and will be uploaded automatically when you reconnect to the internet.\n\nVendor: ${expenseData.vendor}\nAmount: $${expenseData.amount}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Home' as never),
            },
          ]
        );
        
        return;
      } catch (error) {
        console.error('❌ Failed to queue offline receipt:', error);
        Alert.alert('Error', 'Failed to save receipt offline. Please try again.');
        return;
      } finally {
        setIsSaving(false);
      }
    }

    // Online - normal upload process
    try {
      // If we don't have a receipt ID but have all required data, try creating a new expense
      if (!uploadedReceipt || !uploadedReceipt.id) {
        console.log('⚠️ No receipt ID, attempting to create new expense directly');
        
        // Check if we have minimum required data
        if (!expenseData.vendor || !expenseData.amount) {
          Alert.alert('Missing Information', 'Please fill in vendor and amount fields.');
          return;
        }
        
        // No receipt ID means OCR processing failed - save offline for later processing
        console.log('⚠️ No receipt ID, saving offline for later OCR processing');
        
        try {
          const receiptId = await offlineStorage.queueReceiptUpload({
            imageUri: imageUri,
            entity: expenseData.entity,
            vendor: expenseData.vendor,
            amount: parseFloat(expenseData.amount) || 0,
            date: expenseData.date,
            tags: expenseData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            notes: expenseData.notes,
          });
          
          console.log('✅ Receipt queued for offline upload:', receiptId);
          
          Alert.alert(
            'Receipt Saved Offline!',
            `Your expense has been saved locally and will sync when connection improves.\n\nVendor: ${expenseData.vendor}\nAmount: $${expenseData.amount}`,
            [{ text: 'OK', onPress: () => navigation.navigate('Home' as never) }]
          );
          return;
        } catch (offlineError) {
          console.error('❌ Failed to save offline:', offlineError);
          Alert.alert('Error', 'Failed to save expense. Please try again later.');
          return;
        }
      }

      // Update the receipt with user edits
      const updatedReceipt = await apiClient.updateReceipt(uploadedReceipt.id, {
        vendor: expenseData.vendor,
        amount: parseFloat(expenseData.amount) || 0,
        date: expenseData.date,
        entity: expenseData.entity,
        tags: expenseData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        notes: expenseData.notes,
      });

      console.log('✅ Receipt saved successfully:', updatedReceipt.id);
      
      Alert.alert(
        'Receipt Saved!',
        `Your expense has been successfully processed and saved.\n\nVendor: ${expenseData.vendor}\nAmount: $${expenseData.amount}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home' as never),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Failed to save receipt:', error);
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to save expense. Please try again.';
        
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: any = 'default',
    multiline = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        onFocus={() => {
          if (multiline && scrollViewRef.current) {
            // Scroll with extra offset for notes field to account for keyboard + save button
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({ 
                y: 1000, // Large offset to ensure field is visible above keyboard
                animated: true 
              });
            }, 300); // Longer delay to ensure keyboard is fully visible
          }
        }}
      />
    </View>
  );

  const renderTagsInputField = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Tags</Text>
      <TextInput
        style={styles.textInput}
        value={expenseData.tags}
        onChangeText={(text) => {
          updateExpenseData('tags', text);
          searchTags(text.split(',').pop()?.trim() || '');
        }}
        placeholder="Enter tags (comma separated)"
        placeholderTextColor={colors.textMuted}
        onFocus={() => {
          const lastTag = expenseData.tags.split(',').pop()?.trim() || '';
          if (lastTag.length >= 2) {
            searchTags(lastTag);
          }
          // Scroll to make tags field and suggestions visible above keyboard
          if (scrollViewRef.current) {
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({ 
                y: 800, // Offset to show tags field + suggestions above keyboard
                animated: true 
              });
            }, 300);
          }
        }}
        onBlur={() => {
          // Delay hiding suggestions to allow selection
          setTimeout(() => setShowTagSuggestions(false), 200);
        }}
      />
      {showTagSuggestions && tagSuggestions.length > 0 && (
        <View style={styles.tagSuggestions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tagSuggestions.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tagSuggestion}
                onPress={() => {
                  selectTag(tag);
                  setShowTagSuggestions(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.tagSuggestionText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderEntityPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Entity</Text>
      {loadingEntities ? (
        <View style={[styles.textInput, styles.entityPickerContainer]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading entities...</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.entityScrollContainer}
          contentContainerStyle={styles.entityScrollContent}
        >
          {entities.map((entity) => (
            <TouchableOpacity
              key={entity.id}
              style={[
                styles.entityChip,
                expenseData.entity === entity.name && styles.entityChipSelected
              ]}
              onPress={() => updateExpenseData('entity', entity.name)}
            >
              <Text style={[
                styles.entityChipText,
                expenseData.entity === entity.name && styles.entityChipTextSelected
              ]}>
                {entity.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <View style={styles.processingContent}>
            {processingState.stage === 'error' ? (
              <Ionicons name="alert-circle" size={60} color={colors.error} />
            ) : (
              <ActivityIndicator size="large" color={colors.primary} />
            )}
            
            <Text style={[
              styles.processingTitle,
              processingState.stage === 'error' && { color: colors.error }
            ]}>
              {processingState.stage === 'error' ? 'Processing Failed' : 'Processing Receipt...'}
            </Text>
            
            <Text style={styles.processingSubtitle}>
              {processingState.message}
            </Text>
            
            <View style={styles.progressBar}>
              <LinearGradient
                colors={processingState.stage === 'error' 
                  ? [colors.error, colors.error] 
                  : [colors.neonBlue, colors.neonPink]
                }
                style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, processingState.progress || 0))}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            
            {/* Stage indicators */}
            <View style={styles.stageIndicators}>
              <View style={[
                styles.stageIndicator,
                (processingState.stage === 'uploading' || processingState.progress > 0) && styles.stageActive
              ]}>
                <Ionicons 
                  name="cloud-upload-outline" 
                  size={16} 
                  color={processingState.progress > 0 ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.stageText,
                  processingState.progress > 0 && { color: colors.primary }
                ]}>Upload</Text>
              </View>
              
              <View style={[
                styles.stageIndicator,
                processingState.progress >= 25 && styles.stageActive
              ]}>
                <Ionicons 
                  name="scan-outline" 
                  size={16} 
                  color={processingState.progress >= 25 ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.stageText,
                  processingState.progress >= 25 && { color: colors.primary }
                ]}>Scan</Text>
              </View>
              
              <View style={[
                styles.stageIndicator,
                processingState.progress >= 75 && styles.stageActive
              ]}>
                <Ionicons 
                  name="document-text-outline" 
                  size={16} 
                  color={processingState.progress >= 75 ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.stageText,
                  processingState.progress >= 75 && { color: colors.primary }
                ]}>Extract</Text>
              </View>
              
              <View style={[
                styles.stageIndicator,
                processingState.progress >= 100 && styles.stageActive
              ]}>
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={16} 
                  color={processingState.progress >= 100 ? colors.success : colors.textMuted} 
                />
                <Text style={[
                  styles.stageText,
                  processingState.progress >= 100 && { color: colors.success }
                ]}>Complete</Text>
              </View>
            </View>
            
            {processingState.stage === 'error' && (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setIsProcessing(true);
                  processReceiptWithAPI();
                }}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.touchContainer}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>Review & Edit</Text>
              
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              ref={scrollViewRef}
              style={styles.content} 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={true}
              alwaysBounceVertical={true}
              scrollEventThrottle={16}
            >
        {/* Receipt Preview - Compact */}
        <View style={styles.compactImageContainer}>
          <TouchableOpacity 
            style={styles.imagePreviewButton}
            onPress={() => {
              // Navigate to full image view or open modal
              Alert.alert(
                'Receipt Image',
                'View full receipt image?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'View', 
                    onPress: () => {
                      // Could navigate to full image screen or open modal
                      console.log('View full image:', imageUri);
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
            <Text style={styles.imagePreviewText}>View Receipt</Text>
          </TouchableOpacity>
          <View style={styles.sourceTag}>
            <Text style={styles.sourceText}>
              From {source === 'camera' ? 'Camera' : 'Gallery'}
            </Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Details</Text>
            {expenseData.confidence_score && expenseData.confidence_score > 0 && (
              <View style={styles.confidenceContainer}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={expenseData.confidence_score > 0.8 ? colors.success : colors.warning} 
                />
                <Text style={[
                  styles.confidenceText,
                  { color: expenseData.confidence_score > 0.8 ? colors.success : colors.warning }
                ]}>
                  {Math.round(expenseData.confidence_score * 100)}% confident
                </Text>
              </View>
            )}
          </View>
          
          {renderInputField(
            'Vendor',
            expenseData.vendor,
            (text) => updateExpenseData('vendor', text),
            'Enter vendor name'
          )}
          
          {renderInputField(
            'Amount',
            expenseData.amount,
            (text) => updateExpenseData('amount', text),
            '0.00',
            'decimal-pad'
          )}
          
          {renderInputField(
            'Date',
            expenseData.date,
            (text) => updateExpenseData('date', text),
            'YYYY-MM-DD'
          )}
          
          {renderTagsInputField()}
          
          {renderEntityPicker()}
          
          {renderInputField(
            'Notes',
            expenseData.notes,
            (text) => updateExpenseData('notes', text),
            'Additional notes (optional)',
            'default',
            true
          )}
        </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.saveButtonGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                  <Text style={styles.saveButtonText}>
                    {isSaving ? 'Saving...' : 'Save Expense'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  touchContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: 4,
  },
  headerTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retakeText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  compactImageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  imagePreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  imagePreviewText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  sourceTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  sourceText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  formContainer: {
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  textInput: {
    ...typography.body,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface,
    color: colors.textPrimary,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  bottomActions: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  saveButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  saveButtonText: {
    ...typography.body,
    color: 'white',
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  processingContainer: {
    flex: 1,
    padding: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  processingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    ...typography.title2,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  processingSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  stageIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  stageIndicator: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  stageActive: {
    // Active stage styling handled by color changes
  },
  stageText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  retryButtonText: {
    ...typography.body,
    color: 'white',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  confidenceText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontWeight: '600',
    fontSize: 12,
  },
  entityPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  entityScrollContainer: {
    marginTop: spacing.xs,
  },
  entityScrollContent: {
    paddingHorizontal: spacing.xs,
  },
  entityChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  entityChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  entityChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  entityChipTextSelected: {
    color: 'white',
  },
  tagSuggestions: {
    marginTop: spacing.sm,
    maxHeight: 120,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tagSuggestion: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface,
    marginVertical: 2,
  },
  tagSuggestionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});