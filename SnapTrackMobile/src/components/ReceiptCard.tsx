import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { Card, Button, Chip, IconButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { Receipt } from '../types';
import { useReceiptEditor } from '../hooks/useReceiptEditor';
import { theme } from '../styles/theme';
import { shareService } from '../services/shareService';

interface ReceiptCardProps {
  receipt: Receipt;
  onUpdate?: (updatedReceipt: Receipt) => void;
  onDelete?: (receiptId: string) => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ 
  receipt, 
  onUpdate, 
  onDelete 
}) => {
  // Guard clause to ensure we have valid receipt data
  if (!receipt || typeof receipt !== 'object') {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>Loading receipt...</Text>
        </Card.Content>
      </Card>
    );
  }
  const {
    isEditing,
    editData,
    entities,
    tagInput,
    tagSuggestions,
    showSuggestions,
    isSaving,
    handleEdit,
    handleSave,
    handleCancel,
    handleDelete,
    handlePreview,
    handleAddTag,
    handleRemoveTag,
    handleTagInputChange,
    handleSelectSuggestion,
    updateEditData,
    setTagInput,
    setShowSuggestions
  } = useReceiptEditor(receipt);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return theme.colors.success;
    if (confidence >= 0.70) return theme.colors.warning;
    return theme.colors.error;
  };

  const handleSavePress = async () => {
    const success = await handleSave();
    if (success && onUpdate) {
      // Create updated receipt object
      const updatedReceipt: Receipt = {
        ...receipt,
        vendor: editData.vendor,
        amount: editData.amount,
        notes: editData.notes,
        entity: editData.entity,
        tags: editData.tags,
        updated_at: new Date().toISOString()
      };
      onUpdate(updatedReceipt);
    }
  };

  const handleDeletePress = async () => {
    const success = await handleDelete();
    if (success && onDelete) {
      onDelete(receipt.id);
    }
  };

  const handleSharePress = async () => {
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

  if (isEditing) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.editingContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Vendor Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vendor</Text>
              <TextInput
                style={styles.textInput}
                value={editData.vendor}
                onChangeText={(text) => updateEditData({ vendor: text })}
                placeholder="Vendor name"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.textInput}
                value={editData.amount?.toString()}
                onChangeText={(text) => updateEditData({ amount: parseFloat(text) || 0 })}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>

            {/* Notes Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={editData.notes}
                onChangeText={(text) => updateEditData({ notes: text })}
                placeholder="Brief description..."
                multiline={true}
                numberOfLines={3}
                placeholderTextColor={theme.colors.placeholder}
              />
            </View>

            {/* Entity Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Entity</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editData.entity}
                  onValueChange={(value) => updateEditData({ entity: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select entity..." value="" />
                  {entities.map((entity) => (
                    <Picker.Item 
                      key={entity.id} 
                      label={entity.name} 
                      value={entity.name} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Tags Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags</Text>
              
              {/* Existing Tags */}
              {editData.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {editData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      onClose={() => handleRemoveTag(tag)}
                      style={styles.tag}
                      textStyle={styles.tagText}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}

              {/* Add Tag Input */}
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.tagInput]}
                  value={tagInput}
                  onChangeText={handleTagInputChange}
                  onFocus={() => {
                    if (editData.tags.length < 5) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Type to search tags..."
                  placeholderTextColor={theme.colors.placeholder}
                  editable={editData.tags.length < 5}
                />
                <IconButton
                  icon="plus"
                  size={20}
                  onPress={handleAddTag}
                  disabled={!tagInput.trim() || editData.tags.includes(tagInput.trim()) || editData.tags.length >= 5}
                  style={styles.addTagButton}
                />
              </View>

              {/* Tag Suggestions */}
              {showSuggestions && tagSuggestions.length > 0 && editData.tags.length < 5 && (
                <View style={styles.suggestionsContainer}>
                  {tagSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(suggestion)}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {editData.tags.length >= 5 && (
                <Text style={styles.maxTagsText}>Maximum 5 tags reached</Text>
              )}
            </View>
          </ScrollView>

          {/* Edit Actions */}
          <View style={styles.editActions}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              disabled={isSaving}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonLabel}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSavePress}
              disabled={isSaving}
              loading={isSaving}
              style={styles.saveButton}
              labelStyle={styles.saveButtonLabel}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  }

  // View Mode
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.viewContent}>
        {/* Header with vendor and confidence */}
        <View style={styles.header}>
          <View style={styles.vendorContainer}>
            <Text style={styles.vendor}>{receipt?.vendor || 'Unknown Vendor'}</Text>
            {receipt.extraction_method === 'text' && (
              <View style={styles.textReceiptBadge}>
                <Text style={styles.textReceiptBadgeText}>Email</Text>
              </View>
            )}
          </View>
          {receipt.confidence_score && (
            <View style={[
              styles.confidenceBadge,
              { backgroundColor: getConfidenceColor(receipt.confidence_score) }
            ]}>
              <Text style={styles.confidenceText}>
                {Math.round((receipt?.confidence_score || 0) * 100)}%
              </Text>
            </View>
          )}
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.amount}>{receipt?.amount?.toFixed(2) || '0.00'}</Text>
        </View>

        {/* Entity and Tags */}
        <View style={styles.metadataContainer}>
          {receipt?.entity && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Entity:</Text>
              <Chip style={styles.entityChip} textStyle={styles.entityText}>
                {receipt.entity}
              </Chip>
            </View>
          )}

          {receipt?.tags && receipt.tags.length > 0 && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Tags:</Text>
              <View style={styles.tagsContainer}>
                {receipt.tags.map((tag, index) => (
                  <Chip
                    key={`${tag}-${index}`}
                    style={styles.viewTag}
                    textStyle={styles.viewTagText}
                  >
                    {String(tag || '')}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Notes and Email Subject */}
        <View style={styles.notesContainer}>
          {receipt?.notes ? (
            <Text style={styles.notes}>{String(receipt.notes)}</Text>
          ) : receipt.extraction_method === 'text' && receipt.email_subject ? (
            <Text style={styles.emailSubject}>📧 {receipt.email_subject}</Text>
          ) : (
            <Text style={styles.noNotes}>No description</Text>
          )}
        </View>

        {/* Date */}
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(receipt?.date || '')}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            size={18}
            onPress={handleEdit}
            style={styles.actionButton}
            iconColor={theme.colors.primary}
          />
          <IconButton
            icon={receipt.extraction_method === 'text' ? 'file-document-outline' : 'eye'}
            size={18}
            onPress={handlePreview}
            style={styles.actionButton}
            iconColor={theme.colors.accent}
          />
          <IconButton
            icon="share-outline"
            size={18}
            onPress={handleSharePress}
            style={styles.actionButton}
            iconColor={theme.colors.secondary}
          />
          <IconButton
            icon="delete"
            size={18}
            onPress={handleDeletePress}
            style={styles.actionButton}
            iconColor={theme.colors.error}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    marginHorizontal: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  
  // View Mode Styles
  viewContent: {
    padding: theme.spacing.md
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm
  },
  vendorContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  vendor: {
    color: theme.colors.onSurface,
    fontSize: 18,
    fontWeight: '600',
    marginRight: theme.spacing.sm
  },
  textReceiptBadge: {
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2
  },
  textReceiptBadgeText: {
    color: theme.colors.onSecondaryContainer,
    fontSize: 11,
    fontWeight: '600'
  },
  confidenceBadge: {
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs
  },
  confidenceText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: '500'
  },
  amountContainer: {
    alignItems: 'baseline',
    flexDirection: 'row',
    marginBottom: theme.spacing.md
  },
  currency: {
    color: theme.colors.success,
    fontSize: 16,
    fontWeight: '500',
    marginRight: 2
  },
  amount: {
    color: theme.colors.success,
    fontSize: 24,
    fontWeight: 'bold'
  },
  metadataContainer: {
    marginBottom: theme.spacing.sm
  },
  metadataRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.xs
  },
  metadataLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '500',
    marginRight: theme.spacing.xs
  },
  entityChip: {
    backgroundColor: theme.colors.primaryContainer
  },
  entityText: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 12
  },
  viewTag: {
    backgroundColor: theme.colors.secondaryContainer,
    marginBottom: theme.spacing.xs,
    marginRight: theme.spacing.xs
  },
  viewTagText: {
    color: theme.colors.onSecondaryContainer,
    fontSize: 11
  },
  notesContainer: {
    marginBottom: theme.spacing.sm
  },
  notes: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20
  },
  emailSubject: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20
  },
  noNotes: {
    color: theme.colors.outline,
    fontSize: 14,
    fontStyle: 'italic'
  },
  dateContainer: {
    marginBottom: theme.spacing.sm
  },
  date: {
    color: theme.colors.outline,
    fontSize: 13
  },
  actions: {
    borderTopColor: theme.colors.outlineVariant,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm
  },
  actionButton: {
    marginLeft: theme.spacing.xs
  },

  // Edit Mode Styles
  editingContent: {
    padding: theme.spacing.md
  },
  inputGroup: {
    marginBottom: theme.spacing.md
  },
  label: {
    color: theme.colors.onSurface,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: theme.spacing.xs
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    color: theme.colors.onSurface,
    fontSize: 16,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1
  },
  picker: {
    color: theme.colors.onSurface,
    height: 50
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm
  },
  tag: {
    backgroundColor: theme.colors.secondaryContainer,
    marginBottom: theme.spacing.xs,
    marginRight: theme.spacing.xs
  },
  tagText: {
    color: theme.colors.onSecondaryContainer,
    fontSize: 12
  },
  tagInputContainer: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  tagInput: {
    flex: 1,
    marginRight: theme.spacing.xs
  },
  addTagButton: {
    margin: 0
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    marginTop: theme.spacing.xs,
    maxHeight: 160
  },
  suggestionItem: {
    borderBottomColor: theme.colors.outlineVariant,
    borderBottomWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm
  },
  suggestionText: {
    color: theme.colors.onSurface,
    fontSize: 14
  },
  maxTagsText: {
    color: theme.colors.outline,
    fontSize: 12,
    marginTop: theme.spacing.xs
  },
  editActions: {
    borderTopColor: theme.colors.outlineVariant,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md
  },
  cancelButton: {
    borderColor: theme.colors.outline,
    flex: 0.45
  },
  cancelButtonLabel: {
    color: theme.colors.onSurfaceVariant
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    flex: 0.45
  },
  saveButtonLabel: {
    color: theme.colors.onPrimary
  }
});