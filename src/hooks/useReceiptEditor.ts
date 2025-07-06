import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '../services/apiClient';
import { Receipt, Entity } from '../types';

// Unified editing interface adapted from web ExpenseCard logic
interface EditableReceipt {
  vendor: string;
  amount: number;
  notes: string;
  entity: string;
  tags: string[];
}

// Hook that encapsulates all ExpenseCard editing logic for mobile Receipt types
export const useReceiptEditor = (receipt: Receipt) => {
  // Core editing state - matches web ExpenseCard pattern
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditableReceipt>({
    vendor: receipt.vendor || '',
    amount: receipt.amount,
    notes: receipt.notes || '',
    entity: receipt.entity || '',
    tags: receipt.tags || []
  });

  // Entity and tag management - extracted from web logic
  const [entities, setEntities] = useState<Entity[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load entities when editing starts - exact web pattern
  useEffect(() => {
    if (isEditing) {
      loadEntities();
    }
  }, [isEditing]);

  // Entity loading logic - adapted from web ExpenseCard
  const loadEntities = async () => {
    try {
      const userEntities = await apiClient.getEntities();
      setEntities(userEntities || []);
    } catch (error) {
      console.error('Failed to load entities:', error);
      setEntities([]);
    }
  };

  // Save handler - adapted from web with mobile Receipt API
  const handleSave = async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      // Convert editData back to Receipt update format
      const updateData = {
        vendor: editData.vendor,
        amount: editData.amount,
        notes: editData.notes,
        entity: editData.entity,
        tags: editData.tags
      };

      const response = await apiClient.updateReceipt(receipt.id, updateData);
      if (response) {
        setIsEditing(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update receipt:', error);
      Alert.alert('Error', 'Failed to update receipt. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel handler - exact web pattern
  const handleCancel = () => {
    setEditData({
      vendor: receipt.vendor || '',
      amount: receipt.amount,
      notes: receipt.notes || '',
      entity: receipt.entity || '',
      tags: receipt.tags || []
    });
    setTagInput('');
    setShowSuggestions(false);
    setIsEditing(false);
  };

  // Edit mode starter
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Delete handler - adapted from web with mobile confirmation
  const handleDelete = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Delete Receipt',
        'Are you sure you want to delete this receipt?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: async () => {
              try {
                await apiClient.deleteReceipt(receipt.id);
                resolve(true);
              } catch (error) {
                console.error('Failed to delete receipt:', error);
                Alert.alert('Error', 'Failed to delete receipt. Please try again.');
                resolve(false);
              }
            }
          }
        ]
      );
    });
  };

  // Tag management - exact web logic adapted for mobile
  const handleAddTag = () => {
    if (tagInput.trim() && !editData.tags.includes(tagInput.trim()) && editData.tags.length < 5) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Tag search - using mobile apiClient's dedicated searchTags method
  const searchTags = async (query: string) => {
    try {
      if (query.trim().length === 0) {
        // Get popular tags when no query
        const tags = await apiClient.searchTags('', 5);
        setTagSuggestions(tags || []);
      } else if (query.trim().length >= 1) {
        // Search for matching tags
        const tags = await apiClient.searchTags(query.trim(), 8);
        // Filter out already selected tags
        const filteredSuggestions = tags.filter(
          (tag: string) => !editData.tags.includes(tag)
        );
        setTagSuggestions(filteredSuggestions);
      } else {
        setTagSuggestions([]);
      }
    } catch (error) {
      console.error('Failed to search tags:', error);
      setTagSuggestions([]);
    }
  };

  // Tag input handling - adapted from web pattern
  const handleTagInputChange = async (value: string) => {
    setTagInput(value);
    if (value.trim().length >= 0 && editData.tags.length < 5) {
      setShowSuggestions(true);
      await searchTags(value);
    } else {
      setShowSuggestions(false);
      setTagSuggestions([]);
    }
  };

  // Tag suggestion selection - exact web pattern
  const handleSelectSuggestion = (suggestion: string) => {
    if (!editData.tags.includes(suggestion) && editData.tags.length < 5) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, suggestion]
      }));
      setTagInput('');
      setShowSuggestions(false);
      setTagSuggestions([]);
    }
  };

  // Preview handler for mobile receipt viewing
  const handlePreview = () => {
    // This will be implemented when we add the receipt preview modal
    console.log('Preview receipt:', receipt.receipt_url);
  };

  // Data setters for form management
  const updateEditData = (updates: Partial<EditableReceipt>) => {
    setEditData(prev => ({ ...prev, ...updates }));
  };

  return {
    // State
    isEditing,
    editData,
    entities,
    tagInput,
    tagSuggestions,
    showSuggestions,
    isSaving,

    // Actions
    handleEdit,
    handleSave,
    handleCancel,
    handleDelete,
    handlePreview,
    handleAddTag,
    handleRemoveTag,
    handleTagInputChange,
    handleSelectSuggestion,
    searchTags,
    updateEditData,

    // Setters
    setIsEditing,
    setTagInput,
    setShowSuggestions
  };
};