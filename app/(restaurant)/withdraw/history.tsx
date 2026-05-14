// Withdrawal history — all withdrawal requests for this restaurant
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { spacing, typography } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useColors } from '../../../hooks/useColors';
import { supabase } from '../../../lib/supabase';

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

export default function WithdrawalHistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { restaurant } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    if (!restaurant?.id) return;
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (err) {
      console.error('Error fetching withdrawal history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchHistory();
  }, [restaurant?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusVariant = (status: string) => {
    if (status === 'paid') return 'confirmed';
    if (status === 'rejected') return 'rejected';
    if (status === 'reversed') return 'reversed';
    if (status === 'processing') return 'processing';
    return 'pending';
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.foreground }]}>Withdrawal History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? null : withdrawals.length === 0 ? (
          <EmptyState
            icon="credit-card"
            title="No withdrawals yet"
            description="Your withdrawal history will appear here"
          />
        ) : (
          withdrawals.map((w) => (
            <View key={w.id} style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h4, { color: colors.foreground }]}>
                    {formatNGN(w.amount)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                    {w.bank_name} ···{w.bank_account_number?.slice(-4)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                    {formatDateTime(w.created_at)}
                    {w.paystack_reference ? ` · Ref: ${w.paystack_reference}` : ''}
                  </Text>
                </View>
                <Badge
                  variant={getStatusVariant(w.status)}
                  label={STATUS_LABELS[w.status] ?? w.status}
                />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  back: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: 14, padding: spacing.lg },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
});