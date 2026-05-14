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
  TextInput,
  View,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Button } from '../../../components/ui/Button';
import { spacing, typography } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useColors } from '../../../hooks/useColors';
import { generatePaymentReference, toKobo } from '../../../lib/paystack';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/ui/Toast';

const PAYSTACK_CALLBACK = 'https://standard.paystack.co/close';

export default function AddFundsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [webviewLoading, setWebviewLoading] = useState(true);

  const handleFunding = async () => {
    const fundAmount = parseFloat(amount);
    if (isNaN(fundAmount) || fundAmount < 100) {
      showToast('Minimum funding amount is ₦100', 'error');
      return;
    }

    setLoading(true);
    try {
      const reference = generatePaymentReference();
      const email = user?.email ?? 'customer@chopquick.com';

      const { data, error } = await supabase.functions.invoke('initialize-transaction', {
        body: {
          email,
          amount: toKobo(fundAmount),
          reference,
          metadata: { user_id: user?.id, type: 'wallet_funding' },
        },
      });

      if (error || !data?.authorization_url) {
        showToast(error?.message ?? 'Could not initialize payment', 'error');
        return;
      }

      setAuthUrl(data.authorization_url);
    } catch {
      showToast('Could not initialize payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationChange = (navState: { url: string }) => {
    if (navState.url.startsWith(PAYSTACK_CALLBACK)) {
      setAuthUrl(null);
      showToast('Your payment is being processed. Your balance will update shortly.', 'success');
      router.back();
    }
  };

  return (
    <>
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

            <View style={[styles.amountInputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.currencySymbol, { color: colors.textMuted }]}>₦</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.placeholder}
                style={[styles.amountInput, { color: colors.foreground }]}
              />
            </View>

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

      {/* Paystack WebView Modal */}
      <Modal visible={!!authUrl} animationType="slide" onRequestClose={() => setAuthUrl(null)}>
        <View style={[styles.webviewContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
          <View style={[styles.webviewHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setAuthUrl(null)} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[typography.bodySemiBold, { color: colors.foreground }]}>Secure Payment</Text>
            <View style={{ width: 40 }} />
          </View>

          {webviewLoading && (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={StyleSheet.absoluteFill}
            />
          )}

          {authUrl && (
            <WebView
              source={{ uri: authUrl }}
              onNavigationStateChange={handleNavigationChange}
              onLoadStart={() => setWebviewLoading(true)}
              onLoadEnd={() => setWebviewLoading(false)}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Modal>
    </>
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
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 64,
    width: '100%',
  },
  currencySymbol: { fontSize: 24, marginRight: 4 },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
  },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  footer: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  webviewContainer: { flex: 1 },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});