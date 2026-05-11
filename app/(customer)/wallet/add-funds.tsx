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
      const koboAmount = toKobo(fundAmount);

      // In a real Direct API integration, you would call your backend to initialize the transaction
      // and get an authorization URL. For this demo, we'll simulate the flow.

      const authUrl = `https://checkout.paystack.com/simulate?amount=${koboAmount}&email=${email}&reference=${reference}&key=${PAYSTACK_PUBLIC_KEY}`;

      Alert.alert(
        'Initialize Payment',
        `You are about to fund your wallet with ₦${fundAmount.toLocaleString()}`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
          {
            text: 'Pay Now',
            onPress: async () => {
              // Simulating WebBrowser opening for payment
              // In production: await WebBrowser.openBrowserAsync(authUrl);
              Alert.alert('Payment Simulated', 'In a real environment, this would open Paystack Checkout. Once successful, your balance will update via webhook.');
              setLoading(false);
            }
          }
        ]
      );
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Could not initialize payment');
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
            style={[typography.h2, { textAlign: 'center', height: 60 }]}
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
