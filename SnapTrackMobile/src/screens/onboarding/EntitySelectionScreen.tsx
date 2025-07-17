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
  { id: 'personal', name: 'Personal', icon: 'person' as keyof typeof Icon.glyphMap, color: '#4CAF50' },
  { id: 'work', name: 'Work', icon: 'work' as keyof typeof Icon.glyphMap, color: '#2196F3' },
  { id: 'business', name: 'Business Travel', icon: 'business-center' as keyof typeof Icon.glyphMap, color: '#FF9800' },
  { id: 'motive', name: 'Motive AI', icon: 'psychology' as keyof typeof Icon.glyphMap, color: '#9C27B0' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop' as keyof typeof Icon.glyphMap, color: '#607D8B' },
  { id: 'rental', name: 'Rental Property', icon: 'home' as keyof typeof Icon.glyphMap, color: '#795548' }
];

const commonTags = [
  { id: 'meals', name: 'Meals', icon: 'restaurant' as keyof typeof Icon.glyphMap, color: '#FF5722' },
  { id: 'travel', name: 'Travel', icon: 'flight' as keyof typeof Icon.glyphMap, color: '#03A9F4' },
  { id: 'office', name: 'Office', icon: 'business' as keyof typeof Icon.glyphMap, color: '#8BC34A' },
  { id: 'equipment', name: 'Equipment', icon: 'computer' as keyof typeof Icon.glyphMap, color: '#FF9800' },
  { id: 'medical', name: 'Medical', icon: 'local-hospital' as keyof typeof Icon.glyphMap, color: '#F44336' },
  { id: 'education', name: 'Education', icon: 'school' as keyof typeof Icon.glyphMap, color: '#9C27B0' },
  { id: 'entertainment', name: 'Entertainment', icon: 'movie' as keyof typeof Icon.glyphMap, color: '#E91E63' },
  { id: 'gas', name: 'Gas', icon: 'local-gas-station' as keyof typeof Icon.glyphMap, color: '#607D8B' },
  { id: 'parking', name: 'Parking', icon: 'local-parking' as keyof typeof Icon.glyphMap, color: '#795548' },
  { id: 'supplies', name: 'Supplies', icon: 'inventory' as keyof typeof Icon.glyphMap, color: '#009688' }
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
      useNativeDriver: true
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
                    selectedEntity === entity.id && styles.selectedEntityCard
                  ]}
                  onPress={() => handleEntitySelect(entity.id)}
                >
                  <View style={[styles.entityIcon, { backgroundColor: entity.color }]}>
                    <Icon name={entity.icon} size={24} color="#fff" />
                  </View>
                  <Text style={[
                    styles.entityName,
                    selectedEntity === entity.id && styles.selectedEntityName
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
                    selectedTags.includes(tag.id) && styles.selectedTagChip
                  ]}
                  textStyle={[
                    styles.tagText,
                    selectedTags.includes(tag.id) && styles.selectedTagText
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
  actionSection: {
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 20
  },
  buttonContent: {
    paddingVertical: 8
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600'
  },
  checkIcon: {
    position: 'absolute',
    right: 8,
    top: 8
  },
  container: {
    flex: 1
  },
  contentSection: {
    flex: 1,
    paddingTop: 20
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center'
  },
  entityCard: {
    width: (width - 72) / 2, // Account for padding and gap
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative'
  },
  entityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  entityIcon: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 8,
    width: 48
  },
  entityName: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },
  exampleDemo: {
    gap: 8
  },
  exampleFilter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4
  },
  exampleResultText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14
  },
  exampleResults: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 16,
    paddingVertical: 4
  },
  exampleSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
    padding: 16
  },
  exampleText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500'
  },
  exampleTitle: {
    color: theme.colors.onBackground,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12
  },
  previewCard: {
    backgroundColor: '#f0f8ff',
    elevation: 1,
    marginBottom: 24
  },
  previewContent: {
    gap: 8
  },
  previewEntity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  previewTags: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8
  },
  previewText: {
    color: theme.colors.onSurfaceVariant,
    flex: 1,
    fontSize: 14
  },
  previewTitle: {
    color: theme.colors.onBackground,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginBottom: 12,
    width: width * 0.8
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  section: {
    marginBottom: 32
  },
  sectionDescription: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16
  },
  sectionTitle: {
    color: theme.colors.onBackground,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  selectedEntityCard: {
    backgroundColor: '#e8f5e8',
    borderColor: theme.colors.primary
  },
  selectedEntityName: {
    color: theme.colors.onBackground,
    fontWeight: '600'
  },
  selectedTagChip: {
    backgroundColor: theme.colors.primary
  },
  selectedTagText: {
    color: '#fff',
    fontWeight: '500'
  },
  skipText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center'
  },
  tagChip: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    borderWidth: 1
  },
  tagText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  title: {
    color: theme.colors.onBackground,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  }
});