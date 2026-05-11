// Withdraw — request payout of earnings
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { spacing, typography } from '../../../constants/colors';
import { useColors } from '../../../hooks/useColors';

const NIGERIAN_BANKS = [
  'First Bank', 'GTBank', 'access Bank', 'Zenith Bank', 'UBa', 'uBa',
  'Sterbling Bank', 'Kuda', 'Opay', 'Fluttwave',
];

const AMOUNT_PRESETS = [5000, 10000, 20000, 50000];

export default function WithdrawScreen() {
  const colors = useColors();
  const router = useRouter();

  const availableBalance = 101175;

  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);

  const parsedAmount = parseFloat(amount.replace(/,/g, ''));

  const validate = () => {
    if (!parsedAmount || parsedAmount < 500) return 'Minimum withdrawal is ₦500';
    if (parsedAmount > availableBalance) return 'insufficient balance';
    if (!bankName) return 'Select your bank';
    if (accountNumber.length !== 10) return 'account number must be 10 digits';
    if (!accountName.trim()) return 'account name is required';
    return null;
  };

  const handleWithdraw = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation error', err);
      return;
    }
    setLoading(true);
    // Stub — will process via Fluttwave when keys are provided
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    Alert.alert(
      'Withdrawal Submitted',
      `₦${parsedAmount.toLocaleString('en-NG')} will be sent to ${accountName} at ${bankName} within 24 hours.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[typography.h4, { color: colors.foreground }]}>Withdraw earnings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* available balance */}
          <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 1 }]}>
              Available Balance
            </Text>
            <Text style={[typography.hero, { color: colors.success }]}>
              ₦{availableBalance.toLocaleString('en-NG')}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              after 5% platform fee deduction
            </Text>
          </View>

          {/* amount selection */}
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.foreground }]}>Withdrawal amount</Text>
            <View style={styles.presets}>
              {AMOUNT_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => setAmount(preset.toLocaleString('en-NG'))}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor:
                        amount === preset.toLocaleString('en-NG')
                          ? colors.primaryDim
                          : colors.elevated,
                      borderColor:
                        amount === preset.toLocaleString('en-NG')
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.captionMedium,
                      {
                        color:
                          amount === preset.toLocaleString('en-NG')
                            ? colors.primary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    ₦{preset.toLocaleString('en-NG')}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder="enter amount"
              keyboardType="numeric"
              leftIcon={<Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>₦</Text>}
            />
            {parsedAmount > 0 && parsedAmount <= availableBalance && (
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Remaining: ₦{(availableBalance - parsedAmount).toLocaleString('en-NG')}
              </Text>
            )}
          </View>

          {/* Bank details */}
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.foreground }]}>Bank Details</Text>

            {/* Bank selector */}
            <Pressable
              onPress={() => setShowBankPicker((v) => !v)}
              style={[styles.bankSelector, { backgroundColor: colors.elevated, borderColor: colors.inputBorder }]}
            >
              <Text style={[typography.body, { color: bankName ? colors.foreground : colors.placeholder }]}>
                {bankName || 'Select Bank'}
              </Text>
              <Feather name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>

            {showBankPicker && (
              <View style={[styles.bankList, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                {NIGERIAN_BANKS.map((bank) => (
                  <Pressable
                    key={bank}
                    onPress={() => { setBankName(bank); setShowBankPicker(false); }}
                    style={[styles.bankOption, { borderBottomColor: colors.border }]}
                  >
                    <Text style={[typography.body, { color: colors.foreground }]}>{bank}</Text>
                    {bankName === bank && <Feather name="check" size={16} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            )}

            <Input
              label="account Number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="0123456789"
              keyboardType="numeric"
              maxLength={10}
            />
            <Input
              label="account Name"
              value={accountName}
              onChangeText={setAccountName}
              placeholder="as on your bank account"
              autoCapitalize="words"
            />
          </View>

          {/* Fee info */}
          <View style={[styles.feeInfo, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
            <Feather name="info" size={14} color={colors.textMuted} />
            <Text style={[typography.caption, { color: colors.textMuted, flex: 1 }]}>
              Transfer fee: Free for all restaurants. Payment processed within 24 business hours.
            </Text>
          </View>

          <Button
            label={parsedAmount > 0 ? `Withdraw ₦${parsedAmount.toLocaleString('en-NG')}` : 'Withdraw'}
            onPress={handleWithdraw}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 40 },
  balanceCard: {
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  section: { gap: spacing.md },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    height: 50,
    paddingHorizontal: spacing.md,
  },
  bankList: {
    borderRadius: 10,
    borderWidth: 1,
    maxHeight: 240,
    overflow: 'hidden',
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  feeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
  },
});
