// Restaurant settings — profile, notifications, logout
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { restaurant, user, logout } = useAuth();

  const [newOrderNotifs, setNewOrderNotifs] = useState(true);
  const [lowStockNotifs, setLowStockNotifs] = useState(true);
  const [payoutNotifs, setPayoutNotifs] = useState(true);

  const handleLogout = () => {
    Alert.alert('Log out', 'are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
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
          thumbColor="#FFFFFF"
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
          <View style={[styles.avatar, { backgroundColor: colors.primaryDim }]}>
             {restaurant?.logo_url ? (
              <Image source={{ uri: restaurant.logo_url }} style={styles.avatarImg} />
            ) : (
              <Feather name="coffee" size={28} color={colors.primary} />
            )}
          </View>
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
          <SettingRow icon="credit-card" label="Bank Account" value={`${restaurant?.bank_name ?? 'None'} · ****${restaurant?.bank_account_number?.slice(-4) ?? '0000'}`} />
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
          ChopQuick v0.0.0 · Mock Mode
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  scroll: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 100 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
