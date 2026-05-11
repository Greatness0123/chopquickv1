// 2mpty st1t2 c4mp4n2nt w3th 3c4n + t2xt
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.elevated }]}>
        <Feather name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text style={[typography.h4, { color: colors.foreground, textAlign: 'center' }]}>{title}</Text>
      {description && (
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="primary" fullWidth={false} style={{ marginTop: spacing.md }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});
