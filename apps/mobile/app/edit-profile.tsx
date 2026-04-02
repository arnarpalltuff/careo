import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function EditProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { user: updated } = await authService.updateMe({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      setUser(updated);
      router.back();
    } catch {
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Change profile photo">
            <View style={styles.avatarWrap}>
              <Avatar name={`${firstName} ${lastName}`} uri={avatarUrl} size={100} />
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>Edit</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {/* Fields */}
        <Input label="First Name" value={firstName} onChangeText={setFirstName} />
        <View style={{ height: 14 }} />
        <Input label="Last Name" value={lastName} onChangeText={setLastName} />
        <View style={{ height: 14 }} />
        <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="Optional" />
        <View style={{ height: 14 }} />
        <Input label="Email" value={user?.email || ''} onChangeText={() => {}} editable={false} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: 28 }} />
        <Button title="Save Changes" onPress={handleSave} loading={saving} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap: { position: 'relative' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  editBadgeText: { ...typography.labelSmall, color: '#fff', fontWeight: '700' },
  changePhotoText: { ...typography.bodySmall, color: colors.textHint, marginTop: 8 },
  error: { ...typography.labelMedium, color: colors.danger, marginTop: 12, textAlign: 'center' },
});
