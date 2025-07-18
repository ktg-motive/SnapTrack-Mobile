import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../styles/theme';
import { ReleaseNotesResponse } from '../utils/version';
import MarkdownRenderer from './MarkdownRenderer';

interface ReleaseNotesModalProps {
  visible: boolean;
  onClose: () => void;
  releaseNotes: ReleaseNotesResponse | null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ReleaseNotesModal: React.FC<ReleaseNotesModalProps> = ({
  visible,
  onClose,
  releaseNotes
}) => {
  if (!releaseNotes) return null;

  const getReleaseTypeColor = (type: string) => {
    switch (type) {
      case 'major': return '#FF6B35';
      case 'minor': return '#007AFF';
      case 'patch': return '#34C759';
      case 'hotfix': return '#FF9500';
      default: return '#666';
    }
  };

  const getReleaseTypeIcon = (type: string) => {
    switch (type) {
      case 'major': return 'rocket';
      case 'minor': return 'add-circle';
      case 'patch': return 'build';
      case 'hotfix': return 'flash';
      default: return 'information-circle';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>What's New</Text>
            <Text style={styles.headerSubtitle}>
              SnapTrack {releaseNotes.version || 'Latest Version'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Release Type Badge */}
          <View style={styles.releaseTypeContainer}>
            <View style={[
              styles.releaseTypeBadge,
              { backgroundColor: getReleaseTypeColor(releaseNotes.releaseType) }
            ]}>
              <Ionicons 
                name={getReleaseTypeIcon(releaseNotes.releaseType) as any}
                size={16} 
                color="white" 
              />
              <Text style={styles.releaseTypeText}>
                {releaseNotes.releaseType.toUpperCase()} UPDATE
              </Text>
            </View>
            {releaseNotes.releaseDate && (
              <Text style={styles.releaseDate}>
                Released {formatDate(releaseNotes.releaseDate)}
              </Text>
            )}
          </View>

          {/* Highlights Section */}
          {releaseNotes.highlights && releaseNotes.highlights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Highlights</Text>
              {releaseNotes.highlights.map((highlight, index) => (
                <View key={index} style={styles.highlightItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Full Content Section */}
          {releaseNotes.content && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Release Notes</Text>
              <MarkdownRenderer content={releaseNotes.content} />
            </View>
          )}

          {/* Platform Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Version Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Platform:</Text>
              <Text style={styles.detailValue}>
                {releaseNotes.platform.toUpperCase()}
              </Text>
            </View>
            {releaseNotes.buildNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Build:</Text>
                <Text style={styles.detailValue}>{releaseNotes.buildNumber}</Text>
              </View>
            )}
            {releaseNotes.contentType && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Format:</Text>
                <Text style={styles.detailValue}>
                  {releaseNotes.contentType.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Fallback notice */}
          {releaseNotes.fallback && (
            <View style={styles.fallbackNotice}>
              <Ionicons name="information-circle" size={16} color={colors.warning} />
              <Text style={styles.fallbackText}>
                Showing cached release notes (offline mode)
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...typography.title2,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  releaseTypeContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  releaseTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.sm,
  },
  releaseTypeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: spacing.xs,
    letterSpacing: 0.5,
  },
  releaseDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  highlightText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  contentText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontFamily: 'Menlo',
  },
  fallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  fallbackText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: spacing.sm,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    ...typography.body,
    color: 'white',
    fontWeight: '600',
  },
});

export default ReleaseNotesModal;