import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../styles/theme';
import { authService } from '../services/authService.compat';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const user = authService.getCurrentUser();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update the profile using authService
      await authService.updateProfile({ displayName: displayName.trim() });
      
      Alert.alert(
        'Profile Updated',
        'Your profile has been updated successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && styles.savingText]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.profileImageSection}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color={colors.textMuted} />
            </View>
          )}
          <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>Change photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Display Name</Text>
          <TextInput
            style={styles.textInput}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
          />
          
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
          <Text style={styles.emailNote}>Email cannot be changed</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cancelText: {
    ...typography.body,
    color: colors.textSecondary
  },
  changePhotoButton: {
    paddingVertical: spacing.sm
  },
  changePhotoText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500'
  },
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    flex: 1,
    padding: spacing.lg
  },
  emailNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  emailText: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  fieldLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.lg
  },
  formSection: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  headerTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  profileImage: {
    borderRadius: 50,
    height: 100,
    marginBottom: spacing.md,
    width: 100
  },
  profileImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 100
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  saveText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600'
  },
  savingText: {
    color: colors.textMuted
  },
  textInput: {
    ...typography.body,
    backgroundColor: colors.card,
    borderColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  }
});