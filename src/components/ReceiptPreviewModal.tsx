import React from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Receipt } from '../types';
import { theme } from '../styles/theme';

interface ReceiptPreviewModalProps {
  receipt: Receipt | null;
  isVisible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  receipt,
  isVisible,
  onClose,
}) => {
  if (!receipt) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return theme.colors.success;
    if (confidence >= 0.70) return theme.colors.warning;
    return theme.colors.error;
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.85) return 'High Confidence';
    if (confidence >= 0.70) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.headerButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Receipt</Text>
            <Text style={styles.headerSubtitle}>
              ${receipt.amount.toFixed(2)} • {new Date(receipt.date).toLocaleDateString()}
            </Text>
          </View>

          {/* Removed download functionality to fix build issues */}
          <View style={styles.headerButton} />
        </View>

        {/* Receipt Image */}
        <View style={styles.imageContainer}>
          {receipt.receipt_url ? (
            <Image 
              source={{ uri: receipt.receipt_url }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="document-outline" size={64} color={theme.colors.outline} />
              <Text style={styles.noImageText}>No receipt image available</Text>
            </View>
          )}
        </View>

        {/* Receipt Details Footer */}
        <View style={styles.footer}>
          {/* OCR Confidence Indicator - Hidden to avoid scaring users with low confidence scores */}

          {/* Receipt Metadata */}
          <View style={styles.metadataContainer}>
            {receipt.vendor && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Vendor:</Text>
                <Text style={styles.metadataValue}>{receipt.vendor}</Text>
              </View>
            )}

            {receipt.entity && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Entity:</Text>
                <Text style={styles.metadataValue}>{receipt.entity}</Text>
              </View>
            )}

            {receipt.tags && receipt.tags.length > 0 && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Tags:</Text>
                <Text style={styles.metadataValue}>{receipt.tags.join(', ')}</Text>
              </View>
            )}

            {receipt.notes && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Notes:</Text>
                <Text style={styles.metadataValue}>{receipt.notes}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={onClose} style={styles.fullWidthCloseButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    padding: theme.spacing.md,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 2,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    overflow: 'hidden', // Ensures image respects the rounded corners
  },
  receiptImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  noImageText: {
    fontSize: 16,
    color: theme.colors.outline,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  confidenceContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  confidenceIndicator: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  confidencePercentage: {
    fontSize: 12,
    color: 'white',
    marginTop: 2,
  },
  metadataContainer: {
    marginBottom: theme.spacing.lg,
  },
  metadataItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    width: 80,
    flexShrink: 0,
  },
  metadataValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: theme.spacing.xs,
  },
  closeButton: {
    flex: 0.4,
    backgroundColor: theme.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  fullWidthCloseButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
});