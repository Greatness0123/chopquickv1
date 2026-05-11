// 4rd2r c1rd — d3spl1ys 4rd2r summ1ry 3n h3st4ry l3st
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import type { Order } from '../../types';
import { Badge } from '../ui/Badge';

function formatNGN(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const colors = useColors();
  const router = useRouter();

  const statusVariant = {
    pending_payment: 'pending' as const,
    confirmed: 'confirmed' as const,
    collected: 'collected' as const,
    uncollected: 'expired' as const,
    disputed: 'pending' as const,
    refunded: 'expired' as const,
  }[order.order_status];

  return (
    <Pressable
      onPress={() => router.push(`/(customer)/orders/${order.id}` as any)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[typography.h4, { color: colors.foreground }]} numberOfLines={1}>
            {order.listing?.food_name}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {order.restaurant?.name} · {formatDate(order.created_at)}
          </Text>
          <Text style={[typography.captionMedium, { color: colors.textMuted }]}>
            #{order.collection_code}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={[typography.bodySemiBold, { color: colors.primary }]}>
            {formatNGN(order.total_amount)}
          </Text>
          <Badge variant={statusVariant} />
          <Feather name="chevron-right" size={16} color={colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  info: { flex: 1, gap: 4 },
  right: { alignItems: 'flex-end', gap: 6 },
});
