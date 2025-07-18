import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Receipt } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { shareService } from '../services/shareService';

// Helper function to format dates consistently across the app
const formatDateConsistent = (dateString: string) => {
  try {
    // Fix timezone handling - treat date-only strings as local dates
    let date: Date;
    
    if (dateString && dateString.includes('T')) {
      // Already has time component, use as-is
      date = new Date(dateString);
    } else {
      // Date-only string - treat as local date by appending local time
      date = new Date(dateString + 'T00:00:00');
    }
    
    return date.toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

interface ReceiptPreviewModalProps {
  receipt: Receipt | null;
  isVisible: boolean;
  onClose: () => void;
  onEdit?: (receipt: Receipt) => void;
  onDelete?: (receipt: Receipt) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Smart Image Display Component
const ReceiptImageSection: React.FC<{
  imageUri: string | undefined;
  onZoom: () => void;
  receipt: Receipt;
}> = ({ imageUri, onZoom, receipt }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const screenWidth = SCREEN_WIDTH;
  const maxImageHeight = screenWidth * 1.4; // Increased for portrait receipts

  const handleLongPress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Alert.alert(
        'Receipt Image Options',
        'What would you like to do with this receipt image?',
        [
          {
            text: 'Share Image',
            onPress: async () => {
              const success = await shareService.shareReceiptImage(receipt);
              if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }
          },
          {
            text: 'Save to Photos',
            onPress: async () => {
              const success = await shareService.saveReceiptToCameraRoll(receipt);
              if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Saved', 'Receipt image saved to your photo library');
              } else {
                Alert.alert('Error', 'Failed to save receipt image');
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('❌ Long press handler error:', error);
    }
  };

  useEffect(() => {
    if (imageUri) {
      setLoading(true);
      
      Image.getSize(
        imageUri,
        (originalWidth, originalHeight) => {
          // Calculate optimal display size maintaining aspect ratio
          const aspectRatio = originalHeight / originalWidth;
          const availableWidth = screenWidth - (spacing.md * 2);
          
          // For portrait receipts (aspect ratio > 1), limit height
          // For landscape receipts (aspect ratio < 1), limit width
          let displayWidth = availableWidth;
          let displayHeight = displayWidth * aspectRatio;
          
          // If the calculated height is too tall, constrain by height instead
          if (displayHeight > maxImageHeight) {
            displayHeight = maxImageHeight;
            displayWidth = displayHeight / aspectRatio;
          }
          
          setImageSize({
            width: displayWidth,
            height: displayHeight
          });
          setLoading(false);
        },
        (error) => {
          console.error('Failed to get image size:', error);
          // Fallback to default size
          const fallbackWidth = screenWidth - (spacing.md * 2);
          setImageSize({
            width: fallbackWidth,
            height: fallbackWidth * 1.2 // Assume portrait aspect ratio
          });
          setLoading(false);
        }
      );
    }
  }, [imageUri, screenWidth, maxImageHeight]);

  if (!imageUri) {
    // Enhanced handling for text receipts
    if (receipt.extraction_method === 'text') {
      return (
        <View style={styles.textReceiptContainer}>
          <View style={styles.textReceiptCard}>
            <Ionicons name="mail-outline" size={48} color={colors.primary} />
            <Text style={styles.textReceiptTitle}>Email Receipt</Text>
            <Text style={styles.textReceiptSubtitle}>
              Processed from email content
            </Text>
            
            {/* Email Subject */}
            {receipt.email_subject && (
              <View style={styles.emailSubjectContainer}>
                <Text style={styles.emailSubjectLabel}>Email Subject:</Text>
                <Text style={styles.emailSubjectText}>{receipt.email_subject}</Text>
              </View>
            )}
            
            {/* Receipt Summary */}
            <View style={styles.receiptSummary}>
              <Text style={styles.summaryAmount}>${receipt.amount.toFixed(2)}</Text>
              <Text style={styles.summaryVendor}>{receipt.vendor}</Text>
              <Text style={styles.summaryDate}>
                {formatDateConsistent(receipt.date)}
              </Text>
            </View>
            
            <View style={styles.extractionBadge}>
              <Text style={styles.badgeText}>Text Processing</Text>
            </View>
          </View>
        </View>
      );
    }
    
    // Default no image state
    return (
      <View style={styles.noImageContainer}>
        <Ionicons name="document-outline" size={64} color={colors.textMuted} />
        <Text style={styles.noImageText}>No receipt image available</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.imageContainer}>
        <View style={[styles.loadingImageContainer, { height: maxImageHeight }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingImageText}>Loading receipt image...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.imageContainer}>
      <TouchableOpacity 
        activeOpacity={1.0}
        onLongPress={handleLongPress}
        delayLongPress={800}
      >
        <ScrollView 
          style={[styles.imageScrollView, { 
            height: imageSize.height || maxImageHeight,
            width: '100%'
          }]}
          contentContainerStyle={[styles.imageScrollContent, {
            width: imageSize.width,
            height: imageSize.height
          }]}
          minimumZoomScale={1}
          maximumZoomScale={3}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          centerContent={true}
          bouncesZoom={true}
          pinchGestureEnabled={true}
          scrollEnabled={true}
          onScroll={(event) => {
            // Track zoom level for smooth interaction
            const { zoomScale } = event.nativeEvent;
            // Could add zoom level state here if needed for UI feedback
          }}
          scrollEventThrottle={16}
        >
          <Image
            source={{ uri: imageUri }}
            style={{
              width: imageSize.width,
              height: imageSize.height
            }}
            resizeMode="stretch"
            onLoad={() => {/* Image loaded successfully */}}
            onError={(error) => console.error('Image load error:', error)}
          />
        </ScrollView>
      </TouchableOpacity>
      
      <View style={styles.zoomHint}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <Text style={styles.zoomHintText}>Pinch to zoom • Long press for options</Text>
      </View>
    </View>
  );
};

// Detail Row Component
const DetailRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  confidence?: number;
  isHighlight?: boolean;
  badgeColor?: string;
}> = ({ icon, label, value, confidence, isHighlight, badgeColor }) => {
  // Extra defensive value processing
  let safeValue = '';
  try {
    if (value === null || value === undefined) {
      safeValue = '';
    } else if (typeof value === 'string') {
      safeValue = value;
    } else if (typeof value === 'number') {
      safeValue = String(value);
    } else if (typeof value === 'boolean') {
      safeValue = String(value);
    } else if (Array.isArray(value)) {
      safeValue = (value as string[]).join(', ');
    } else {
      safeValue = String(value);
    }
  } catch (error) {
    console.error('DetailRow value conversion error:', error, value);
    safeValue = 'Invalid value';
  }

  const safeLabel = String(label || '');
  const safeIcon = String(icon || 'help-outline');
  
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={safeIcon as any} size={16} color={colors.textSecondary} />
        <Text style={styles.detailLabel}>{safeLabel}:</Text>
      </View>
      <View style={styles.detailRight}>
        <Text style={[
          styles.detailValue,
          isHighlight && styles.detailValueHighlight
        ]}>
          {safeValue}
        </Text>
        {badgeColor ? (
          <View style={[styles.entityBadge, { backgroundColor: badgeColor }]} />
        ) : null}
        {(confidence && typeof confidence === 'number' && confidence < 85) ? (
          <Ionicons name="warning-outline" size={14} color={colors.warning} />
        ) : null}
      </View>
    </View>
  );
};

// Confidence Indicator Component
const ConfidenceIndicator: React.FC<{ overall: number }> = ({ overall }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return colors.success;
    if (confidence >= 70) return colors.warning;
    return colors.error;
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 85) return 'High';
    if (confidence >= 70) return 'Medium';
    return 'Low';
  };

  // Ensure overall is a valid number
  const safeOverall = typeof overall === 'number' && !isNaN(overall) ? overall : 0;
  const confidencePercentage = Math.round(safeOverall * 100);

  return (
    <View style={styles.confidenceCard}>
      <View style={styles.confidenceHeader}>
        <Ionicons name="analytics-outline" size={20} color={getConfidenceColor(confidencePercentage)} />
        <Text style={styles.confidenceTitle}>OCR Confidence</Text>
      </View>
      
      <View style={styles.confidenceContent}>
        <Text style={[
          styles.confidencePercentage,
          { color: getConfidenceColor(confidencePercentage) }
        ]}>
          {confidencePercentage}%
        </Text>
        <Text style={[
          styles.confidenceLabel,
          { color: getConfidenceColor(confidencePercentage) }
        ]}>
          {getConfidenceLabel(confidencePercentage)}
        </Text>
      </View>
      
      {confidencePercentage < 85 ? (
        <Text style={styles.confidenceWarning}>
          Consider manually verifying the extracted details
        </Text>
      ) : null}
    </View>
  );
};

// Smart Actions Bar Component
const SmartActionsBar: React.FC<{
  receipt: Receipt;
  onEdit?: (receipt: Receipt) => void;
  onDelete?: (receipt: Receipt) => void;
  onClose: () => void;
}> = ({ receipt, onEdit, onDelete, onClose }) => {
  const handleEdit = () => {
    onEdit?.(receipt);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(receipt);
            onClose();
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const success = await shareService.shareReceiptImage(receipt);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('❌ Share error:', error);
    }
  };

  return (
    <View style={styles.actionsContainer}>
      {onEdit ? (
        <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={handleEdit}>
          <Ionicons name="pencil" size={16} color="white" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
      ) : null}
      
      <TouchableOpacity style={[styles.actionButton, styles.shareAction]} onPress={handleShare}>
        <Ionicons name="share-outline" size={16} color={colors.primary} />
        <Text style={[styles.actionButtonText, { color: colors.primary }]}>Share</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={onClose}>
        <Ionicons name="close" size={16} color={colors.textPrimary} />
        <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Close</Text>
      </TouchableOpacity>
      
      {onDelete ? (
        <TouchableOpacity style={[styles.actionButton, styles.dangerAction]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// Get entity color helper
const getEntityColor = (entityName: string) => {
  // Simple color mapping - in production this would use the same logic as the web app
  const colors_map: { [key: string]: string } = {
    'Personal': colors.primary,
    'Business': '#4CAF50',
    'Travel': '#FF9800',
    'Family': '#9C27B0'
  };
  return colors_map[entityName] || colors.primary;
};

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = (props) => {
  // Completely avoid destructuring in parameters - extract everything inside
  const receipt = props && props.receipt ? props.receipt : null;
  const isVisible = props && typeof props.isVisible === 'boolean' ? props.isVisible : false;
  const onClose = props && typeof props.onClose === 'function' ? props.onClose : () => {};
  const onEdit = props && typeof props.onEdit === 'function' ? props.onEdit : undefined;
  const onDelete = props && typeof props.onDelete === 'function' ? props.onDelete : undefined;
  
  const [imageZoomed, setImageZoomed] = useState(false);

  // Share handler function
  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const success = await shareService.shareReceiptImage(receipt);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('❌ Share button error:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  // Component is rendering properly

  // More comprehensive validation
  if (!isVisible) {
    return null;
  }

  if (!receipt || !receipt.id) {
    console.log('ReceiptPreviewModal: Invalid receipt data', {
      receipt,
      hasReceipt: !!receipt,
      receiptId: receipt?.id,
      receiptKeys: receipt ? Object.keys(receipt) : 'null'
    });
    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Error</Text>
              <Text style={styles.headerSubtitle}>No receipt data available</Text>
            </View>
            <View style={styles.headerButton} />
          </View>
          <View style={styles.content}>
            <View style={styles.noImageContainer}>
              <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
              <Text style={styles.noImageText}>Unable to load receipt</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  const handleZoom = () => {
    setImageZoomed(true);
  };

  // Wrap the entire render in a try-catch for debugging
  try {
    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Receipt</Text>
              <Text style={styles.headerSubtitle}>
              ${typeof receipt.amount === 'number' ? receipt.amount.toFixed(2) : '0.00'} • {receipt.date ? formatDateConsistent(receipt.date) : new Date().toLocaleDateString()}
              </Text>
            </View>

            {/* Replace empty spacer with share button */}
            <TouchableOpacity 
              onPress={handleShare}
              style={styles.headerButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Share receipt"
              accessibilityHint="Share this receipt image via other apps"
            >
              <Ionicons name="share-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Smart Image Display */}
            <ReceiptImageSection 
              imageUri={receipt.receipt_url} 
              onZoom={handleZoom}
              receipt={receipt}
            />

            {/* Enhanced Details Section */}
            <View style={styles.detailsContainer}>
              {/* Primary Details Card */}
              <View style={styles.detailCard}>
                <Text style={styles.sectionTitle}>Extracted Details</Text>
              
                <DetailRow 
                  icon="storefront-outline"
                  label="Vendor"
                  value={String(receipt.vendor || 'Unknown')}
                  confidence={receipt.confidence_score ? receipt.confidence_score * 100 : undefined}
                />
                <DetailRow 
                  icon="cash-outline"
                  label="Amount"
                  value={`$${typeof receipt.amount === 'number' ? receipt.amount.toFixed(2) : '0.00'}`}
                  confidence={receipt.confidence_score ? receipt.confidence_score * 100 : undefined}
                  isHighlight
                />
                <DetailRow 
                  icon="calendar-outline"
                  label="Date"
                  value={receipt.date ? formatDateConsistent(receipt.date) : new Date().toLocaleDateString()}
                  confidence={receipt.confidence_score ? receipt.confidence_score * 100 : undefined}
                />
                {(receipt.entity && String(receipt.entity).trim()) ? (
                  <DetailRow 
                    icon="business-outline"
                    label="Entity"
                    value={String(receipt.entity)}
                    badgeColor={getEntityColor(String(receipt.entity))}
                  />
                ) : null}
                {(receipt.tags && Array.isArray(receipt.tags) && receipt.tags.length > 0) ? (
                  <DetailRow 
                    icon="pricetag-outline"
                    label="Tags"
                    value={receipt.tags.filter(tag => tag && tag.trim()).join(', ') || 'No tags'}
                  />
                ) : null}
                {(receipt.notes && String(receipt.notes).trim()) ? (
                  <DetailRow 
                    icon="document-text-outline"
                    label="Notes"
                    value={String(receipt.notes)}
                  />
                ) : null}
              </View>

              {/* Original Email Content for Text Receipts */}
              {(receipt.extraction_method === 'text' && receipt.raw_text) && (
                <View style={styles.detailCard}>
                  <Text style={styles.sectionTitle}>Original Email Content</Text>
                  <ScrollView style={styles.rawTextContainer} showsVerticalScrollIndicator={true}>
                    <Text style={styles.rawTextContent}>{receipt.raw_text}</Text>
                  </ScrollView>
                </View>
              )}

              {/* Confidence Indicator */}
              {(receipt.confidence_score && typeof receipt.confidence_score === 'number' && receipt.confidence_score > 0) ? (
                <ConfidenceIndicator overall={receipt.confidence_score} />
              ) : null}
            </View>
          </ScrollView>

          {/* Smart Actions Bar */}
          <SmartActionsBar 
            receipt={receipt}
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={onClose}
          />
        </SafeAreaView>
      </Modal>
    );
  } catch (error) {
    console.error('ReceiptPreviewModal render error:', error);
    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Error</Text>
              <Text style={styles.headerSubtitle}>Failed to load receipt preview</Text>
            </View>
            <View style={styles.headerButton} />
          </View>
          <View style={styles.content}>
            <View style={styles.noImageContainer}>
              <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
              <Text style={styles.noImageText}>Render error occurred</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  
  // Header
  header: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  headerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    padding: spacing.md
  },
  headerContent: {
    alignItems: 'center',
    flex: 1
  },
  headerTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    textAlign: 'center'
  },
  headerSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  
  // Content
  content: {
    flex: 1
  },
  
  // Image Section
  imageContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
    overflow: 'hidden',
    ...shadows.card
  },
  imageScrollView: {
    backgroundColor: colors.surface
  },
  imageScrollContent: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageTouch: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  receiptImage: {
    alignSelf: 'center'
  },
  loadingImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  loadingImageText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center'
  },
  zoomHint: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: spacing.sm
  },
  zoomHintText: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs
  },
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    padding: spacing.xl
  },
  noImageText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center'
  },
  
  // Text Receipt Styles
  textReceiptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    padding: spacing.xl
  },
  textReceiptCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    ...shadows.card
  },
  textReceiptTitle: {
    ...typography.title2,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center'
  },
  textReceiptSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  emailSubjectContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    width: '100%'
  },
  emailSubjectLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs
  },
  emailSubjectText: {
    ...typography.body2,
    color: colors.textPrimary,
    lineHeight: 20
  },
  receiptSummary: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    width: '100%'
  },
  summaryAmount: {
    ...typography.title1,
    color: colors.success,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  summaryVendor: {
    ...typography.title3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  summaryDate: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  extractionBadge: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  badgeText: {
    ...typography.caption,
    color: colors.onPrimaryContainer,
    fontWeight: '600'
  },
  
  // Details Section
  detailsContainer: {
    padding: spacing.md
  },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.card
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md
  },
  rawTextContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    maxHeight: 120,
    padding: spacing.sm
  },
  rawTextContent: {
    ...typography.body2,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16
  },
  
  // Detail Rows
  detailRow: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm
  },
  detailLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1
  },
  detailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.sm
  },
  detailRight: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary
  },
  detailValueHighlight: {
    ...typography.title3,
    color: colors.primary,
    fontWeight: '600'
  },
  entityBadge: {
    borderRadius: 4,
    height: 8,
    marginLeft: spacing.sm,
    width: 8
  },
  
  // Confidence Indicator
  confidenceCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.card
  },
  confidenceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.sm
  },
  confidenceTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginLeft: spacing.sm
  },
  confidenceContent: {
    alignItems: 'baseline',
    flexDirection: 'row',
    marginBottom: spacing.sm
  },
  confidencePercentage: {
    ...typography.title1,
    fontWeight: '700',
    marginRight: spacing.sm
  },
  confidenceLabel: {
    ...typography.body,
    fontWeight: '500'
  },
  confidenceWarning: {
    ...typography.body2,
    color: colors.warning,
    fontStyle: 'italic'
  },
  
  // Actions
  actionsContainer: {
    backgroundColor: colors.background,
    borderTopColor: colors.surface,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md
  },
  primaryAction: {
    backgroundColor: colors.primary
  },
  shareAction: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1
  },
  secondaryAction: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
    borderWidth: 1
  },
  dangerAction: {
    backgroundColor: colors.surface,
    borderColor: colors.error,
    borderWidth: 1
  },
  actionButtonText: {
    ...typography.body,
    color: 'white',
    fontWeight: '600',
    marginLeft: spacing.xs
  }
});