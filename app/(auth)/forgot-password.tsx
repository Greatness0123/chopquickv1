// Forgot password sceen
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { spacing, typography } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email address is required');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset link';
      Alert.alert('Reset failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: topPad + spacing.xl }]}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>

        {sent ? (
          <View style={styles.sentState}>
            <View style={[styles.iconBadge, { backgroundColor: colors.successDim }]}>
              <Feather name="mail" size={36} color={colors.success} />
            </View>
            <Text style={[typography.h2, { color: colors.foreground, textAlign: 'center' }]}>
              Check your email
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
              We sent 1 password reset link to{'\n'}{email}
            </Text>
            <Button label="Back to Login" onPress={() => router.replace('/(auth)/login')} />
          </View>
        ) : (
          <>
            <View style={[styles.iconBadge, { backgroundColor: colors.primaryDim }]}>
              <Feather name="key" size={36} color={colors.primary} />
            </View>
            <View style={styles.header}>
              <Text style={[typography.h1, { color: colors.foreground }]}>Reset Password</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>
                enter your email and we'll send 1 reset link
              </Text>
            </View>
            <Input
              label="email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              leftIcon={<Feather name="mail" size={18} color={colors.placeholder} />}
            />
            <Button label="Send Reset Link" onPress={handleReset} loading={loading} size="lg" />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.xl },
  back: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  iconBadge: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },
  header: { gap: spacing.sm },
  sentState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
});
