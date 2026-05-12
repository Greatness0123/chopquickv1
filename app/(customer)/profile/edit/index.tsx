// Edit profile screen — update name, phone, and avatar
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { spacing, typography } from '../../../../constants/colors';
import { useAuth } from '../../../../context/AuthContext';
import { useColors } from '../../../../hooks/useColors';
import { supabase } from '../../../../lib/supabase';

export default function EditProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const ext = uri.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${ext}`,
      } as any);

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshUser();
      Alert.alert('Success', 'Profile photo updated');
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Error', 'Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          phone: phone.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface }]}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[typography.h3, { color: colors.foreground }]}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarWrapper, { borderColor: colors.primary }]}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                <Feather name="user" size={40} color={colors.textMuted} />
              </View>
            )}
            <Pressable
              onPress={pickImage}
              disabled={uploading}
              style={[styles.editBtn, { backgroundColor: colors.primary }]}
            >
              {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Feather name="camera" size={16} color="#FFF" />}
            </Pressable>
          </View>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 12 }]}>
            Tap camera to change photo
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Ade Johnson"
            leftIcon={<Feather name="user" size={18} color={colors.placeholder} />}
          />
          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+234 801 234 5678"
            leftIcon={<Feather name="phone" size={18} color={colors.placeholder} />}
          />
          <Input
            label="Email Address"
            value={user?.email ?? ''}
            editable={false}
            placeholder="ade@example.com"
            leftIcon={<Feather name="mail" size={18} color={colors.placeholder} />}
          />
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: -spacing.sm }]}>
            Email cannot be changed for security reasons
          </Text>

          <Button
            label="Save Changes"
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignSelf: 'center',paddingBottom: spacing.xxl },
  scroll: { paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSection: { alignItems: 'center', marginVertical: spacing.xl },
  avatarWrapper: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, padding: 4, position: 'relative',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 60 },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  editBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#0A0A0A',
  },
  form: { paddingHorizontal: spacing.lg, gap: spacing.lg },
});
