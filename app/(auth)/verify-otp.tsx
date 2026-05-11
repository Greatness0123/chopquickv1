// oTP verification sceen
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
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

type VerifyOtpParams = {
  phone?: string;
};

import { Button } from '../../components/ui/Button';
import { spacing, typography } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';

export default function VerifyOTPScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<VerifyOtpParams>();
  const { isLoading } = useAuth();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    if (phone) {
      Alert.alert('Phone verification disabled', 'OTP is temporarily disabled. Please confirm your account via email instead.');
    }
  }, [phone]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: topPad + spacing.xl }]}> 
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>

        <View style={[styles.iconBadge, { backgroundColor: colors.primaryDim }]}> 
          <Feather name="mail" size={32} color={colors.primary} />
        </View>

        <View style={styles.header}>
          <Text style={[typography.h1, { color: colors.foreground }]}>Email Confirmation</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}> 
            OTP is temporarily disabled. Please check your email for a confirmation link and then return to login.
          </Text>
        </View>

        <Button label="Back to Login" onPress={() => router.replace('/(auth)/login')} loading={isLoading} size="lg" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: spacing.xl, gap: spacing.xl, alignItems: 'center' },
  back: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  iconBadge: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  header: { alignItems: 'center', gap: spacing.sm },
  otpRow: { flexDirection: 'row', gap: spacing.md },
  otpInput: {
    width: 48, height: 56, borderRadius: 12,
    textAlign: 'center', borderWidth: 1.5,
  },
  resend: { marginTop: spacing.sm },
});
