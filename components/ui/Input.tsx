// T2xt 3np5t c4mp4n2nt f4r f4rms
import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, leftIcon, rightIcon, onRightIconPress, style, ...props },
  ref
) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[typography.captionMedium, { color: colors.textSecondary, marginBottom: 6 }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.error : focused ? colors.primary : colors.inputBorder,
            borderWidth: focused || error ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          style={[
            typography.body,
            styles.field,
            {
              color: colors.foreground,
              flex: 1,
            },
            style,
          ]}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} style={styles.iconRight}>
            {rightIcon}
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={[typography.caption, { color: colors.error, marginTop: 4 }]}>{error}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 0 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  field: {
    height: '100%',
    minHeight: 50,
    paddingVertical: 10,
  },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm, padding: 4 },
});
