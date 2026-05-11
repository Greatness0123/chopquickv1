// Withdraw funds screen — restaurant owners can withdraw to bank
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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

export default function WithdrawScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { restaurant, refreshUser } = useAuth();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 1000) {
      Alert.alert('Error', 'Minimum withdrawal is ₦1,000');
      return;
    }

    if (withdrawAmount > (restaurant?.restaurant_wallet_balance || 0)) {
      Alert.alert('Insufficient Funds', 'You do not have enough balance');
      return;
    }

    if (!restaurant?.bank_account_number) {
      Alert.alert('Missing Details', 'Please update your bank details in settings first');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('withdrawals').insert({
        restaurant_id: restaurant.id,
        amount: withdrawAmount,
        bank_name: restaurant.bank_name,
        bank_account_number: restaurant.bank_account_number,
        bank_account_name: restaurant.bank_account_name,
        status: 'pending',
      });

      if (error) throw error;

      await refreshUser();
      Alert.alert('Request Sent', 'Your withdrawal request has been submitted and will be processed within 24 hours.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not process withdrawal');
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
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.balanceInfo}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Available for Withdrawal</Text>
          <Text style={[typography.h2, { color: colors.success }]}>₦{restaurant?.restaurant_wallet_balance?.toLocaleString() ?? '0'}</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.bankCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="home" size={20} color={colors.primary} />
            <View>
              <Text style={[typography.bodySemiBold, { color: colors.foreground }]}>{restaurant?.bank_name ?? 'No Bank Set'}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{restaurant?.bank_account_number ?? '****'}</Text>
            </View>
          </View>

          <Input
            label="Amount (₦)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="1000"
            leftIcon={<Feather name="credit-card" size={18} color={colors.placeholder} />}
          />

          <Button
            label="Confirm Withdrawal"
            onPress={handleWithdraw}
            loading={loading}
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
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
  balanceInfo: { alignItems: 'center', marginVertical: spacing.xl },
  form: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
  },
});
