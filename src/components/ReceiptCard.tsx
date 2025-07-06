import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Card, Button, Chip, IconButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { Receipt } from '../types';
import { useReceiptEditor } from '../hooks/useReceiptEditor';
import { theme } from '../styles/theme';

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
    setShowSuggestions,
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
        updated_at: new Date().toISOString(),
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
          <Text style={styles.vendor}>{receipt?.vendor || 'Unknown Vendor'}</Text>
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

        {/* Notes */}
        <View style={styles.notesContainer}>
          {receipt?.notes ? (
            <Text style={styles.notes}>{String(receipt.notes)}</Text>
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
          {receipt.receipt_url && (
            <IconButton
              icon="eye"
              size={18}
              onPress={handlePreview}
              style={styles.actionButton}
              iconColor={theme.colors.accent}
            />
          )}
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
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  // View Mode Styles
  viewContent: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  vendor: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.surface,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.md,
  },
  currency: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.success,
    marginRight: 2,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  metadataContainer: {
    marginBottom: theme.spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginRight: theme.spacing.xs,
  },
  entityChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  entityText: {
    fontSize: 12,
    color: theme.colors.onPrimaryContainer,
  },
  viewTag: {
    backgroundColor: theme.colors.secondaryContainer,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  viewTagText: {
    fontSize: 11,
    color: theme.colors.onSecondaryContainer,
  },
  notesContainer: {
    marginBottom: theme.spacing.sm,
  },
  notes: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  noNotes: {
    fontSize: 14,
    color: theme.colors.outline,
    fontStyle: 'italic',
  },
  dateContainer: {
    marginBottom: theme.spacing.sm,
  },
  date: {
    fontSize: 13,
    color: theme.colors.outline,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    marginLeft: theme.spacing.xs,
  },

  // Edit Mode Styles
  editingContent: {
    padding: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surface,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  picker: {
    height: 50,
    color: theme.colors.onSurface,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.secondaryContainer,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.onSecondaryContainer,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  addTagButton: {
    margin: 0,
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
    maxHeight: 160,
  },
  suggestionItem: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  suggestionText: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  maxTagsText: {
    fontSize: 12,
    color: theme.colors.outline,
    marginTop: theme.spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  cancelButton: {
    flex: 0.45,
    borderColor: theme.colors.outline,
  },
  cancelButtonLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  saveButton: {
    flex: 0.45,
    backgroundColor: theme.colors.primary,
  },
  saveButtonLabel: {
    color: theme.colors.onPrimary,
  },
});