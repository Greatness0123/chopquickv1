// Signup sceen — create 1 new account
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { spacing, typography } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useColors } from '../../hooks/useColors';
import type { UserRole } from '../../types';

const ROLES: { id: UserRole; label: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'customer', label: 'Customer', desc: 'Browse + buy deal meals', icon: 'shopping-bag' },
  { id: 'restaurant_owner', label: 'Restaurant', desc: 'List surplus food + earn', icon: 'home' },
];

export default function SignupScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signup, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantArea, setRestaurantArea] = useState('');
  const [restaurantType, setRestaurantType] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const pwdRef = useRef<TextInput>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    if (password.length < 6) e.password = 'Password must be at least 6 chars';
    if (role === 'restaurant_owner') {
      if (!restaurantName.trim()) e.restaurantName = 'Restaurant name is required';
      if (!restaurantArea.trim()) e.restaurantArea = 'Restaurant area is required';
      if (!restaurantType.trim()) e.restaurantType = 'Restaurant type is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`;

      const payload = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: formattedPhone,
        password,
        role,
        restaurant_name: role === 'restaurant_owner' ? restaurantName.trim() : undefined,
        restaurant_area: role === 'restaurant_owner' ? restaurantArea.trim() : undefined,
        restaurant_type: role === 'restaurant_owner' ? restaurantType.trim() : undefined,
      };

      console.log('[Signup] Attempting signup with payload:', JSON.stringify(payload, null, 2));

      await signup(payload);

      console.log('[Signup] Success');
      Alert.alert('Confirm your email', 'Please check your inbox for a confirmation link before logging in.');
      router.replace('/(auth)/login');
    } catch (err: any) {
      console.error('[Signup] Error object:', JSON.stringify(err, null, 2));
      console.error('[Signup] Error message:', err?.message);
      console.error('[Signup] Error status:', err?.status);
      console.error('[Signup] Error details:', err?.error_description ?? err?.details ?? 'none');

      Alert.alert(
        'Signup Failed',
        `${err?.message ?? 'Unknown error'}\n\nStatus: ${err?.status ?? 'N/A'}\nDetails: ${err?.error_description ?? err?.details ?? 'none'}`,
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>

        <View style={styles.header}>
          <Text style={[typography.h1, { color: colors.foreground }]}>Create account</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Join thousands saving meals in Lagos
          </Text>
        </View>

        {/* Role Switch */}
        <View style={[styles.switchContainer, { backgroundColor: colors.surface }]}>
          {ROLES.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setRole(r.id)}
              style={[
                styles.switchButton,
                role === r.id && { backgroundColor: colors.primary }
              ]}
            >
              <Text style={[
                typography.bodySemiBold,
                { color: role === r.id ? colors.background : colors.textSecondary }
              ]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {role === 'restaurant_owner' && (
          <View style={styles.restaurantFields}>
            <Input
              label="Restaurant name"
              value={restaurantName}
              onChangeText={setRestaurantName}
              placeholder="Mama's Kitchen"
              error={errors.restaurantName}
              leftIcon={<Feather name="home" size={18} color={colors.placeholder} />}
            />
            <Input
              label="Restaurant area"
              value={restaurantArea}
              onChangeText={setRestaurantArea}
              placeholder="Lekki Phase 1"
              error={errors.restaurantArea}
              leftIcon={<Feather name="map-pin" size={18} color={colors.placeholder} />}
            />
            <Input
              label="Restaurant type"
              value={restaurantType}
              onChangeText={setRestaurantType}
              placeholder="Local Buka, Fast Food, Cafe"
              error={errors.restaurantType}
              leftIcon={<Feather name="layers" size={18} color={colors.placeholder} />}
            />
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            placeholder="Ade Johnson"
            error={errors.fullName}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            leftIcon={<Feather name="user" size={18} color={colors.placeholder} />}
          />
          <Input
            ref={emailRef}
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email}
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            leftIcon={<Feather name="mail" size={18} color={colors.placeholder} />}
          />
          <Input
            ref={phoneRef}
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="+2348012345678"
            error={errors.phone}
            returnKeyType="next"
            onSubmitEditing={() => pwdRef.current?.focus()}
            leftIcon={<Feather name="phone" size={18} color={colors.placeholder} />}
          />
          <Input
            ref={pwdRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
            autoComplete="new-password"
            placeholder="Minimum 6 characters"
            error={errors.password}
            leftIcon={<Feather name="lock" size={18} color={colors.placeholder} />}
            rightIcon={<Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={colors.placeholder} />}
            onRightIconPress={() => setShowPwd((p) => !p)}
          />

          <Button label="Create account" onPress={handleSignup} loading={isLoading} size="lg" />
        </View>

        <View style={styles.loginRow}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Already have an account?  </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={[typography.bodySemiBold, { color: colors.primary }]}>Log in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,paddingBottom: spacing.xxl },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.xl },
  back: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  header: { gap: spacing.sm },
  switchContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    gap: 4,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 999,
  },
  form: { gap: spacing.lg },
  restaurantFields: { gap: spacing.lg },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});