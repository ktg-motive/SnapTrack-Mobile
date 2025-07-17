import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Receipt, Entity } from '../types';
import { apiClient } from '../services/apiClient';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

interface ReceiptEditModalProps {
  receipt: Receipt | null;
  isVisible: boolean;
  onClose: () => void;
  onSave: (receiptId: string, updates: Partial<Receipt>) => Promise<void>;
  onDelete?: (receiptId: string) => Promise<void>;
}

export const ReceiptEditModal: React.FC<ReceiptEditModalProps> = ({
  receipt,
  isVisible,
  onClose,
  onSave,
  onDelete
}) => {
  // Form state - replicating web ExpenseEditDialog
  const [formData, setFormData] = useState<Partial<Receipt>>({});
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);

  // Initialize form data when receipt changes
  useEffect(() => {
    if (receipt) {
      setFormData({
        vendor: receipt.vendor || '',
        amount: receipt.amount,
        date: receipt.date,
        notes: receipt.notes || ''
      });
      setSelectedEntity(receipt.entity || '');
      setTags(receipt.tags || []);
    }
  }, [receipt]);

  // Load entities when modal opens
  useEffect(() => {
    if (isVisible) {
      loadEntities();
    }
  }, [isVisible]);

  const loadEntities = async () => {
    setLoadingEntities(true);
    try {
      const userEntities = await apiClient.getEntities();
      setEntities(userEntities || []);
    } catch (error) {
      console.error('Failed to load entities:', error);
      setEntities([]);
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleInputChange = (field: keyof Receipt, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const searchTags = async (query: string) => {
    if (query.trim().length === 0) {
      try {
        const response = await apiClient.searchTags('', 5);
        setTagSuggestions(response || []);
      } catch (error) {
        console.error('Failed to fetch popular tags:', error);
        setTagSuggestions([]);
      }
    } else if (query.trim().length >= 1) {
      try {
        const response = await apiClient.searchTags(query.trim(), 8);
        const filteredSuggestions = (response || []).filter(
          (tag: string) => !tags.includes(tag)
        );
        setTagSuggestions(filteredSuggestions);
      } catch (error) {
        console.error('Failed to search tags:', error);
        setTagSuggestions([]);
      }
    } else {
      setTagSuggestions([]);
    }
  };

  const handleTagInputChange = async (value: string) => {
    setTagInput(value);
    if (value.trim().length >= 0 && tags.length < 5) {
      setShowSuggestions(true);
      await searchTags(value);
    } else {
      setShowSuggestions(false);
      setTagSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (!tags.includes(suggestion) && tags.length < 5) {
      setTags([...tags, suggestion]);
      setTagInput('');
      setShowSuggestions(false);
      setTagSuggestions([]);
    }
  };

  const handleSave = async () => {
    if (!receipt) return;

    setIsLoading(true);
    try {
      const updates: Partial<Receipt> = {
        ...formData,
        entity: selectedEntity,
        tags: tags,
        updated_at: new Date().toISOString()
      };

      await onSave(receipt.id, updates);
      onClose();
    } catch (error) {
      console.error('Failed to save receipt:', error);
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!receipt || !onDelete) return;

    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await onDelete(receipt.id);
              onClose();
            } catch (error) {
              console.error('Failed to delete receipt:', error);
              Alert.alert('Error', 'Failed to delete receipt. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!receipt) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
            <Text style={styles.title}>Edit Receipt</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Basic Info */}
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vendor</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.vendor || ''}
                  onChangeText={(text) => handleInputChange('vendor', text)}
                  placeholder="Vendor name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Amount</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.amount?.toString() || ''}
                    onChangeText={(text) => handleInputChange('amount', parseFloat(text) || 0)}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.date || ''}
                    onChangeText={(text) => handleInputChange('date', text)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Entity Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Entity</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowEntityDropdown(!showEntityDropdown)}
              >
                <Text style={[styles.dropdownText, !selectedEntity && styles.placeholderText]}>
                  {selectedEntity || 'Select entity...'}
                </Text>
                <Ionicons 
                  name={showEntityDropdown ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {showEntityDropdown && (
                <View style={styles.dropdownList}>
                  {loadingEntities ? (
                    <TouchableOpacity style={styles.dropdownItem} disabled>
                      <Text style={styles.dropdownItemTextDisabled}>Loading entities...</Text>
                    </TouchableOpacity>
                  ) : entities.length === 0 ? (
                    <TouchableOpacity style={styles.dropdownItem} disabled>
                      <Text style={styles.dropdownItemTextDisabled}>No entities found</Text>
                    </TouchableOpacity>
                  ) : (
                    entities.map((entity) => (
                      <TouchableOpacity
                        key={entity.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedEntity(entity.name);
                          setShowEntityDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {entity.name}
                          {entity.description && (
                            <Text style={styles.dropdownItemDescription}> - {entity.description}</Text>
                          )}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <Text style={styles.label}>Tags (max 5)</Text>
              
              {/* Current tags */}
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                        <Ionicons name="close" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Tag input */}
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.tagInput]}
                  value={tagInput}
                  onChangeText={handleTagInputChange}
                  onFocus={() => {
                    if (tags.length < 5) {
                      setShowSuggestions(true);
                      searchTags(tagInput);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Type to search tags or add new..."
                  placeholderTextColor={colors.textMuted}
                  editable={tags.length < 5}
                />
                <TouchableOpacity
                  style={[
                    styles.addTagButton,
                    (!tagInput.trim() || tags.includes(tagInput.trim()) || tags.length >= 5) && styles.addTagButtonDisabled
                  ]}
                  onPress={handleAddTag}
                  disabled={!tagInput.trim() || tags.includes(tagInput.trim()) || tags.length >= 5}
                >
                  <Text style={styles.addTagButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Tag suggestions */}
              {showSuggestions && tagSuggestions.length > 0 && tags.length < 5 && (
                <View style={styles.suggestionsContainer}>
                  {tagSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={styles.suggestion}
                      onPress={() => handleSelectSuggestion(suggestion)}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {tags.length >= 5 && (
                <Text style={styles.helperText}>Maximum 5 tags reached</Text>
              )}
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={formData.notes || ''}
                onChangeText={(text) => handleInputChange('notes', text)}
                placeholder="Brief description..."
                placeholderTextColor={colors.textMuted}
                multiline={true}
                numberOfLines={3}
              />
            </View>

            {/* Footer with extra padding for keyboard */}
            <View style={styles.footer}>
              {onDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={isLoading}
                >
                  <Ionicons name="trash-outline" size={18} color="white" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Ionicons name="save-outline" size={18} color="white" />
                  <Text style={styles.saveButtonText}>
                    {isLoading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row'
  },
  addTagButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  addTagButtonDisabled: {
    backgroundColor: colors.textMuted
  },
  addTagButtonText: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600'
  },
  cancelButton: {
    borderColor: colors.textMuted + '50',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  cancelButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  closeButton: {
    padding: spacing.xs
  },
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  deleteButtonText: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600',
    marginLeft: spacing.xs
  },
  dropdownButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.textMuted + '30',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  dropdownItem: {
    borderBottomColor: colors.textMuted + '20',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  dropdownItemDescription: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize
  },
  dropdownItemText: {
    ...typography.body,
    color: colors.textPrimary
  },
  dropdownItemTextDisabled: {
    ...typography.body,
    color: colors.textMuted
  },
  dropdownList: {
    backgroundColor: colors.card,
    borderColor: colors.textMuted + '30',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginTop: spacing.xs,
    maxHeight: 200,
    ...shadows.card
  },
  dropdownText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1
  },
  footer: {
    alignItems: 'center',
    borderTopColor: colors.textMuted + '20',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingVertical: spacing.md
  },
  halfWidth: {
    width: '48%'
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.textMuted + '20',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  headerTitle: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  helperText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  inputGroup: {
    marginBottom: spacing.sm
  },
  keyboardView: {
    flex: 1
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  placeholderText: {
    color: colors.textMuted
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  saveButtonText: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600',
    marginLeft: spacing.xs
  },
  scrollContent: {
    paddingBottom: spacing.xl
  },
  section: {
    marginVertical: spacing.md
  },
  suggestion: {
    borderBottomColor: colors.textMuted + '20',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  suggestionText: {
    ...typography.body,
    color: colors.textPrimary
  },
  suggestionsContainer: {
    backgroundColor: colors.card,
    borderColor: colors.textMuted + '30',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginTop: spacing.xs,
    maxHeight: 160,
    ...shadows.card
  },
  tag: {
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    marginBottom: spacing.xs,
    marginRight: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  tagInput: {
    flex: 1,
    marginRight: spacing.sm
  },
  tagInputContainer: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
    marginRight: spacing.xs
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm
  },
  textInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderColor: colors.textMuted + '30',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  title: {
    ...typography.title3,
    color: colors.textPrimary,
    marginLeft: spacing.sm
  }
});