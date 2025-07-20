import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { apiClient } from '../services/apiClient';
import { authService } from '../services/authService.compat';

interface UsernameHistory {
  username: string;
  assigned_at: string;
  change_count: number;
}

export default function UsernameSettingsScreen() {
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<UsernameHistory[]>([]);
  const [canChange, setCanChange] = useState(true);
  const [nextChangeAllowed, setNextChangeAllowed] = useState<string | null>(null);

  useEffect(() => {
    loadUsernameData();
  }, []);

  const loadUsernameData = async () => {
    try {
      setIsLoading(true);

      // Get current user to check their login email
      const user = authService.getCurrentUser();
      if (user?.email) {
        setLoginEmail(user.email);
      }

      // Load current username from API
      console.log('📱 Loading username data from API...');
      const currentResponse = await apiClient.get('/api/username/current');
      console.log('📱 Username API response:', JSON.stringify(currentResponse, null, 2));
      
      if (currentResponse.success) {
        setCurrentUsername(currentResponse.username || '');
        setEmailAddress(currentResponse.email_address || '');
        setCanChange(currentResponse.can_change !== false);
        setNextChangeAllowed(currentResponse.next_change_allowed || null);
      } else if (currentResponse.username !== undefined) {
        // Handle case where success flag might be missing but data exists
        setCurrentUsername(currentResponse.username || '');
        setEmailAddress(currentResponse.email_address || '');
        setCanChange(currentResponse.can_change !== false);
        setNextChangeAllowed(currentResponse.next_change_allowed || null);
      }

      // Load username history
      try {
        const historyResponse = await apiClient.get('/api/username/history');
        if (historyResponse.success && historyResponse.history) {
          setHistory(historyResponse.history);
        }
      } catch (error) {
        // History endpoint might not exist yet, ignore error
        console.log('Username history not available');
      }
    } catch (error: any) {
      console.error('Failed to load username data:', error);
      Alert.alert('Error', 'Failed to load username information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsernameData();
    setRefreshing(false);
  };

  const handleChangeUsername = () => {
    if (!canChange) {
      Alert.alert(
        'Username Change Restricted',
        `You can change your username again ${nextChangeAllowed ? `on ${formatDate(nextChangeAllowed)}` : 'in the future'}. You may only change your username once every 30 days.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.prompt(
      'Change Username',
      `Enter your new username. Your current username is "${currentUsername}". This will change your email address to [username]@app.snaptrack.bot`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check & Change',
          onPress: async (newUsername) => {
            if (!newUsername || newUsername.trim().length < 3) {
              Alert.alert('Error', 'Username must be at least 3 characters long');
              return;
            }

            const cleanUsername = newUsername.toLowerCase().replace(/[^a-z0-9\-\.]/g, '');
            
            if (cleanUsername !== newUsername.toLowerCase()) {
              Alert.alert('Error', 'Username can only contain letters, numbers, hyphens, and periods');
              return;
            }

            try {
              // Check availability first
              const checkResponse = await apiClient.post('/api/username/check', {
                username: cleanUsername
              });

              if (!checkResponse.success || !checkResponse.available) {
                const errors = checkResponse.errors || ['Username not available'];
                const suggestions = checkResponse.suggestions || [];
                
                Alert.alert(
                  'Username Not Available',
                  `${errors[0]}${suggestions.length > 0 ? '\n\nSuggestions: ' + suggestions.slice(0, 3).join(', ') : ''}`,
                  [{ text: 'OK' }]
                );
                return;
              }

              // Assign the username
              const assignResponse = await apiClient.post('/api/username/assign', {
                username: cleanUsername
              });

              if (assignResponse.success) {
                Alert.alert(
                  'Username Changed!',
                  `Your username has been changed to "${cleanUsername}". Your new email address is ${cleanUsername}@app.snaptrack.bot`,
                  [{ text: 'OK' }]
                );
                
                // Refresh the data
                await loadUsernameData();
              } else {
                Alert.alert('Error', assignResponse.error || 'Failed to change username. Please try again.');
              }
            } catch (error: any) {
              console.error('Username change error:', error);
              Alert.alert('Error', 'Failed to change username. Please check your connection and try again.');
            }
          }
        }
      ],
      'plain-text',
      currentUsername
    );
  };

  const copyEmailAddress = async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.default.setStringAsync(emailAddress);
      Alert.alert('Copied!', 'Email address copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Failed to copy email address');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading username settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Login Account Section */}
      {loginEmail && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Login Account</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>Signed in with: {loginEmail}</Text>
            </View>
            <Text style={styles.helpText}>
              This is your Google account used to sign in to SnapTrack.
            </Text>
          </View>
        </View>
      )}

      {/* Current Username Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receipt Email Username</Text>
        <Text style={styles.sectionSubtitle}>
          Choose a username to create your unique email address for receipt forwarding
        </Text>
        
        <View style={styles.usernameCard}>
          <View style={styles.usernameHeader}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <View style={styles.usernameInfo}>
              <Text style={styles.username}>{currentUsername || 'Not set'}</Text>
              <Text style={styles.usernameLabel}>Username</Text>
            </View>
          </View>
          
          <View style={styles.emailSection}>
            <View style={styles.emailHeader}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.emailLabel}>Receipt forwarding email:</Text>
            </View>
            <TouchableOpacity
              style={styles.emailContainer}
              onPress={copyEmailAddress}
              activeOpacity={0.7}
            >
              <Text style={styles.emailAddress}>{emailAddress}</Text>
              <Ionicons name="copy-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.changeButton,
            !canChange && styles.changeButtonDisabled
          ]}
          onPress={handleChangeUsername}
          disabled={!canChange}
        >
          <Text style={[
            styles.changeButtonText,
            !canChange && styles.changeButtonTextDisabled
          ]}>
            Change Username
          </Text>
        </TouchableOpacity>

        {!canChange && nextChangeAllowed && (
          <Text style={styles.changeRestrictionText}>
            Next change allowed: {formatDate(nextChangeAllowed)}
          </Text>
        )}
      </View>

      {/* Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Forward receipts to your email address for automatic processing
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Your username is private and secure - only you can see it
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="sync" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              All forwarded receipts sync instantly across your devices
            </Text>
          </View>
        </View>
      </View>

      {/* History Section */}
      {history.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Username History</Text>
          
          <View style={styles.historyCard}>
            {history.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyUsername}>{item.username}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.assigned_at)}</Text>
                </View>
                {index === 0 && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Privacy Note */}
      <View style={styles.privacySection}>
        <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.privacyText}>
          Your username and email address are private. We never share your information with third parties.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  usernameCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  usernameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  usernameInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  username: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  usernameLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emailSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  emailAddress: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  changeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  changeButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  changeButtonText: {
    ...typography.button,
    color: colors.white,
  },
  changeButtonTextDisabled: {
    color: colors.white + '80',
  },
  changeRestrictionText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    flex: 1,
    lineHeight: 22,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyUsername: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  historyDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  currentBadge: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  currentBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  privacyText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});