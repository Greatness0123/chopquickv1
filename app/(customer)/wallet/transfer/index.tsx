// Transfer funds screen — send money to another customer
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

import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { spacing, typography } from '../../../../constants/colors';
import { useAuth } from '../../../../context/AuthContext';
import { useColors } from '../../../../hooks/useColors';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../components/ui/Toast';
import { useDialog } from '../../../../components/ui/Dialog';

export default function TransferScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!user?.id) return;
    const transferAmount = parseFloat(amount);

    if (!recipientEmail || isNaN(transferAmount) || transferAmount <= 0) {
      showToast('Please enter valid recipient and amount', 'error');
      return;
    }

    if (transferAmount > (user.wallet_balance || 0)) {
      showToast('You do not have enough balance for this transfer', 'error');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Confirm Transfer',
      message: `Send ₦${transferAmount.toLocaleString()} to ${recipientEmail}?`,
      confirmText: 'Send',
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const { data: recipient, error: findError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', recipientEmail.trim().toLowerCase())
        .single();

      if (findError || !recipient) {
        throw new Error('Recipient not found');
      }

      if (recipient.id === user.id) {
        throw new Error('You cannot transfer to yourself');
      }

      const { error: debitError } = await supabase.rpc('transfer_funds', {
        sender_id: user.id,
        recipient_id: recipient.id,
        amount: transferAmount,
        memo: `Transfer to ${recipient.full_name}`
      });

      if (debitError) throw debitError;

      await refreshUser();
      showToast(`₦${transferAmount.toLocaleString()} sent to ${recipient.full_name}`, 'success');
      router.back();
    } catch (err: any) {
      showToast(err.message || 'Something went wrong', 'error');
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
          <Text style={[typography.h3, { color: colors.foreground }]}>Send Money</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.balanceInfo}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Available Balance</Text>
          <Text style={[typography.h2, { color: colors.primary }]}>₦{user?.wallet_balance?.toLocaleString() ?? '0'}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Recipient Email"
            value={recipientEmail}
            onChangeText={setRecipientEmail}
            placeholder="friend@example.com"
            autoCapitalize="none"
            leftIcon={<Feather name="user" size={18} color={colors.placeholder} />}
          />
          <Input
            label="Amount (₦)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="1000"
            leftIcon={<Feather name="credit-card" size={18} color={colors.placeholder} />}
          />

          <Button
            label="Transfer Now"
            onPress={handleTransfer}
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
});
