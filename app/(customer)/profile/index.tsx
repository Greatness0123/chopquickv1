// Customer profile — account info, stats, referral code
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, typography } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useColors } from '../../../hooks/useColors';
import { useWalletStore } from '../../../stores/wallet.store';

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [pushNotifs, setPushNotifs] = React.useState(true);

  const initials = (user?.full_name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    Alert.alert('Log out', 'are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        }
      },
    ]);
  };

  const shareReferral = () => {
    Share.share({
      message: `Join ChopQuick and save money on delicios food! use my code: ${user?.referral_code ?? 'CQe0eo'}`,
    });
  };

  function SectionLabel({ title }: { title: string }) {
    return (
      <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 1, paddingHorizontal: 4, marginTop: spacing.md, marginBottom: spacing.xs }]}>
        {title}
      </Text>
    );
  }

  function RowItem({
    icon,
    label,
    value,
    onPress,
    destructive = false,
    chevron = true,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    destructive?: boolean;
    chevron?: boolean;
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.foreground }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* avatar + name */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={[typography.h2, { color: '#FFFFFF' }]}>{initials}</Text>
            )}
          </View>
          <Text style={[typography.h3, { color: colors.foreground }]}>
            {user?.full_name ?? 'User'}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {user?.phone}
          </Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.h3, { color: colors.primary }]}>
              {user?.meals_saved_count ?? 0}
            </Text>
            <Text style={[typography.label, { color: colors.textMuted }]}>Meals Saved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.h3, { color: colors.foreground }]}>
              ₦{(user?.total_spent ?? 0).toLocaleString('en-NG')}
            </Text>
            <Text style={[typography.label, { color: colors.textMuted }]}>Total Spent</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.h3, { color: colors.success }]}>
              ₦{user?.wallet_balance?.toLocaleString('en-NG') ?? '0'}
            </Text>
            <Text style={[typography.label, { color: colors.textMuted }]}>Wallet</Text>
          </View>
        </View>

        {/* Referral */}
        <Pressable
          onPress={shareReferral}
          style={[styles.referralCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.referralBadge, { backgroundColor: colors.primary }]}>
            <Feather name="gift" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodySemiBold, { color: colors.foreground }]}>Refer & Earn</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Share code: <Text style={{ color: colors.primary, fontWeight: '700' }}>{user?.referral_code ?? 'CQ-PROMO'}</Text>
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>

        {/* account */}
        <SectionLabel title="Account" />
        <View style={styles.group}>
          <RowItem icon="user" label="Edit Profile" onPress={() => router.push('/(customer)/profile/edit' as any)} />
          <RowItem
            icon="credit-card"
            label="Wallet"
            value={`₦${user?.wallet_balance?.toLocaleString('en-NG') ?? '0'}`}
            onPress={() => router.push('/(customer)/wallet' as any)}
          />
          <RowItem icon="dollar-sign" label="Bank Account" onPress={() => router.push('/(customer)/profile/bank-account' as any)} />
          <RowItem icon="map-pin" label="Delivery addresses" onPress={() => router.push('/(customer)/addresses' as any)} />
        </View>

        {/* Notifications */}
        <SectionLabel title="Notifications" />
        <View style={styles.group}>
          <View style={[styles.row, { backgroundColor: colors.surface }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.elevated }]}>
              <Feather name="bell" size={16} color={colors.textSecondary} />
            </View>
            <Text style={[typography.body, styles.rowLabel, { color: colors.foreground }]}>
              Push Notifications
            </Text>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Support */}
        <SectionLabel title="Support" />
        <View style={styles.group}>
          <RowItem icon="help-circle" label="Help & Support" onPress={() => router.push('/(customer)/support' as any)} />
          <RowItem icon="file-text" label="Terms of Service" onPress={() => {}} />
          <RowItem icon="shield" label="Privacy Policy" onPress={() => {}} />
        </View>

        {/* Danger zone */}
        <SectionLabel title="Account Actions" />
        <View style={styles.group}>
          <RowItem
            icon="log-out"
            label="Log out"
            onPress={handleLogout}
            destructive
            chevron={false}
          />
        </View>

        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
          ChopQuick v0.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignSelf: 'center',paddingBottom: spacing.xxl },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  scroll: { padding: spacing.lg, paddingBottom: 120 },
  profileCard: {
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1.5,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  referralBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: { borderRadius: 14, overflow: 'hidden', gap: 1, marginBottom: spacing.sm },
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
});
