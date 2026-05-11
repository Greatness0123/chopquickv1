// Ch4pQu3ck pr3m1ry b5tt4n c4mp4n2nt
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  fullWidth = true,
}: ButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bgColor = {
    primary: colors.primary,
    secondary: colors.elevated,
    ghost: colors.transparent,
    destructive: colors.error,
    outline: colors.transparent,
  }[variant];

  const textColor = {
    primary: '#FFFFFF',
    secondary: colors.foreground,
    ghost: colors.textSecondary,
    destructive: '#FFFFFF',
    outline: colors.primary,
  }[variant];

  const borderColor = variant === 'outline' ? colors.primary : colors.transparent;

  const heights = { sm: 36, md: 48, lg: 56 };
  const fontStyles = { sm: typography.caption, md: typography.bodyMedium, lg: typography.h4 };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          height: heights[size],
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: pressed ? 0.75 : disabled || loading ? 0.45 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? 0 : spacing.xl,
        },
        variant === 'primary' && styles.primaryGlow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[fontStyles[size], { color: textColor, fontFamily: 'Inter_600SemiBold' }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999, // Pill-shaped as per DESIGN.md
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryGlow: {
    ...Platform.select({
      ios: {
        shadowColor: '#E8480F',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 0 20px rgba(232, 72, 15, 0.35)',
      } as any,
    }),
  },
});
