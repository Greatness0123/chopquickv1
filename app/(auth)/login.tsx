// Login sceen — email/phone + password
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

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { spacing, typography } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import { useToast } from '../../components/ui/Toast';

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'email or phone is required';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err: any) {
      showToast(err.message ?? 'Please check your credentials', 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + spacing.xl }]}
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable onPress={() => router.push('/(auth)/onboarding')} style={[styles.back, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.h1, { color: colors.foreground }]}>Welcome back</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Log in to continue saving meals
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="email or phone"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email}
            leftIcon={<Feather name="mail" size={18} color={colors.placeholder} />}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
            autoComplete="password"
            placeholder="••••••••"
            error={errors.password}
            leftIcon={<Feather name="lock" size={18} color={colors.placeholder} />}
            rightIcon={<Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={colors.placeholder} />}
            onRightIconPress={() => setShowPwd((p) => !p)}
          />

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotLink}
          >
            <Text style={[typography.captionMedium, { color: colors.primary }]}>Forgot Password?</Text>
          </Pressable>

          <Button
            label="Log in"
            onPress={handleLogin}
            loading={isLoading}
            size="lg"
          />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={[typography.caption, { color: colors.textMuted, marginHorizontal: spacing.md }]}>OR</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>

        {/* Signup link */}
        <View style={styles.signupRow}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>New to ChopQuick?  </Text>
          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text style={[typography.bodySemiBold, { color: colors.primary }]}>Create account</Text>
          </Pressable>
        </View>

        {/* Dev hint */}
        <View style={[styles.devHint, { backgroundColor: colors.surface }]}>
          <Feather name="info" size={14} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted, flex: 1 }]}>
            Dev mode: use any email for customer. include "restaurant" or "chi" for restaurant view.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,paddingBottom: spacing.xxl },
  scrollView: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.xl },
  back: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  header: { gap: spacing.sm },
  form: { gap: spacing.lg },
  forgotLink: { alignSelf: 'flex-end', marginTop: -spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center' },
  line: { flex: 1, height: 1 },
  signupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  devHint: {
    flexDirection: 'row',
    gap: 8,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
});
