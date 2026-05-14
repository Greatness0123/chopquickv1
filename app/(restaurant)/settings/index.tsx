// Restaurant settings — profile, notifications, logout
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Image,
  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, typography } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useColors } from '../../../hooks/useColors';
import { supabase } from '../../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../../../components/ui/Toast';
import { useDialog } from '../../../components/ui/Dialog';

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { restaurant, user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  const [uploading, setUploading] = useState(false);
  const [newOrderNotifs, setNewOrderNotifs] = useState(true);
  const [lowStockNotifs, setLowStockNotifs] = useState(true);
  const [payoutNotifs, setPayoutNotifs] = useState(true);

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log out',
      destructive: true,
    });
    if (confirmed) {
      await logout();
      router.replace('/(auth)/login');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('We need access to your photos to upload a logo.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      uploadLogo(result.assets[0].uri);
    }
  };

  const uploadLogo = async (uri: string) => {
    if (!restaurant?.id) return;
    setUploading(true);
    try {
      const ext = uri.split('.').pop();
      const fileName = `${restaurant.id}/logo_${Date.now()}.${ext}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${ext}`,
      } as any);

      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ logo_url: publicUrl })
        .eq('id', restaurant.id);

      if (updateError) throw updateError;

      await refreshUser();
      showToast('Restaurant logo updated', 'success');
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Could not upload logo', 'error');
    } finally {
      setUploading(false);
    }
  };

  function SectionHeader({ title }: { title: string }) {
    return (
      <Text style={[typography.label, styles.sectionHeader, { color: colors.textMuted }]}>
        {title}
      </Text>
    );
  }

  function SettingRow({
    icon,
    label,
    value,
    onPress,
    chevron = true,
    destructive = false,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    chevron?: boolean;
    destructive?: boolean;
  }) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.surface, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <View style={[styles.rowIcon, { backgroundColor: destructive ? colors.errorDim : colors.elevated }]}>
          <Feather name={icon} size={16} color={destructive ? colors.error : colors.textSecondary} />
        </View>
        <Text
          style={[
            typography.body,
            styles.rowLabel,
            { color: destructive ? colors.error : colors.foreground },
          ]}
        >
          {label}
        </Text>
        {value ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>{value}</Text>
        ) : null}
        {chevron && !value && (
          <Feather name="chevron-right" size={16} color={colors.textMuted} />
        )}
      </Pressable>
    );
  }

  function ToggleRow({
    icon,
    label,
    value,
    onChange,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <View style={[styles.row, { backgroundColor: colors.surface }]}>
        <View style={[styles.rowIcon, { backgroundColor: colors.elevated }]}>
          <Feather name={icon} size={16} color={colors.textSecondary} />
        </View>
        <Text style={[typography.body, styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.foreground}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Restaurant profile */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <Pressable
            onPress={pickImage}
            disabled={uploading}
            style={[styles.avatar, { backgroundColor: colors.primaryDim }]}
          >
             {restaurant?.logo_url ? (
              <Image source={{ uri: restaurant.logo_url }} style={styles.avatarImg} />
            ) : (
              <Feather name="coffee" size={28} color={colors.primary} />
            )}
            {uploading && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="small" color={colors.foreground} />
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.foreground, borderColor: colors.background }]}>
              <Feather name="camera" size={10} color="#FFF" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h4, { color: colors.foreground }]}>
              {restaurant?.name ?? 'Restaurant'}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {restaurant?.area ?? 'Lagos'} · {user?.email}
            </Text>
          </View>
        </View>

        {/* Restaurant info */}
        <SectionHeader title="Restaurant Info" />
        <View style={styles.group}>
          <SettingRow
            icon="map-pin"
            label="Location"
            value={restaurant?.area ?? 'Lagos'}
          />
          <SettingRow icon="phone" label="Contact Number" value={user?.phone ?? '+234 000 000 0000'} />
          <SettingRow icon="clock" label="Pickup Hours" value="8:00pm – 9:30pm" />
        </View>

        {/* Payments */}
        <SectionHeader title="Payments" />
        <View style={styles.group}>
          <SettingRow
            icon="credit-card"
            label="Bank Account"
            value={restaurant?.bank_name ? `${restaurant.bank_name} · ****${restaurant.bank_account_number?.slice(-4)}` : 'Set up bank account'}
            onPress={() => router.push('/(restaurant)/settings/bank-account' as any)}
          />
          <SettingRow
            icon="arrow-up-right"
            label="Withdraw earnings"
            onPress={() => router.push('/(restaurant)/withdraw' as any)}
          />
        </View>

        {/* Support */}
        <SectionHeader title="Support" />
        <View style={styles.group}>
          <SettingRow icon="help-circle" label="Help Center" />
          <SettingRow icon="file-text" label="Terms & Conditions" />
          <SettingRow icon="shield" label="Privacy Policy" />
        </View>

        {/* account */}
        <SectionHeader title="Account" />
        <View style={styles.group}>
          <SettingRow
            icon="log-out"
            label="Log out"
            onPress={handleLogout}
            chevron={false}
            destructive
          />
        </View>

        <Text style={[typography.caption, styles.version, { color: colors.textMuted }]}>
          ChopQuick v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 ,paddingBottom: spacing.xxl},
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  scroll: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 120 },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#000',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
  group: { borderRadius: 14, overflow: 'hidden', gap: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1 },
  version: { textAlign: 'center', marginTop: spacing.xl },
});
