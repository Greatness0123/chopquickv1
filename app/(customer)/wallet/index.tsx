// Wallet sceen — balance, transactions, quick actions
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '../../../components/ui/EmptyState';
import { spacing, typography } from '../../../constants/colors';
import { useColors } from '../../../hooks/useColors';
import { useWalletStore } from '../../../stores/wallet.store';
import type { Transaction } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function TransactionRow({ txn }: { txn: Transaction }) {
  const colors = useColors();
  const isCredit = txn.amount > 0;
  return (
    <View style={[styles.txnRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.txnIcon, { backgroundColor: isCredit ? colors.successDim : colors.errorDim }]}>
        <Feather
          name={isCredit ? 'arrow-down-left' : 'arrow-up-right'}
          size={16}
          color={isCredit ? colors.success : colors.error}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyMedium, { color: colors.foreground }]} numberOfLines={1}>
          {txn.description}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{formatDate(txn.created_at)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[typography.bodySemiBold, { color: isCredit ? colors.success : colors.error }]}>
          {isCredit ? '+' : ''}₦{Math.abs(txn.amount).toLocaleString()}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          ₦{txn.balance_after.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [balance, setBalance] = React.useState(0);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchWalletData = async () => {
    if (!user?.id) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (profile) setBalance(profile.wallet_balance);
      if (txns) setTransactions(txns);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchWalletData();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <FlatList
      style={{ backgroundColor: colors.background, width: '100%', maxWidth: 1280, alignSelf: 'center' }}
      data={transactions}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => <TransactionRow txn={item} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <EmptyState
          icon="credit-card"
          title="No transactions yet"
          description="add funds to your wallet to get started"
        />
      }
      ListHeaderComponent={
        <View>
          {/* Balance card */}
          <View
            style={[
              styles.balanceCard,
              { backgroundColor: colors.primary, paddingTop: topPad + spacing.xl },
            ]}
          >
            <Text style={[typography.label, { color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }]}>
              Wallet Balance
            </Text>
            <Text style={[typography.hero, { color: '#FFFFFF', fontSize: 40, lineHeight: 48, fontFamily: 'Inter_700Bold' }]}>
              ₦{user?.wallet_balance?.toLocaleString() ?? '0'}
            </Text>
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.6)' }]}>
              available for purchases
            </Text>
          </View>

          {/* Quick actions */}
          <View style={[styles.actionsRow, { paddingHorizontal: spacing.lg }]}>
            <Pressable
              onPress={() => router.push('/(customer)/wallet/add-funds')}
              style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primaryDim }]}>
                <Feather name="plus" size={20} color={colors.primary} />
              </View>
              <Text style={[typography.captionMedium, { color: colors.foreground }]}>Add Funds</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(customer)/wallet/transfer')}
              style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.elevated }]}>
                <Feather name="send" size={20} color={colors.textSecondary} />
              </View>
              <Text style={[typography.captionMedium, { color: colors.foreground }]}>Transfer</Text>
            </Pressable>
            <Pressable
              onPress={() => {}}
              style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.elevated }]}>
                <Feather name="activity" size={20} color={colors.textSecondary} />
              </View>
              <Text style={[typography.captionMedium, { color: colors.foreground }]}>History</Text>
            </Pressable>
          </View>

          {/* Referral banner */}
          <View style={[styles.referralBanner, { backgroundColor: colors.surface, marginHorizontal: spacing.lg }]}>
            <Feather name="gift" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, { color: colors.foreground }]}>Refer 1 friend</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                earn ₦500 when they place their first order
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>

          <Text style={[typography.bodyMedium, { color: colors.foreground, paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
            Recent Transactions
          </Text>
        </View>
      }
      contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 14,
    gap: spacing.sm,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  referralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.md,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  txnIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
