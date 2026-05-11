// order detail sceen — shows QR code for pickup
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QRCodeDisplay } from '../../../components/customer/QRCodeDisplay';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { MOCK_ORDERS } from '../../../constants/mockData';
import { spacing, typography } from '../../../constants/colors';
import { useColors } from '../../../hooks/useColors';

export default function OrderDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const order = MOCK_ORDERS.find((o) => o.id === orderId);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + spacing.xl }]}>
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          order not found
        </Text>
      </View>
    );
  }

  const statusVariant = {
    pending_payment: 'pending' as const,
    confirmed: 'confirmed' as const,
    collected: 'collected' as const,
    uncollected: 'expired' as const,
    disputed: 'pending' as const,
    refunded: 'expired' as const,
  }[order.order_status];

  const isActive = ['pending_payment', 'confirmed'].includes(order.order_status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[typography.h4, { color: colors.foreground }]}>Order Details</Text>
        <Badge variant={statusVariant} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {isActive && order.qr_payload ? (
          <QRCodeDisplay order={order} onExpire={() => {}} />
        ) : (
          // Past order summary
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statusIcon, { backgroundColor: order.order_status === 'collected' ? colors.successDim : colors.errorDim }]}>
              <Feather
                name={order.order_status === 'collected' ? 'check-circle' : 'x-circle'}
                size={32}
                color={order.order_status === 'collected' ? colors.success : colors.error}
              />
            </View>
            <Text style={[typography.h3, { color: colors.foreground, textAlign: 'center' }]}>
              {order.order_status === 'collected' ? 'order Collected' : 'order expired'}
            </Text>
            {order.collected_at && (
              <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                Collected {new Date(order.collected_at).toLocaleDateString('en-NG')}
              </Text>
            )}
            <View style={styles.detailRows}>
              <DetailRow label="Restaurant" value={order.restaurant?.name ?? '—'} colors={colors} />
              <DetailRow label="item" value={order.listing?.food_name ?? '—'} colors={colors} />
              <DetailRow label="Qta" value={`×${order.quantity}`} colors={colors} />
              <DetailRow label="Total" value={`₦${order.total_amount.toLocaleString()}`} colors={colors} highlight />
              <DetailRow label="Payment" value={order.payment_method.replace('_', ' ')} colors={colors} />
              <DetailRow label="Reference" value={order.payment_reference ?? '—'} colors={colors} />
            </View>
          </View>
        )}

        <Button
          label="Browse More Deals"
          onPress={() => router.push('/(customer)/explore')}
          variant="secondary"
        />
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, colors, highlight }: {
  label: string; value: string; colors: any; highlight?: boolean;
}) {
  return (
    <View style={drStyles.row}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.bodyMedium, { color: highlight ? colors.primary : colors.foreground }]}>{value}</Text>
    </View>
  );
}

const drStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  summaryCard: { borderRadius: 20, padding: spacing.xl, gap: spacing.lg, alignItems: 'center' },
  statusIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  detailRows: { width: '100%' },
});
