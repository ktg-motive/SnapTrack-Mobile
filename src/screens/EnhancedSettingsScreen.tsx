import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing } from '../styles/theme';
import { apiClient } from '../services/apiClient';
import { authService } from '../services/authService';

interface Entity {
  id: string;
  name: string;
  color?: string;
  isDefault?: boolean;
}

interface Tag {
  name: string;
  usageCount?: number;
}

interface UserSettings {
  defaultEntityId?: number;
}

interface EnhancedSettingsScreenProps {
  onRestartOnboarding?: () => void;
}

export default function EnhancedSettingsScreen({ onRestartOnboarding }: EnhancedSettingsScreenProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({});
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [entityName, setEntityName] = useState('');
  
  const user = authService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entitiesResponse, tagsResponse] = await Promise.allSettled([
        apiClient.getEntities(),
        apiClient.getTags(),
      ]);

      if (entitiesResponse.status === 'fulfilled') {
        setEntities(entitiesResponse.value || []);
      }

      if (tagsResponse.status === 'fulfilled') {
        setTags(tagsResponse.value.data || []);
      }
    } catch (error) {
      console.error('Failed to load settings data:', error);
      Alert.alert('Error', 'Failed to load settings data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntity = () => {
    setEditingEntity(null);
    setEntityName('');
    setShowEntityModal(true);
  };

  const handleEditEntity = (entity: Entity) => {
    Alert.alert(
      'Edit Entity',
      'Entity editing is not supported. You can delete this entity and create a new one with the desired name.',
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Delete Entity', 
          style: 'destructive',
          onPress: () => handleDeleteEntity(entity)
        }
      ]
    );
  };

  const handleSaveEntity = async () => {
    if (!entityName.trim()) {
      Alert.alert('Error', 'Entity name is required');
      return;
    }

    try {
      if (editingEntity) {
        // Entity updates not supported - this shouldn't happen now
        Alert.alert('Error', 'Entity editing is not supported by the backend.');
        return;
      } else {
        // Create new entity
        const newEntity = await apiClient.createEntity({
          name: entityName.trim(),
        });
        setEntities(prev => [...prev, newEntity]);
      }
      setShowEntityModal(false);
      setEntityName('');
      setEditingEntity(null);
    } catch (error) {
      console.error('Failed to save entity:', error);
      Alert.alert('Error', 'Failed to save entity. Please try again.');
    }
  };

  const handleDeleteEntity = (entity: Entity) => {
    Alert.alert(
      'Delete Entity',
      `Are you sure you want to delete "${entity.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteEntity(entity.id);
              setEntities(prev => prev.filter(e => e.id !== entity.id));
            } catch (error) {
              console.error('Failed to delete entity:', error);
              Alert.alert('Error', 'Failed to delete entity. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleTagInfo = () => {
    Alert.alert(
      'Tag Management',
      'Tags are automatically created when you use them in your expenses. You can see all your existing tags here, but they cannot be directly edited or deleted.',
      [{ text: 'OK' }]
    );
  };

  const handleCopyEmail = async () => {
    const email = `expense@${user?.email?.split('@')[0] || 'user'}.snaptrack.bot`;
    try {
      await Clipboard.setStringAsync(email);
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Alert.alert('Email Copied!', `${email} has been copied to your clipboard.`);
    } catch (error) {
      console.error('Failed to copy email:', error);
      Alert.alert('Error', 'Failed to copy email to clipboard. Please try again.');
    }
  };

  const handleRestartOnboarding = () => {
    Alert.alert(
      'Restart Tutorial',
      'This will restart the app tutorial and show you how to use SnapTrack features.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Tutorial', 
          onPress: async () => {
            try {
              // Clear onboarding completion flag
              await AsyncStorage.removeItem('onboarding_completed');
              if (onRestartOnboarding) {
                onRestartOnboarding();
              }
            } catch (error) {
              console.error('Error restarting onboarding:', error);
              // Still try to restart even if clearing storage failed
              if (onRestartOnboarding) {
                onRestartOnboarding();
              }
            }
          }
        }
      ]
    );
  };

  const renderEntityModal = () => (
    <Modal
      visible={showEntityModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEntityModal(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingEntity ? 'Edit Entity' : 'Add Entity'}
          </Text>
          <TouchableOpacity onPress={handleSaveEntity}>
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Entity Name</Text>
          <TextInput
            style={styles.textInput}
            value={entityName}
            onChangeText={setEntityName}
            placeholder="Enter entity name"
            autoFocus
          />
        </View>
      </SafeAreaView>
    </Modal>
  );


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business Entities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Entities</Text>
            <TouchableOpacity onPress={handleAddEntity} style={styles.addButton}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {entities.map((entity) => (
            <View key={entity.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{entity.name}</Text>
                {entity.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity
                  onPress={() => handleEditEntity(entity)}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteEntity(entity)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Tags Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Tags</Text>
            <TouchableOpacity onPress={handleTagInfo} style={styles.infoButton}>
              <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tagsContainer}>
            {tags.length > 0 ? (
              tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyTagsText}>
                No tags yet. Tags will appear here automatically when you use them in your expenses.
              </Text>
            )}
          </View>
        </View>

        {/* Email Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Configuration</Text>
          
          <View style={styles.emailConfig}>
            <Text style={styles.emailLabel}>Your SnapTrack Email:</Text>
            <Text style={styles.emailAddress}>
              expense@{user?.email?.split('@')[0] || 'user'}.snaptrack.bot
            </Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyEmail}>
              <Text style={styles.copyButtonText}>Copy Email</Text>
            </TouchableOpacity>
            
            <Text style={styles.emailTip}>
              Forward receipts to this email to automatically add them to SnapTrack
            </Text>
          </View>
        </View>


        {/* Help & Getting Started Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Getting Started</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleRestartOnboarding}>
            <Ionicons name="school" size={20} color={colors.primary} />
            <View style={styles.actionItemContent}>
              <Text style={styles.actionItemText}>App Tutorial</Text>
              <Text style={styles.actionItemSubtext}>Replay the getting started guide</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => {
            navigation.navigate('Help' as never);
          }}>
            <Ionicons name="help-circle" size={20} color={colors.primary} />
            <View style={styles.actionItemContent}>
              <Text style={styles.actionItemText}>Help Center</Text>
              <Text style={styles.actionItemSubtext}>Browse articles and tutorials</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => {
            // For now, let's show release notes in an alert - could be a modal later
            Alert.alert(
              '🎉 What\'s New in v1.1.0',
              '🤖 Big News: AI Receipt Intelligence!\nSnapTrack now automatically enhances blurry or unclear receipts with AI validation. You\'ll see exactly when and why we\'re improving your data.\n\n✨ Enhanced: Smart Processing Flow\nWatch the new 5-stage flow in action - when confidence is low, you\'ll see "AI analyzing" with improvement counts.\n\n🐛 Fixed: Better AI Detection\nNo more wondering if AI kicked in - the system now shows validation status clearly.\n\nTry a blurry receipt and watch the magic happen!',
              [{ text: 'Amazing!', style: 'default' }]
            );
          }}>
            <Ionicons name="newspaper" size={20} color={colors.primary} />
            <View style={styles.actionItemContent}>
              <Text style={styles.actionItemText}>Release Notes</Text>
              <Text style={styles.actionItemSubtext}>What's new in v1.1.0</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('About' as never)}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <View style={styles.actionItemContent}>
              <Text style={styles.actionItemText}>About SnapTrack</Text>
              <Text style={styles.actionItemSubtext}>Version info and credits</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Contact' as never)}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <View style={styles.actionItemContent}>
              <Text style={styles.actionItemText}>Contact Support</Text>
              <Text style={styles.actionItemSubtext}>Get help with specific issues</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          

          <TouchableOpacity style={[styles.actionItem, styles.dangerAction]}>
            <Ionicons name="trash" size={20} color={colors.error} />
            <Text style={[styles.actionItemText, styles.dangerText]}>Clear All Data</Text>
            <Ionicons name="chevron-forward-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderEntityModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  addButton: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  infoButton: {
    padding: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  listItemActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  defaultBadgeText: {
    ...typography.caption,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  usageCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  tagChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  tagText: {
    ...typography.caption,
    color: '#ffffff',
    fontWeight: '500',
  },
  emptyTagsText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emailConfig: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 12,
  },
  emailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  emailAddress: {
    ...typography.body,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  copyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  copyButtonText: {
    ...typography.body,
    color: '#ffffff',
    fontWeight: '500',
  },
  emailTip: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  actionItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionItemText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actionItemSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dangerAction: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  dangerText: {
    color: colors.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  modalTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  modalCancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalSaveText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  modalContent: {
    padding: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  textInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
});