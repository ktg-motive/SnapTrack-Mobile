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
  AppState
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
import { shareService } from '../services/shareService';

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
      vendor: String(expenseData.vendor || 'Unknown'),
      amount: parseFloat(expenseData.amount) || 0,
      date: String(expenseData.date || new Date().toISOString()),
      entity: String(expenseData.entity || ''),
      category: '',
      tags: normalizeTagsToArray(expenseData.tags),
      notes: String(expenseData.notes || ''),
      confidence_score: expenseData.confidence_score || 0,
      receipt_url: getImageUrl(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '',
      tenant_id: ''
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
    confidence_score: 0
  });
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const tagBlurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const uploadStartTime = useRef<number | null>(null);

  useEffect(() => {
    // Load entities first, then start OCR processing
    loadEntities();
    processReceiptWithAPI();
    
    // Cleanup function
    return () => {
      if (tagBlurTimeoutRef.current) {
        clearTimeout(tagBlurTimeoutRef.current);
      }
    };
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
  
  // Handle app state changes (background/foreground) during upload
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('📱 App state changed to:', nextAppState);
      
      // If we're processing and app goes to background, warn user
      if (nextAppState === 'background' && isProcessing) {
        console.warn('⚠️ Upload in progress while app going to background');
      }
      
      // If returning from background while stuck in upload, show error
      if (nextAppState === 'active' && isProcessing && processingState.stage === 'uploading') {
        const uploadDuration = Date.now() - (uploadStartTime.current || Date.now());
        if (uploadDuration > 15000) { // Stuck for more than 15 seconds
          console.error('❌ Upload appears stuck after returning from background');
          setProcessingState({
            stage: 'error',
            progress: 0,
            message: 'Upload interrupted. Please try again.'
          });
          setIsProcessing(false);
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isProcessing, processingState.stage]);

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
    
    // Clear the blur timeout to prevent race condition
    if (tagBlurTimeoutRef.current) {
      clearTimeout(tagBlurTimeoutRef.current);
      tagBlurTimeoutRef.current = null;
    }
    
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
    // DEBUG: Alert to confirm function is called
    if (Platform.OS === 'ios') {
      Alert.alert('Debug Function', 'processReceiptWithAPI called');
    }
    
    try {
      if (mockData) {
        // Use mock data for simulator testing
        console.log('📱 Using mock receipt data for simulator');
        
        setProcessingState({
          stage: 'analyzing',
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
          status: 'complete' as const
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
          ai_reasoning: 'Mock data validated by AI'
        }));

        setProcessingState({
          stage: 'complete',
          progress: 100,
          message: 'Mock processing complete!'
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsProcessing(false);
        return;
      }

      // Check server health first
      const isServerHealthy = await apiClient.checkServerHealth();
      
      if (!isServerHealthy) {
        console.warn('⚠️ Server health check failed');
        Alert.alert(
          'Server Unavailable',
          'The SnapTrack server is currently down for maintenance. You can continue to capture receipts offline.',
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            },
            {
              text: 'Continue Offline',
              onPress: () => {
                // Allow manual entry with offline mode
                setIsProcessing(false);
              }
            }
          ]
        );
        return;
      }

      // Stage 1: Upload image
      const uploadingInfo = getStageInfo('uploading', false); // AI detection happens after upload
      setProcessingState({
        stage: 'uploading',
        progress: 0,
        message: uploadingInfo.message
      });
      
      // Track upload start time for timeout detection
      uploadStartTime.current = Date.now();

      // DEBUG: Alert at very start of upload process
      if (Platform.OS === 'ios') {
        Alert.alert('Debug Start', 'handleUpload function started');
      }

      await new Promise(resolve => setTimeout(resolve, uploadingInfo.duration));

      // For simulator: Try real API first, but fallback to mock if it fails
      let uploadedReceipt;
      try {
        console.log('🔍 Attempting real API upload...');
        console.log('📤 Upload params:', {
          imageUri: imageUri.substring(0, 50) + '...',
          entity: expenseData.entity,
          tags: expenseData.tags,
          notes: expenseData.notes
        });
        
        // DEBUG: Show alert to confirm code is running
        if (Platform.OS === 'ios') {
          Alert.alert('Debug', 'Starting iOS upload...');
        }
        
        // Add a manual timeout wrapper
        const uploadPromise = apiClient.uploadReceipt(
          imageUri,
          expenseData.entity,
          expenseData.tags,
          expenseData.notes
        );
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Upload timed out after 30 seconds'));
          }, 30000);
        });
        
        uploadedReceipt = await Promise.race([uploadPromise, timeoutPromise]);
        console.log('✅ Real API upload successful');
        
        // DEBUG: Confirm upload completed
        if (Platform.OS === 'ios') {
          Alert.alert('Debug', 'Upload completed successfully');
        }
      } catch (uploadError: any) {
        console.error('❌ Real API upload failed');
        console.error('Error type:', uploadError.constructor.name);
        console.error('Error message:', uploadError.message);
        console.error('Error status:', uploadError.status);
        console.error('Full error:', uploadError);
        
        // Check if this is a network error or server error
        if (uploadError.message?.includes('Network request failed') || uploadError.status >= 500) {
          throw uploadError; // Re-throw to trigger error handling
        }
        
        // Only use simulator fallback for simulators
        const isSimulator = Platform.OS === 'ios' && !Platform.isPad && __DEV__;
        if (!isSimulator) {
          throw uploadError; // Re-throw for real devices
        }
        
        console.log('⚠️ Using simulator fallback');
        
        // Create a simulated successful response to test updateReceipt
        uploadedReceipt = {
          id: `sim_${Date.now()}`,
          expense: {
            id: Math.floor(Math.random() * 10000).toString(), // Random real-looking ID
            vendor: 'Test Vendor',
            amount: 25.50,
            date: new Date().toISOString().split('T')[0],
            entity: 'personal',
            image_url: imageUri,
            status: 'complete'
          },
          confidence_score: 0.85,
          ai_validated: true,
          ai_reasoning: 'Simulator fallback validated by AI',
          ai_validation: {
            validated: true,
            reasoning: 'Simulator fallback validated by AI'
          },
          receipt_url: imageUri,
          status: 'complete' as const
        };
        console.log('🔍 Created simulator fallback receipt:', uploadedReceipt);
      }

      console.log('🔍 Upload response type:', typeof uploadedReceipt);
      console.log('🔍 Upload response keys:', uploadedReceipt ? Object.keys(uploadedReceipt) : 'null');
      console.log('🔍 Full upload response:', JSON.stringify(uploadedReceipt, null, 2));
      
      if (!uploadedReceipt) {
        throw new Error('No response received from upload');
      }
      
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
      const vendor = (extractedData as any).vendor || 
                     (extractedData as any).corrected_vendor || 
                     (extractedData as any).parsed_vendor || 
                     (extractedData as any).vendor_name || 
                     (extractedData as any).business_name || 
                     (extractedData as any).merchant || '';
                     
      const amount = (extractedData as any).amount || 
                     (extractedData as any).corrected_amount || 
                     (extractedData as any).parsed_amount || 
                     (extractedData as any).total_amount || 
                     (extractedData as any).total || 
                     (extractedData as any).price || '';
                     
      const date = (extractedData as any).expense_date || 
                   (extractedData as any).date || 
                   (extractedData as any).corrected_date || 
                   (extractedData as any).parsed_date || 
                   (extractedData as any).receipt_date || 
                   (extractedData as any).transaction_date || 
                   new Date().toISOString().split('T')[0];
      const tags = normalizeTagsToString((extractedData as any).tags || (extractedData as any).parsed_tags || '');
      const confidence = (uploadedReceipt as any).confidence?.amount || (extractedData as any).confidence_score || (extractedData as any).validation_confidence || (extractedData as any).confidence || 0;
      
      // Capture AI validation information
      const aiValidated = (uploadedReceipt as any).ai_validation?.validated || (extractedData as any).ai_validated || false;
      const aiReasoning = (uploadedReceipt as any).ai_validation?.reasoning || (extractedData as any).ai_reasoning || '';
      
      // Extract notes field (including AI-generated notes)
      const notes = (extractedData as any).notes || 
                    (extractedData as any).ai_notes || 
                    (extractedData as any).generated_notes ||
                    (extractedData as any).description ||
                    '';
      
      console.log('🔍 Parsed values:', { vendor, amount, date, tags, confidence, aiValidated, aiReasoning, notes });
      console.log('🔍 Setting form values - vendor:', vendor, 'amount:', amount);
      if (notes) {
        console.log('🤖 AI-generated notes detected:', notes);
      }
      
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
        notes: notes || '',
        confidence_score: confidence,
        ai_validated: aiValidated,
        ai_reasoning: aiReasoning
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
      
      // Auto-save receipt image if enabled (after successful processing)
      try {
        if (uploadedReceipt) {
          const receipt: Receipt = {
            id: uploadedReceipt.id || uploadedReceipt.expense?.id || 'temp',
            vendor: vendor || 'Unknown Vendor',
            amount: parseFloat(amount) || 0,
            date: date || new Date().toISOString().split('T')[0],
            entity: expenseData.entity || 'personal',
            tags: normalizeTagsToArray(tags),
            notes: notes || '',
            receipt_url: uploadedReceipt.receipt_url || uploadedReceipt.expense?.image_url || imageUri,
            confidence_score: confidence || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: 'current_user',
            tenant_id: 'current_tenant'
          };
          
          await shareService.autoSaveReceiptIfEnabled(receipt);
        }
      } catch (autoSaveError) {
        console.error('❌ Auto-save failed:', autoSaveError);
        // Don't interrupt the main flow for auto-save failures
      }
      
      setIsProcessing(false);

    } catch (error: any) {
      console.error('❌ OCR processing failed');
      console.error('Error type:', error?.constructor?.name || 'Unknown');
      console.error('Error message:', error?.message || 'No message');
      console.error('Error status:', error?.status || 'No status');
      console.error('Full error:', error);
      
      // Check if this is a server error
      const isServerError = error?.status && error.status >= 500;
      const isNetworkError = error?.message?.includes('Network request failed');
      let errorMessage = 'Processing failed';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (isNetworkError) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (isServerError) {
        errorMessage = 'Server is temporarily unavailable. Please try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setProcessingState({
        stage: 'error',
        progress: 0,
        message: errorMessage
      });

      // Show alert for server errors
      if (isServerError) {
        Alert.alert(
          'Server Error',
          'The SnapTrack server is temporarily unavailable. You can still capture receipts - they will be uploaded when the server is back online.',
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            },
            {
              text: 'Continue Offline',
              onPress: () => {
                // Allow manual entry even if server is down
                setIsProcessing(false);
              }
            }
          ]
        );
      } else {
        // Fall back to manual entry after showing error for other errors
        setTimeout(() => {
          setIsProcessing(false);
        }, 2000);
      }
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
          notes: expenseData.notes
        });
        
        console.log('📱 Receipt queued for offline upload:', receiptId);
        
        Alert.alert(
          'Saved Offline',
          `Your receipt has been saved and will be uploaded automatically when you reconnect to the internet.\n\nVendor: ${expenseData.vendor}\nAmount: $${expenseData.amount}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Main' as never)
            }
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
            notes: expenseData.notes
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
            notes: expenseData.notes
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
        notes: expenseData.notes
      });
      
      const updatedReceipt = await apiClient.updateReceipt(receiptId, {
        vendor: expenseData.vendor,
        amount: parseFloat(expenseData.amount) || 0,
        expense_date: expenseData.date,
        entity: expenseData.entity,
        tags: normalizeTagsToArray(expenseData.tags),
        notes: expenseData.notes
      });

      console.log('✅ Receipt saved successfully:', updatedReceipt?.id || receiptId);
      
      Alert.alert(
        'Receipt Saved!',
        `Your expense has been successfully processed and saved.\n\nVendor: ${expenseData.vendor}\nAmount: $${expenseData.amount}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main' as never)
          }
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
    <View style={[styles.inputContainer, { position: 'relative', zIndex: 100 }]}>
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
          tagBlurTimeoutRef.current = setTimeout(() => {
            setShowTagSuggestions(false);
          }, 300);
        }}
      />
      {showTagSuggestions && tagSuggestions.length > 0 && (
        <View style={styles.tagSuggestions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tagSuggestions.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tagSuggestion}
                onPressIn={() => {
                  // Clear timeout immediately on press start
                  if (tagBlurTimeoutRef.current) {
                    clearTimeout(tagBlurTimeoutRef.current);
                    tagBlurTimeoutRef.current = null;
                  }
                }}
                onPress={() => {
                  console.log('🏷️ Tag suggestion pressed:', tag);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  selectTag(tag);
                }}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              ...(processingState.stage === 'error' ? [{ color: colors.error }] : [])
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
                ...(processingState.stage === 'uploading' || processingState.progress > 0 ? [styles.stageActive] : [])
              ]}>
                <Ionicons 
                  name="cloud-upload-outline" 
                  size={16} 
                  color={processingState.progress > 0 ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.stageText,
                  ...(processingState.progress > 0 ? [{ color: colors.primary }] : [])
                ]}>Upload</Text>
              </View>
              
              {/* Scanning Stage */}
              <View style={[
                styles.stageIndicator,
                ...(processingState.stage === 'scanning' || processingState.progress >= 35 ? [styles.stageActive] : [])
              ]}>
                <Ionicons 
                  name="scan-outline" 
                  size={16} 
                  color={processingState.progress >= 35 ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.stageText,
                  ...(processingState.progress >= 35 ? [{ color: colors.primary }] : [])
                ]}>Scan</Text>
              </View>
              
              {/* AI Analyzing Stage - Conditional */}
              {processingState.hasAI && (
                <View style={[
                  styles.stageIndicator,
                  ...(processingState.stage === 'analyzing' || processingState.progress >= 80 ? [styles.stageActive] : [])
                ]}>
                  <Ionicons 
                    name="sparkles" 
                    size={16} 
                    color={processingState.progress >= 80 ? colors.neonPurple : colors.textMuted} 
                  />
                  <Text style={[
                    styles.stageText,
                    ...(processingState.progress >= 80 ? [{ color: colors.neonPurple }] : [])
                  ]}>AI</Text>
                </View>
              )}
              
              {/* Extracting Stage */}
              <View style={[
                styles.stageIndicator,
                ...(processingState.stage === 'extracting' || processingState.progress >= 95 ? [styles.stageActive] : [])
              ]}>
                <Ionicons 
                  name="document-text-outline" 
                  size={16} 
                  color={processingState.progress >= 95 ? colors.primary : colors.textMuted} 
                />
                <Text style={[
                  styles.stageText,
                  ...(processingState.progress >= 95 ? [{ color: colors.primary }] : [])
                ]}>Extract</Text>
              </View>
              
              {/* Complete Stage */}
              <View style={[
                styles.stageIndicator,
                ...(processingState.progress >= 100 ? [styles.stageActive] : [])
              ]}>
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={16} 
                  color={processingState.progress >= 100 ? colors.success : colors.textMuted} 
                />
                <Text style={[
                  styles.stageText,
                  ...(processingState.progress >= 100 ? [{ color: colors.success }] : [])
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
                              {Math.round(expenseData.confidence_score || 0)}% confident
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
                            {Math.round(expenseData.confidence_score || 0)}% confident
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
  backButton: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  backText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: 4
  },
  bottomActions: {
    backgroundColor: colors.background,
    borderTopColor: colors.surface,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  compactImageContainer: {
    backgroundColor: colors.card,
    borderColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  confidenceContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  confidenceText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs
  },
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    flex: 1
  },
  enhancedConfidenceContainer: {
    flexDirection: 'column',
    gap: 2
  },
  enhancedRow: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  enhancedText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: spacing.xs
  },
  entityChip: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  entityChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  entityChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  entityChipTextSelected: {
    color: 'white'
  },
  entityPickerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  entityScrollContainer: {
    marginTop: spacing.xs
  },
  entityScrollContent: {
    paddingHorizontal: spacing.xs
  },
  formContainer: {
    paddingHorizontal: spacing.md
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  headerTitle: {
    ...typography.title3,
    color: colors.textPrimary
  },
  imagePreviewButton: {
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    flex: 1,
    padding: spacing.sm
  },
  imagePreviewText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2
  },
  inputContainer: {
    marginBottom: spacing.md
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs
  },
  keyboardContainer: {
    flex: 1
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.sm
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  originalConfidenceRow: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  originalConfidenceText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '500',
    marginLeft: spacing.xs
  },
  previewImage: {
    borderRadius: borderRadius.md,
    height: '50%',
    marginBottom: spacing.lg,
    maxHeight: 400,
    width: '100%'
  },
  previewTextContainer: {
    flex: 1
  },
  processingContainer: {
    flex: 1,
    padding: spacing.md
  },
  processingContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  processingSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center'
  },
  processingTitle: {
    ...typography.title2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md
  },
  progressBar: {
    backgroundColor: colors.surface,
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
    width: '80%'
  },
  progressFill: {
    height: '100%'
  },
  retakeButton: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  retakeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  retryButtonText: {
    ...typography.body,
    color: 'white',
    fontWeight: '600'
  },
  saveButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden'
  },
  saveButtonDisabled: {
    opacity: 0.7
  },
  saveButtonGradient: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  saveButtonText: {
    ...typography.body,
    color: 'white',
    fontWeight: '600',
    marginLeft: spacing.sm
  },
  scrollContent: {
    paddingBottom: 120
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  sourceTag: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  sourceText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12
  },
  stageActive: {
    // Active stage styling handled by color changes
    backgroundColor: 'transparent' // Prevent undefined backgroundColor crashes
  },
  stageIndicator: {
    alignItems: 'center',
    padding: spacing.sm
  },
  stageIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md
  },
  stageText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs
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
    alignItems: 'center'
  },
  tagSuggestionText: {
    ...typography.body,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  tagSuggestions: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    elevation: 1000,
    marginTop: spacing.md,
    maxHeight: 150,
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingVertical: spacing.sm,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000
  },
  textInput: {
    ...typography.body,
    backgroundColor: colors.card,
    borderColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  thumbnailImage: {
    borderRadius: borderRadius.sm,
    height: 50,
    marginRight: spacing.md,
    width: 50
  },
  touchContainer: {
    flex: 1
  }
});