// Withdraw funds screen — request payout to bank account via Paystack
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { spacing, typography } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useColors } from '../../../hooks/useColors';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/ui/Toast';

const SUPABASE_URL = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? '';
const SUPABASE_ANON_KEY = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

// Nigerian bank codes (common ones used by Paystack)
const BANK_CODES: Record<string, string> = {
  'Access Bank': '00014',
  'GTBank': '00013',
  'Guaranty Trust Bank': '00013',
  'Zenith Bank': '00015',
  'UBA': '00023',
  'United Bank for Africa': '00023',
  'First Bank': '00016',
  'First Bank of Nigeria': '00016',
  'Ecobank Nigeria': '00010',
  'Ecobank': '00010',
  'Sterling Bank': '00021',
  'Fidelity Bank': '00018',
  'Heritage Bank': '00020',
  'Keystone Bank': '00022',
  'Polaris Bank': '00032',
  'Stanbic IBTC': '00012',
  'Union Bank of Nigeria': '00019',
  'Union Bank': '00019',
  'Wema Bank': '00017',
  'FCMB': '00009',
  'Jaiz Bank': '00026',
  'JAIZ Bank': '00026',
  'SunTrust Bank': '00027',
  'Nigerian International Bank': '00017',
};

export default function WithdrawScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { restaurant, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const available = restaurant?.total_revenue_recovered || 0;
  const withdrawAmount = parseFloat(amount);
  const parsed = isNaN(withdrawAmount) ? 0 : withdrawAmount;
  const isValid = parsed >= 1000 && parsed <= available;
  const hasBank = !!restaurant?.bank_account_number;
  const bankCode = restaurant?.bank_name ? (BANK_CODES[restaurant.bank_name] ?? '00000') : '00000';

  const handleWithdraw = async () => {
    if (!hasBank) {
      showToast('Please update your bank details in settings first', 'error');
      return;
    }
    if (!isValid) {
      if (parsed < 1000) {
        showToast('Minimum withdrawal is ₦1,000', 'error');
      } else {
        showToast('You do not have enough balance', 'error');
      }
      return;
    }

    setLoading(true);
    try {
      // Call the Supabase Edge Function to initiate Paystack transfer
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/paystack-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          amount: withdrawAmount,
          bank_name: restaurant.bank_name,
          bank_code: bankCode,
          bank_account_number: restaurant.bank_account_number,
          bank_account_name: restaurant.bank_account_name,
        }),
      });

      const result = await resp.json();

      if (!resp.ok || !result.success) {
        throw new Error(result.error || 'Failed to initiate withdrawal');
      }

      await refreshUser();
      showToast('Withdrawal submitted. Funds sent to your bank account.', 'success');
      setAmount('');
      router.push('/(restaurant)/withdraw/history' as any);
    } catch (err: any) {
      showToast(err.message || 'Could not process withdrawal', 'error');
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
          <Text style={[typography.h3, { color: colors.foreground }]}>Withdraw Funds</Text>
          <Pressable
            onPress={() => router.push('/(restaurant)/withdraw/history' as any)}
            style={[styles.historyBtn, { backgroundColor: colors.surface }]}
          >
            <Feather name="clock" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Available Balance</Text>
          <Text style={[typography.h2, { color: colors.success }]}>₦{available.toLocaleString('en-NG')}</Text>
          {available > 0 && (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
              Ready for withdrawal
            </Text>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted, flex: 1 }]}>
            Funds are transferred directly to your bank account immediately via Paystack.
            The available balance is deducted when the transfer completes.
          </Text>
        </View>

        <View style={[styles.section, { marginTop: spacing.lg }]}>
          <Text style={[typography.h4, { color: colors.foreground, marginBottom: spacing.sm }]}>Destination</Text>
          {hasBank ? (
            <View style={[styles.bankCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="home" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodySemiBold, { color: colors.foreground }]}>
                  {restaurant.bank_name}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {restaurant.bank_account_name}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  ···{restaurant.bank_account_number?.slice(-4)}
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(restaurant)/settings' as any)}>
                <Feather name="edit-2" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push('/(restaurant)/settings' as any)}
              style={[styles.bankCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Feather name="plus" size={20} color={colors.textMuted} />
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, flex: 1 }]}>
                Add bank account
              </Text>
              <Feather name="chevron-right" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <View style={[styles.section, { marginTop: spacing.lg }]}>
          <Text style={[typography.h4, { color: colors.foreground, marginBottom: spacing.sm }]}>Amount</Text>
          <Input
            label="Withdrawal Amount (₦)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Enter amount"
            leftIcon={<Feather name="credit-card" size={18} color={colors.placeholder} />}
          />
          {parsed > 0 && parsed < 1000 && (
            <Text style={[typography.caption, { color: colors.error, marginTop: 4 }]}>
              Minimum withdrawal is ₦1,000
            </Text>
          )}
          {parsed > available && (
            <Text style={[typography.caption, { color: colors.error, marginTop: 4 }]}>
              Amount exceeds available balance
            </Text>
          )}
          {parsed >= 1000 && parsed <= available && (
            <Text style={[typography.bodyMedium, { color: colors.success, marginTop: 4 }]}>
              You will receive ₦{parsed.toLocaleString('en-NG')} in your bank account
            </Text>
          )}
        </View>

        <Button
          label={loading ? 'Sending...' : 'Request Withdrawal'}
          onPress={handleWithdraw}
          loading={loading}
          disabled={!hasBank || !isValid}
          size="lg"
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', paddingBottom: spacing.xxl },
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
  historyBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  balanceCard: {
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
  },
  section: { paddingHorizontal: spacing.lg },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
  },
});