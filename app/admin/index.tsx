// Admin — Withdrawal Management (default tab)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ToastViewport } from '../../components/ui/Toast';
import { useToast } from '../../components/ui/Toast';
import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { supabase } from '../../lib/supabase';

const ADMIN_PASSWORD = 'Gruco123';
const ADMIN_KEY = 'chopquick_admin_access';

const STATUS_OPTIONS = ['pending', 'processing', 'paid', 'rejected', 'reversed'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  rejected: 'Rejected',
  reversed: 'Reversed',
};

function formatNGN(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export default function AdminWithdrawalsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { showToast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem(ADMIN_KEY).then((val) => {
      if (val === 'true') setIsAdmin(true);
    });
  }, []);

  React.useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleAdminLogin = async () => {
    if (!password.trim()) {
      showToast('Enter the admin password', 'error');
      return;
    }
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 500));
    if (password.trim() === ADMIN_PASSWORD) {
      await AsyncStorage.setItem(ADMIN_KEY, 'true');
      setIsAdmin(true);
      setPassword('');
      showToast('Admin access granted', 'success');
    } else {
      showToast('Invalid password', 'error');
    }
    setVerifying(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(ADMIN_KEY);
    setIsAdmin(false);
    setWithdrawals([]);
  };

  const fetchData = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const [wRes, rRes] = await Promise.all([
        supabase
          .from('withdrawals')
          .select('*, restaurant:restaurants(name, owner_id)')
          .order('created_at', { ascending: false }),
        supabase
          .from('restaurants')
          .select('id, name, owner_id')
          .order('created_at', { ascending: false }),
      ]);

      if (wRes.error) throw wRes.error;
      setWithdrawals(wRes.data || []);
      if (rRes.error) console.error(rRes.error);
      setRestaurants(rRes.data || []);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
      );
      showToast(`Status updated to ${STATUS_LABELS[newStatus]}`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusVariant = (status: string) => {
    if (status === 'paid') return 'confirmed';
    if (status === 'rejected') return 'rejected';
    if (status === 'reversed') return 'reversed';
    if (status === 'processing') return 'processing';
    return 'pending';
  };

  const getRestaurantName = (id: string) => {
    const r = restaurants.find((r) => r.id === id);
    return r?.name || 'Unknown Restaurant';
  };

  // ── Password Screen ──
  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ToastViewport />
        <View style={styles.loginContainer}>
          <View style={[styles.loginCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.lockIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="shield" size={32} color={colors.primary} />
            </View>
            <Text style={[typography.h3, { color: colors.foreground, marginTop: spacing.md }]}>
              Admin Access
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
              Enter the admin password to access the dashboard
            </Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Admin password"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              style={[
                styles.passwordInput,
                { backgroundColor: colors.elevated, color: colors.foreground, borderColor: colors.border },
              ]}
              onSubmitEditing={handleAdminLogin}
            />

            <Pressable
              onPress={handleAdminLogin}
              disabled={verifying}
              style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            >
              {verifying ? (
                <ActivityIndicator color={colors.foreground} size="small" />
              ) : (
                <Text style={[typography.bodySemiBold, { color: colors.foreground }]}>
                  Unlock Dashboard
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={{ marginTop: spacing.lg }}
            >
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Go back
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Admin Dashboard ──
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ToastViewport />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.foreground }]}>Withdrawals</Text>
        <Pressable onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.error + '20' }]}>
          <Feather name="log-out" size={14} color={colors.error} />
          <Text style={[typography.caption, { color: colors.error, marginLeft: 4 }]}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : withdrawals.length === 0 ? (
          <EmptyState
            icon="credit-card"
            title="No withdrawals"
            description="All withdrawal requests will appear here"
          />
        ) : (
          withdrawals.map((w) => (
            <View key={w.id} style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h4, { color: colors.foreground }]}>
                    {formatNGN(w.amount)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.primary, marginTop: 2 }]}>
                    {getRestaurantName(w.restaurant_id)}
                  </Text>
                </View>
                <Badge
                  variant={getStatusVariant(w.status)}
                  label={STATUS_LABELS[w.status] ?? w.status}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <Text style={[typography.captionMedium, { color: colors.textSecondary, marginBottom: 4 }]}>
                Bank Details
              </Text>
              <View style={styles.bankRow}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>Bank</Text>
                <Text style={[typography.body, { color: colors.foreground }]}>{w.bank_name}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>Account</Text>
                <Text style={[typography.body, { color: colors.foreground }]}>{w.bank_account_number}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>Name</Text>
                <Text style={[typography.body, { color: colors.foreground }]}>{w.bank_account_name || 'N/A'}</Text>
              </View>

              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
                {formatDateTime(w.created_at)}
                {w.paystack_reference ? ` · Ref: ${w.paystack_reference}` : ''}
              </Text>

              <View style={styles.statusActions}>
                <Text style={[typography.captionMedium, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                  Update Status
                </Text>
                <View style={styles.statusRow}>
                  {STATUS_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt}
                      onPress={() => updateStatus(w.id, opt)}
                      disabled={updatingId === w.id || w.status === opt}
                      style={[
                        styles.statusBtn,
                        {
                          backgroundColor: w.status === opt ? colors.primary : colors.elevated,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {updatingId === w.id && w.status !== opt ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text
                          style={[
                            typography.captionMedium,
                            { color: w.status === opt ? colors.foreground : colors.textMuted },
                          ]}
                        >
                          {STATUS_LABELS[opt]}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingBottom: spacing.xxl },
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loginCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordInput: {
    width: '100%',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  loginBtn: {
    width: '100%',
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  scroll: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: 14, padding: spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  divider: { height: 1, marginVertical: spacing.md },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  statusActions: { marginTop: spacing.lg },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
});