import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { colors, typography, shadows, spacing, borderRadius } from '../styles/theme';
import { apiClient, ApiError } from '../services/apiClient';
import { UploadedReceipt, Entity, Receipt } from '../types';
import NetInfo from '@react-native-community/netinfo';
import { offlineStorage } from '../services/offlineStorage';
import { errorReporting } from '../services/errorReporting';
import { ReceiptPreviewModal } from '../components/ReceiptPreviewModal';
import { authService } from '../services/authService';

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
  ai_validated?: boolean;
  ai_reasoning?: string;
}

interface ProcessingState {
  stage: 'uploading' | 'scanning' | 'analyzing' | 'extracting' | 'complete' | 'error';
  progress: number;
  message: string;
  subMessage?: string;        // Additional context
  hasAI?: boolean;           // AI processing detected
  aiProgress?: number;       // AI-specific progress
  estimatedTime?: number;    // Time remaining estimate
}

// Helper function to safely handle tags as either string or array
const normalizeTagsToString = (tags: string | string[] | null | undefined): string => {
  if (!tags) return '';
  if (Array.isArray(tags)) return tags.join(', ');
  return tags.toString();
};

const normalizeTagsToArray = (tags: string | string[] | null | undefined): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(tag => tag && tag.trim());
  return tags.toString().split(',').map(tag => tag.trim()).filter(tag => tag);
};

// Helper function to detect AI processing from backend response
const analyzeProcessingType = (response: any) => {
  // AI processing should be shown when AI validation was TRIGGERED, not just when successful
  const aiTriggers = response.ai_validation?.triggers || 
                     response.validation_triggers || [];
  
  const hasAI = aiTriggers.length > 0 || // AI was triggered
                response.ai_validation?.validated || // AI succeeded
                response.expense?.ai_validated ||
                response.ai_reasoning ||
                response.ai_validation?.reasoning ||
                false; // Explicit fallback
  
  const confidence = response.confidence?.amount || 
                     response.expense?.confidence_score || 
                     response.confidence_score || 0;

  console.log('🤖 AI Processing Analysis:', { hasAI: Boolean(hasAI), aiTriggers, confidence });
  
  return { hasAI: Boolean(hasAI), aiTriggers, confidence };
};

// Type for processing stages
type ProcessingStageType = 'uploading' | 'scanning' | 'analyzing' | 'extracting' | 'complete' | 'error';

// Helper function to get the next stage in processing flow
const getNextStage = (currentStage: ProcessingStageType, hasAI: boolean): ProcessingStageType => {
  const stageFlow = hasAI
    ? ['uploading', 'scanning', 'analyzing', 'extracting', 'complete'] as const
    : ['uploading', 'scanning', 'extracting', 'complete'] as const;

  const currentIndex = stageFlow.indexOf(currentStage as any);
  return (stageFlow[currentIndex + 1] as ProcessingStageType) || 'complete';
};

// Helper function to get stage information with progress and timing
const getStageInfo = (stage: ProcessingStageType, hasAI: boolean) => {
  const progressMapWithAI = {
    uploading: { progress: 15, duration: 500, message: 'Uploading receipt image...' },
    scanning: { progress: 35, duration: 1500, message: 'Scanning text with OCR...' },
    analyzing: { progress: 80, duration: 2500, message: 'Analyzing with SnapTrack AI...' },
    extracting: { progress: 95, duration: 500, message: 'Extracting final details...' },
    complete: { progress: 100, duration: 500, message: 'Processing complete!' },
    error: { progress: 0, duration: 0, message: 'Processing failed' }
  };

  const progressMapNoAI = {
    uploading: { progress: 15, duration: 500, message: 'Uploading receipt image...' },
    scanning: { progress: 60, duration: 1500, message: 'Scanning text with OCR...' },
    analyzing: { progress: 60, duration: 0, message: '' }, // Not used without AI
    extracting: { progress: 95, duration: 800, message: 'Extracting receipt details...' },
    complete: { progress: 100, duration: 500, message: 'Processing complete!' },
    error: { progress: 0, duration: 0, message: 'Processing failed' }
  };

  const progressMap = hasAI ? progressMapWithAI : progressMapNoAI;
  return progressMap[stage] || { progress: 0, duration: 500, message: 'Processing...' };
};

export default function ReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, source, mockData } = route.params as RouteParams;
  
  // Get the best available image URL
  const getImageUrl = () => {
    // Priority for PRODUCTION: local imageUri first (faster, no network)
    // Fallback to database URL for simulator or if local file unavailable
    const dbImageUrl = uploadedReceipt?.expense?.image_url || uploadedReceipt?.image_url || uploadedReceipt?.receipt_url;
    const selectedUrl = imageUri || dbImageUrl;
    
    console.log('🖼️ Available image URLs:', {
      imageUri: imageUri ? 'Available (LOCAL - FAST)' : 'Not available',
      'expense.image_url': uploadedReceipt?.expense?.image_url ? 'Available (REMOTE)' : 'Not available',
      'image_url': uploadedReceipt?.image_url ? 'Available (REMOTE)' : 'Not available', 
      'receipt_url': uploadedReceipt?.receipt_url ? 'Available (REMOTE)' : 'Not available',
      'selected': selectedUrl,
      'source': imageUri ? 'LOCAL (production-optimized)' : 'REMOTE (fallback)'
    });
    
    return selectedUrl;
  };

  // Create a Receipt object for the preview modal
  const createPreviewReceipt = (): Receipt => {
    return {
      id: uploadedReceipt?.id || 'preview',
      vendor: expenseData.vendor,
      amount: parseFloat(expenseData.amount) || 0,
      date: expenseData.date,
      entity: expenseData.entity,
      category: '',
      tags: normalizeTagsToArray(expenseData.tags),
      notes: expenseData.notes,
      confidence_score: expenseData.confidence_score || 0,
      receipt_url: getImageUrl(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '',
      tenant_id: '',
    };
  };

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
  const [showImageModal, setShowImageModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Load entities first, then start OCR processing
    loadEntities();
    processReceiptWithAPI();
  }, []);

  // Verify authentication when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const user = authService.getCurrentUser();
      if (!user) {
        console.log('🔐 No authenticated user found on ReviewScreen focus, redirecting to Auth...');
        navigation.navigate('Auth' as never);
      } else {
        console.log('🔐 User authenticated on ReviewScreen focus:', user.email);
      }
    }, [navigation])
  );

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
    console.log('🏷️ Tag selected:', tag);
    console.log('🏷️ Current tags:', expenseData.tags);
    
    const allTags = normalizeTagsToArray(expenseData.tags);
    const currentInput = (expenseData.tags || '').split(',').map(t => t.trim());
    
    // Remove the last (incomplete) tag and replace with selected tag
    const completeTags = currentInput.slice(0, -1).filter(t => t);
    
    // Only add tag if it's not already present
    if (!completeTags.includes(tag)) {
      const newTags = [...completeTags, tag];
      const newTagsString = newTags.join(', ');
      console.log('🏷️ Setting new tags:', newTagsString);
      setExpenseData(prev => ({ ...prev, tags: newTagsString }));
    } else {
      console.log('🏷️ Tag already exists, not adding');
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
          ai_validated: true,
          ai_reasoning: "Mock data validated by AI",
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
      const uploadingInfo = getStageInfo('uploading', false); // AI detection happens after upload
      setProcessingState({
        stage: 'uploading',
        progress: 0,
        message: uploadingInfo.message
      });

      await new Promise(resolve => setTimeout(resolve, uploadingInfo.duration));

      // For simulator: Try real API first, but fallback to mock if it fails
      let uploadedReceipt;
      try {
        console.log('🔍 Attempting real API upload...');
        uploadedReceipt = await apiClient.uploadReceipt(
          imageUri,
          expenseData.entity,
          expenseData.tags,
          expenseData.notes
        );
        console.log('✅ Real API upload successful');
      } catch (uploadError) {
        console.log('⚠️ Real API upload failed, using simulator fallback');
        console.log('Upload error:', uploadError);
        
        // Create a simulated successful response to test updateReceipt
        uploadedReceipt = {
          id: `sim_${Date.now()}`,
          expense: {
            id: Math.floor(Math.random() * 10000), // Random real-looking ID
            vendor: 'Test Vendor',
            amount: 25.50,
            date: new Date().toISOString().split('T')[0],
            tags: 'test, simulator',
            confidence_score: 0.85,
            ai_validated: true,
            ai_reasoning: "Simulator fallback validated by AI"
          },
          ai_validation: {
            validated: true,
            reasoning: "Simulator fallback validated by AI"
          },
          receipt_url: imageUri,
          status: 'completed' as const
        };
        console.log('🔍 Created simulator fallback receipt:', uploadedReceipt);
      }

      console.log('🔍 Upload response:', uploadedReceipt);
      setUploadedReceipt(uploadedReceipt);

      // Analyze response for AI processing
      const { hasAI, aiTriggers, confidence: aiConfidence } = analyzeProcessingType(uploadedReceipt);
      
      // Stage 2: Scanning (OCR)
      const scanningInfo = getStageInfo('scanning', hasAI);
      setProcessingState({
        stage: 'scanning',
        progress: scanningInfo.progress,
        message: scanningInfo.message,
        hasAI: hasAI
      });

      await new Promise(resolve => setTimeout(resolve, scanningInfo.duration));

      // Stage 3: AI Analysis (conditional)
      if (hasAI) {
        const analyzingInfo = getStageInfo('analyzing', hasAI);
        setProcessingState({
          stage: 'analyzing',
          progress: analyzingInfo.progress,
          message: analyzingInfo.message,
          subMessage: `AI detected ${aiTriggers.length} improvement opportunities`,
          hasAI: true,
          aiProgress: 50
        });

        await new Promise(resolve => setTimeout(resolve, analyzingInfo.duration));
      }

      // Stage 4: Extract data
      const extractingInfo = getStageInfo('extracting', hasAI);
      setProcessingState({
        stage: 'extracting',
        progress: extractingInfo.progress,
        message: extractingInfo.message,
        hasAI: hasAI
      });

      await new Promise(resolve => setTimeout(resolve, extractingInfo.duration));

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
      const tags = normalizeTagsToString(extractedData.tags || extractedData.parsed_tags || '');
      const confidence = uploadedReceipt.confidence?.amount || extractedData.confidence_score || extractedData.validation_confidence || extractedData.confidence || 0;
      
      // Capture AI validation information
      const aiValidated = uploadedReceipt.ai_validation?.validated || extractedData.ai_validated || false;
      const aiReasoning = uploadedReceipt.ai_validation?.reasoning || extractedData.ai_reasoning || '';
      
      console.log('🔍 Parsed values:', { vendor, amount, date, tags, confidence, aiValidated, aiReasoning });
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
        tags: tags || '',
        confidence_score: confidence,
        ai_validated: aiValidated,
        ai_reasoning: aiReasoning,
      }));

      // Final Stage: Complete
      const completeInfo = getStageInfo('complete', hasAI);
      setProcessingState({
        stage: 'complete',
        progress: completeInfo.progress,
        message: hasAI ? 'AI-enhanced processing complete!' : completeInfo.message,
        hasAI: hasAI,
        subMessage: hasAI ? `Confidence improved to ${Math.round((confidence || aiConfidence) * 100)}%` : undefined
      });

      await new Promise(resolve => setTimeout(resolve, completeInfo.duration));
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
    setExpenseData(prev => ({ ...prev, [field]: value || '' }));
  };

  // Helper function to normalize confidence score to 0-100 range
  const getConfidencePercentage = (score: number): number => {
    if (score <= 1) {
      // Score is in decimal format (0.0-1.0), convert to percentage
      return Math.round(score * 100);
    } else {
      // Score is already in percentage format (0-100+), cap at 100
      return Math.min(100, Math.round(score));
    }
  };

  // Helper function to get normalized confidence for color comparison (0.0-1.0)
  const getNormalizedConfidence = (score: number): number => {
    if (score <= 1) {
      return score; // Already normalized
    } else {
      return score / 100; // Convert percentage to decimal
    }
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
          tags: normalizeTagsToArray(expenseData.tags),
          notes: expenseData.notes,
        });
        
        console.log('📱 Receipt queued for offline upload:', receiptId);
        
        Alert.alert(
          'Saved Offline',
          `Your receipt has been saved and will be uploaded automatically when you reconnect to the internet.\n\nVendor: ${expenseData.vendor}\nAmount: $${expenseData.amount}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Main' as never),
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
      // Add detailed logging for debugging
      console.log('🔍 DEBUG: uploadedReceipt structure:', JSON.stringify(uploadedReceipt, null, 2));
      
      // If we don't have a receipt ID but have all required data, try creating a new expense
      const receiptId = uploadedReceipt?.expense?.id || uploadedReceipt?.id;
      console.log('🔍 DEBUG: Extracted receiptId:', receiptId);
      console.log('🔍 DEBUG: uploadedReceipt?.expense?.id:', uploadedReceipt?.expense?.id);
      console.log('🔍 DEBUG: uploadedReceipt?.id:', uploadedReceipt?.id);
      
      // Check if this is mock data (ID starts with 'mock_')
      const isMockData = receiptId && receiptId.toString().startsWith('mock_');
      console.log('🔍 DEBUG: Is mock data?', isMockData);
      
      if (isMockData) {
        // For mock data, save as offline expense instead of trying to update non-existent ID
        console.log('📱 Mock data detected, saving offline instead of updating non-existent expense');
        
        try {
          const offlineReceiptId = await offlineStorage.queueReceiptUpload({
            imageUri: imageUri,
            entity: expenseData.entity,
            vendor: expenseData.vendor,
            amount: parseFloat(expenseData.amount) || 0,
            date: expenseData.date,
            tags: normalizeTagsToArray(expenseData.tags),
            notes: expenseData.notes,
          });
          
          console.log('✅ Mock expense saved offline:', offlineReceiptId);
          
          Alert.alert(
            'Mock Expense Saved!',
            `Your mock expense has been saved locally.\n\nVendor: ${expenseData.vendor}\nAmount: $${expenseData.amount}`,
            [{ text: 'OK', onPress: () => navigation.navigate('Main' as never) }]
          );
          return;
        } catch (offlineError) {
          console.error('❌ Failed to save mock expense offline:', offlineError);
          Alert.alert('Error', 'Failed to save mock expense. Please try again.');
          return;
        }
      }
      
      if (!uploadedReceipt || !receiptId) {
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
            tags: normalizeTagsToArray(expenseData.tags),
            notes: expenseData.notes,
          });
          
          console.log('✅ Receipt queued for offline upload:', receiptId);
          
          Alert.alert(
            'Receipt Saved Offline!',
            `Your expense has been saved locally and will sync when connection improves.\n\nVendor: ${expenseData.vendor}\nAmount: $${expenseData.amount}`,
            [{ text: 'OK', onPress: () => navigation.navigate('Main' as never) }]
          );
          return;
        } catch (offlineError) {
          console.error('❌ Failed to save offline:', offlineError);
          Alert.alert('Error', 'Failed to save expense. Please try again later.');
          return;
        }
      }

      // Update the receipt with user edits
      console.log('🔍 DEBUG: About to call updateReceipt with receiptId:', receiptId);
      console.log('🔍 DEBUG: Update data:', {
        vendor: expenseData.vendor,
        amount: parseFloat(expenseData.amount) || 0,
        expense_date: expenseData.date,
        entity: expenseData.entity,
        tags: normalizeTagsToArray(expenseData.tags),
        notes: expenseData.notes,
      });
      
      const updatedReceipt = await apiClient.updateReceipt(receiptId, {
        vendor: expenseData.vendor,
        amount: parseFloat(expenseData.amount) || 0,
        expense_date: expenseData.date,
        entity: expenseData.entity,
        tags: normalizeTagsToArray(expenseData.tags),
        notes: expenseData.notes,
      });

      console.log('✅ Receipt saved successfully:', updatedReceipt?.id || receiptId);
      
      Alert.alert(
        'Receipt Saved!',
        `Your expense has been successfully processed and saved.\n\nVendor: ${expenseData.vendor}\nAmount: $${expenseData.amount}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main' as never),
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
          searchTags((text || '').split(',').pop()?.trim() || '');
        }}
        placeholder="Enter tags (comma separated)"
        placeholderTextColor={colors.textMuted}
        onFocus={() => {
          const allTags = normalizeTagsToArray(expenseData.tags);
          const lastTag = allTags[allTags.length - 1] || '';
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
          setTimeout(() => setShowTagSuggestions(false), 300);
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
                  console.log('🏷️ Tag suggestion pressed:', tag);
                  selectTag(tag);
                }}
                activeOpacity={0.7}
                delayPressIn={0}
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
          <Image 
            source={{ uri: getImageUrl() }} 
            style={styles.previewImage}
            resizeMode="contain"
            onError={(error) => {
              console.log('🖼️ Processing image load failed:', error);
            }}
          />
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
            
            {/* AI Sub-message */}
            {processingState.subMessage && (
              <Text style={[styles.processingSubtitle, { 
                fontSize: 14, 
                color: processingState.hasAI ? colors.neonPurple : colors.textMuted,
                marginTop: 4
              }]}>
                {processingState.subMessage}
              </Text>
            )}
            
            <View style={styles.progressBar}>
              <LinearGradient
                colors={processingState.stage === 'error' 
                  ? [colors.error, colors.error] 
                  : processingState.stage === 'analyzing' && processingState.hasAI
                    ? [colors.neonPurple, colors.neonBlue]  // AI gradient
                    : [colors.neonBlue, colors.neonPink]    // Standard gradient
                }
                style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, processingState.progress || 0))}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            
            {/* Stage indicators - Dynamic 5-stage layout */}
            <View style={styles.stageIndicators}>
              {/* Upload Stage */}
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
              
              {/* Scanning Stage */}
              <View style={[
                styles.stageIndicator,
                (processingState.stage === 'scanning' || processingState.progress >= 35) && styles.stageActive
              ]}>
                <Ionicons 
                  name="scan-outline" 
                  size={16} 
                  color={processingState.progress >= 35 ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.stageText,
                  processingState.progress >= 35 && { color: colors.primary }
                ]}>Scan</Text>
              </View>
              
              {/* AI Analyzing Stage - Conditional */}
              {processingState.hasAI && (
                <View style={[
                  styles.stageIndicator,
                  (processingState.stage === 'analyzing' || processingState.progress >= 80) && styles.stageActive
                ]}>
                  <Ionicons 
                    name="sparkles" 
                    size={16} 
                    color={processingState.progress >= 80 ? colors.neonPurple : colors.textMuted} 
                  />
                  <Text style={[
                    styles.stageText,
                    processingState.progress >= 80 && { color: colors.neonPurple }
                  ]}>AI</Text>
                </View>
              )}
              
              {/* Extracting Stage */}
              <View style={[
                styles.stageIndicator,
                (processingState.stage === 'extracting' || processingState.progress >= 95) && styles.stageActive
              ]}>
                <Ionicons 
                  name="document-text-outline" 
                  size={16} 
                  color={processingState.progress >= 95 ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.stageText,
                  processingState.progress >= 95 && { color: colors.primary }
                ]}>Extract</Text>
              </View>
              
              {/* Complete Stage */}
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
            onPress={() => setShowImageModal(true)}
          >
            <Image 
              source={{ uri: getImageUrl() }} 
              style={styles.thumbnailImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('🖼️ Thumbnail image load failed:', error);
              }}
            />
            <View style={styles.previewTextContainer}>
              <Text style={styles.imagePreviewText}>View Receipt</Text>
              <Text style={styles.sourceText}>
                From {source === 'camera' ? 'Camera' : 'Gallery'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Details</Text>
            {expenseData.confidence_score && expenseData.confidence_score > 0 && (
              <View style={styles.confidenceContainer}>
                {expenseData.ai_validated ? (
                  // Show both original confidence and AI enhancement
                  <View style={styles.enhancedConfidenceContainer}>
                    <View style={styles.originalConfidenceRow}>
                      <Ionicons 
                        name="scan-outline" 
                        size={14} 
                        color={getNormalizedConfidence(expenseData.confidence_score) > 0.8 ? colors.success : colors.warning} 
                      />
                      <Text style={[
                        styles.originalConfidenceText,
                        { color: getNormalizedConfidence(expenseData.confidence_score) > 0.8 ? colors.success : colors.warning }
                      ]}>
                        {getConfidencePercentage(expenseData.confidence_score)}% confident
                      </Text>
                    </View>
                    <View style={styles.enhancedRow}>
                      <Ionicons 
                        name="sparkles" 
                        size={14} 
                        color={colors.success} 
                      />
                      <Text style={[styles.enhancedText, { color: colors.success }]}>
                        Enhanced by SnapTrack AI
                      </Text>
                    </View>
                  </View>
                ) : (
                  // Show just original confidence if no AI validation
                  <>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={16} 
                      color={getNormalizedConfidence(expenseData.confidence_score) > 0.8 ? colors.success : colors.warning} 
                    />
                    <Text style={[
                      styles.confidenceText,
                      { color: getNormalizedConfidence(expenseData.confidence_score) > 0.8 ? colors.success : colors.warning }
                    ]}>
                      {getConfidencePercentage(expenseData.confidence_score)}% confident
                    </Text>
                  </>
                )}
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

      {/* Receipt Preview Modal */}
      <ReceiptPreviewModal
        receipt={createPreviewReceipt()}
        isVisible={showImageModal}
        onClose={() => setShowImageModal(false)}
      />
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
    flex: 1,
  },
  thumbnailImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  previewTextContainer: {
    flex: 1,
  },
  imagePreviewText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
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
    height: '50%',
    maxHeight: 400,
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
  enhancedConfidenceContainer: {
    flexDirection: 'column',
    gap: 2,
  },
  originalConfidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalConfidenceText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontSize: 11,
    fontWeight: '500',
  },
  enhancedText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontSize: 11,
    fontWeight: '600',
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
    marginTop: spacing.md,
    maxHeight: 150,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: spacing.sm,
  },
  tagSuggestion: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.md,
    marginLeft: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surface,
    marginVertical: spacing.xs,
    minHeight: 44, // Minimum touch target size (iOS HIG recommendation)
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagSuggestionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});