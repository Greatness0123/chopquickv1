// Wallet funding screen — pay via Paystack
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
import { generatePaymentReference, PAYSTACK_PUBLIC_KEY, toKobo } from '../../../lib/paystack';

import * as WebBrowser from 'expo-web-browser';

export default function AddFundsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFunding = async () => {
    const fundAmount = parseFloat(amount);
    if (isNaN(fundAmount) || fundAmount < 100) {
      Alert.alert('Error', 'Minimum funding amount is ₦100');
      return;
    }

    setLoading(true);
    try {
      const reference = generatePaymentReference();
      const email = user?.email || 'customer@chopquick.com';

      // SECURITY & FUNCTIONAL NOTE:
      // In production, you must call your backend to initialize a transaction
      // and get a secure 'authorization_url' or 'access_code'.
      // https://paystack.com/docs/payments/accept-payments/#initialize-transaction

      // For this demo, we'll use the simulation checkout if it's not configured,
      // or explain how to proceed with the real integration.
      const callbackUrl = 'https://standard.paystack.co/close';
      const authUrl = `https://checkout.paystack.com/${PAYSTACK_PUBLIC_KEY}?amount=${toKobo(fundAmount)}&email=${email}&reference=${reference}&callback_url=${callbackUrl}`;

      // If PAYSTACK_PUBLIC_KEY is missing, show an alert
      if (!PAYSTACK_PUBLIC_KEY) {
        Alert.alert(
          'Setup Required',
          'Please configure EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY to enable real payments.',
          [
            { text: 'Simulate Success', onPress: () => router.back() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, callbackUrl);

      if (result.type === 'success') {
        // In production, you'd verify the transaction on the backend via webhook
        // Here we'll simulate a successful update for the user experience
        Alert.alert('Payment Initialized', 'Your payment is being processed. Your balance will update shortly.');
        router.back();
      }
    } catch (err) {
      Alert.alert('Error', 'Could not initialize payment');
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
          <Text style={[typography.h3, { color: colors.foreground }]}>Add Funds</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Enter amount to fund</Text>
          <Input
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="1000"
            style={{ textAlign: 'center', fontSize: 24, height: 60 }}
          />

          <View style={styles.presets}>
            {[1000, 2000, 5000, 10000].map((val) => (
              <Pressable
                key={val}
                onPress={() => setAmount(val.toString())}
                style={[styles.presetBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[typography.captionMedium, { color: colors.foreground }]}>₦{val.toLocaleString()}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label="Continue with Paystack"
            onPress={handleFunding}
            loading={loading}
            size="lg"
          />
          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 16 }]}>
            Securely processed by Paystack
          </Text>
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
  card: { padding: spacing.xl, gap: spacing.lg, alignItems: 'center' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  footer: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
});
