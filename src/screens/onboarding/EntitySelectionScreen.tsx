import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Card, Chip } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface EntitySelectionScreenProps {
  onNext: () => void;
  onEntitySelection: (entity: string, tags: string[]) => void;
  state: any;
}

const { width } = Dimensions.get('window');

const commonEntities = [
  { id: 'personal', name: 'Personal', icon: 'person', color: '#4CAF50' },
  { id: 'work', name: 'Work', icon: 'work', color: '#2196F3' },
  { id: 'business', name: 'Business Travel', icon: 'business-center', color: '#FF9800' },
  { id: 'motive', name: 'Motive AI', icon: 'psychology', color: '#9C27B0' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop', color: '#607D8B' },
  { id: 'rental', name: 'Rental Property', icon: 'home', color: '#795548' },
];

const commonTags = [
  { id: 'meals', name: 'Meals', icon: 'restaurant', color: '#FF5722' },
  { id: 'travel', name: 'Travel', icon: 'flight', color: '#03A9F4' },
  { id: 'office', name: 'Office', icon: 'business', color: '#8BC34A' },
  { id: 'equipment', name: 'Equipment', icon: 'computer', color: '#FF9800' },
  { id: 'medical', name: 'Medical', icon: 'local-hospital', color: '#F44336' },
  { id: 'education', name: 'Education', icon: 'school', color: '#9C27B0' },
  { id: 'entertainment', name: 'Entertainment', icon: 'movie', color: '#E91E63' },
  { id: 'gas', name: 'Gas', icon: 'local-gas-station', color: '#607D8B' },
  { id: 'parking', name: 'Parking', icon: 'local-parking', color: '#795548' },
  { id: 'supplies', name: 'Supplies', icon: 'inventory', color: '#009688' },
];

export default function EntitySelectionScreen({ 
  onNext, 
  onEntitySelection, 
  state 
}: EntitySelectionScreenProps) {
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleEntitySelect = (entityId: string) => {
    setSelectedEntity(entityId);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleContinue = () => {
    onEntitySelection(selectedEntity, selectedTags);
    onNext();
  };

  const getEntityById = (id: string) => commonEntities.find(e => e.id === id);
  const getTagById = (id: string) => commonTags.find(t => t.id === id);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentSection}>
          <Text style={styles.title}>Organize by business entity</Text>
          <Text style={styles.description}>
            Separate work expenses from personal for easier tax reporting
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Business Entity</Text>
            <View style={styles.entityGrid}>
              {commonEntities.map((entity) => (
                <TouchableOpacity
                  key={entity.id}
                  style={[
                    styles.entityCard,
                    selectedEntity === entity.id && styles.selectedEntityCard,
                  ]}
                  onPress={() => handleEntitySelect(entity.id)}
                >
                  <View style={[styles.entityIcon, { backgroundColor: entity.color }]}>
                    <Icon name={entity.icon} size={24} color="#fff" />
                  </View>
                  <Text style={[
                    styles.entityName,
                    selectedEntity === entity.id && styles.selectedEntityName,
                  ]}>
                    {entity.name}
                  </Text>
                  {selectedEntity === entity.id && (
                    <View style={styles.checkIcon}>
                      <Icon name="check-circle" size={20} color={theme.colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Tags (Optional)</Text>
            <Text style={styles.sectionDescription}>
              Tags help you filter and categorize expenses later
            </Text>
            
            <View style={styles.tagsContainer}>
              {commonTags.map((tag) => (
                <Chip
                  key={tag.id}
                  selected={selectedTags.includes(tag.id)}
                  onPress={() => handleTagToggle(tag.id)}
                  style={[
                    styles.tagChip,
                    selectedTags.includes(tag.id) && styles.selectedTagChip,
                  ]}
                  textStyle={[
                    styles.tagText,
                    selectedTags.includes(tag.id) && styles.selectedTagText,
                  ]}
                  icon={() => (
                    <Icon 
                      name={tag.icon} 
                      size={16} 
                      color={selectedTags.includes(tag.id) ? '#fff' : tag.color} 
                    />
                  )}
                >
                  {tag.name}
                </Chip>
              ))}
            </View>
          </View>

          {(selectedEntity || selectedTags.length > 0) && (
            <Card style={styles.previewCard}>
              <Card.Content>
                <Text style={styles.previewTitle}>Preview</Text>
                <View style={styles.previewContent}>
                  {selectedEntity && (
                    <View style={styles.previewEntity}>
                      <Icon name="business" size={16} color={theme.colors.primary} />
                      <Text style={styles.previewText}>
                        Entity: {getEntityById(selectedEntity)?.name}
                      </Text>
                    </View>
                  )}
                  {selectedTags.length > 0 && (
                    <View style={styles.previewTags}>
                      <Icon name="label" size={16} color={theme.colors.primary} />
                      <Text style={styles.previewText}>
                        Tags: {selectedTags.map(id => getTagById(id)?.name).join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          )}

          <View style={styles.exampleSection}>
            <Text style={styles.exampleTitle}>Example: Filter by category</Text>
            <View style={styles.exampleDemo}>
              <View style={styles.exampleFilter}>
                <Icon name="filter-list" size={16} color={theme.colors.primary} />
                <Text style={styles.exampleText}>Show all "Meals" expenses from last month</Text>
              </View>
              <View style={styles.exampleResults}>
                <Icon name="receipt" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.exampleResultText}>Coffee & More - $24.99</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionSection}>
        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          disabled={!selectedEntity}
        >
          Continue
        </Button>
        <Text style={styles.skipText}>
          You can change these settings anytime in the app
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentSection: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
    lineHeight: 20,
  },
  entityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  entityCard: {
    width: (width - 72) / 2, // Account for padding and gap
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedEntityCard: {
    borderColor: theme.colors.primary,
    backgroundColor: '#e8f5e8',
  },
  entityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  entityName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  selectedEntityName: {
    color: theme.colors.onBackground,
    fontWeight: '600',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedTagChip: {
    backgroundColor: theme.colors.primary,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  selectedTagText: {
    color: '#fff',
    fontWeight: '500',
  },
  previewCard: {
    backgroundColor: '#f0f8ff',
    marginBottom: 24,
    elevation: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 12,
  },
  previewContent: {
    gap: 8,
  },
  previewEntity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewTags: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  previewText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
  exampleSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 12,
  },
  exampleDemo: {
    gap: 8,
  },
  exampleFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  exampleText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  exampleResults: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingVertical: 4,
  },
  exampleResultText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  actionSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  primaryButton: {
    width: width * 0.8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});