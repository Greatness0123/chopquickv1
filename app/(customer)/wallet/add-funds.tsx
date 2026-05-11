// add funds — top up wallet via card or bank transfer
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
import { useWalletStore } from '../../../stores/wallet.store';

const PRESETS = [500, 1000, 2000, 5000, 10000];
type PayMethod = 'card' | 'bank';

const PAY_METHODS: { key: PayMethod; label: string; icon: keyof typeof Feather.glyphMap; sub: string }[] = [
  { key: 'card', label: 'Debit / Credit Card', icon: 'credit-card', sub: 'Visa, Mastercard, Verve' },
  { key: 'bank', label: 'Bank Transfer', icon: 'briefcase', sub: 'Using USSD or internet banking' },
];

export default function AddFundsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { balance, credit } = useWalletStore();

  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>('card');
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;

  const selectPreset = (val: number) => {
    setAmount(val.toLocaleString('en-NG'));
  };

  const validate = () => {
    if (!parsedAmount || parsedAmount < 100) return 'Minimum funding is ₦100';
    if (parsedAmount > 500000) return 'Maximum 1 time is ₦500,000';
    return null;
  };

  const handleFund = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Invalid amount', err);
      return;
    }
    setLoading(true);
    // Stub — will invoke Paystack / Fluttwave when keys are provided
    await new Promise((r) => setTimeout(r, 1500));
    credit(parsedAmount, `Wallet funding via ${payMethod === 'card' ? 'card' : 'bank transfer'}`);
    setLoading(false);
    Alert.alert('Funds added!', `₦${parsedAmount.toLocaleString('en-NG')} has been added to your wallet.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
          <Text style={[typography.h4, { color: colors.foreground }]}>Add Funds</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Current balance */}
          <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 1 }]}>
              Current Balance
            </Text>
            <Text style={[typography.hero, { color: colors.foreground }]}>
              ₦{balance.toLocaleString('en-NG')}
            </Text>
          </View>

          {/* amount */}
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.foreground }]}>Select amount</Text>
            <View style={styles.presets}>
              {PRESETS.map((preset) => {
                const label = preset.toLocaleString('en-NG');
                const active = amount === label;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => selectPreset(preset)}
                    style={[
                      styles.presetBtn,
                      {
                        backgroundColor: active ? colors.primaryDim : colors.elevated,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.captionMedium,
                        { color: active ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      ₦{label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Input
              label="or enter custom amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
              leftIcon={
                <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>₦</Text>
              }
            />
            {parsedAmount >= 100 && (
              <View style={[styles.newBalanceBanner, { backgroundColor: colors.successDim }]}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={[typography.captionMedium, { color: colors.success }]}>
                  New balance: ₦{(balance + parsedAmount).toLocaleString('en-NG')}
                </Text>
              </View>
            )}
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.foreground }]}>Payment Method</Text>
            {PAY_METHODS.map((method) => {
              const active = payMethod === method.key;
              return (
                <Pressable
                  key={method.key}
                  onPress={() => setPayMethod(method.key)}
                  style={[
                    styles.methodCard,
                    {
                      backgroundColor: active ? colors.primaryDim : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.methodIcon,
                      { backgroundColor: active ? colors.primary : colors.elevated },
                    ]}
                  >
                    <Feather name={method.icon} size={18} color={active ? '#FFFFFF' : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: active ? colors.primary : colors.foreground }]}>
                      {method.label}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>{method.sub}</Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary : colors.transparent,
                      },
                    ]}
                  >
                    {active && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Security note */}
          <View style={[styles.securityNote, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
            <Feather name="lock" size={14} color={colors.textMuted} />
            <Text style={[typography.caption, { color: colors.textMuted, flex: 1 }]}>
              Payments are secured by Paystack and Fluttwave. Your card details are never stored.
            </Text>
          </View>

          <Button
            label={
              parsedAmount >= 100
                ? `Add ₦${parsedAmount.toLocaleString('en-NG')} to wallet`
                : 'Add Funds'
            }
            onPress={handleFund}
            loading={loading}
            disabled={parsedAmount < 100}
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
  newBalanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    borderRadius: 10,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
  },
});
