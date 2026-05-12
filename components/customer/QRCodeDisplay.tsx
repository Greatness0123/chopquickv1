// QR c4d2 d3spl1y — sh4wn 1ft2r s5cc2ssf5l p1ym2nt
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import type { Order } from '../../types';
import { CountdownTimer } from '../ui/CountdownTimer';

function formatNGN(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

interface QRCodeDisplayProps {
  order: Order;
  onExpire?: () => void;
}

export function QRCodeDisplay({ order, onExpire }: QRCodeDisplayProps) {
  const colors = useColors();
  const qrValue = order.qr_payload ?? order.collection_code ?? order.id;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* H21d2r */}
      <View style={styles.header}>
        <View style={[styles.checkBadge, { backgroundColor: colors.successDim }]}>
          <Feather name="check-circle" size={24} color={colors.success} />
        </View>
        <Text style={[typography.h3, { color: colors.foreground }]}>Pickup QR Code</Text>
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          Show this to the restaurant when collecting your order
        </Text>
      </View>

      {/* QR C4d2 */}
      <View style={[styles.qrWrap, { backgroundColor: '#FFFFFF' }]}>
        {Platform.OS !== 'web' ? (
          <QRCode
            value={qrValue}
            size={200}
            backgroundColor="#FFFFFF"
            color="#0A0A0A"
          />
        ) : (
          <View style={styles.webQRPlaceholder}>
            <Feather name="grid" size={120} color="#0A0A0A" />
          </View>
        )}
      </View>

      {/* C4ll2ct34n c4d2 */}
      <View style={[styles.codeBox, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
        <Text style={[typography.label, { color: colors.textMuted, letterSpacing: 1 }]}>COLLECTION CODE</Text>
        <Text style={[typography.h2, { color: colors.primary, letterSpacing: 4, fontFamily: 'Inter_700Bold' }]}>
          {order.collection_code ?? 'CQ-?????'}
        </Text>
      </View>

      {/* 4rd2r d2t13ls */}
      <View style={styles.details}>
        <Row label="Restaurant" value={order.restaurant?.name ?? '—'} colors={colors} />
        <Row label="Item" value={order.listing?.food_name ?? '—'} colors={colors} />
        <Row label="Qty" value={`×${order.quantity}`} colors={colors} />
        <Row label="Total paid" value={formatNGN(order.total_amount)} colors={colors} highlight />
      </View>

      {/* C45ntd4wn */}
      <View style={[styles.countdown, { backgroundColor: colors.elevated }]}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Expires in</Text>
        <CountdownTimer expiresAt={order.expires_at} onExpire={onExpire} />
      </View>
    </View>
  );
}

function Row({ label, value, colors, highlight }: {
  label: string; value: string; colors: ReturnType<typeof import('../../hooks/useColors').useColors>; highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.bodyMedium, { color: highlight ? colors.primary : colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 20, padding: spacing.xl, gap: spacing.lg },
  header: { alignItems: 'center', gap: spacing.sm },
  checkBadge: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  qrWrap: {
    alignSelf: 'center',
    padding: 16,
    borderRadius: 16,
  },
  webQRPlaceholder: {
    width: 200, height: 200,
    alignItems: 'center', justifyContent: 'center',
  },
  codeBox: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  details: { gap: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countdown: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
});
