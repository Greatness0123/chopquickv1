// Restaurant listing card — shows individual surplus item
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import type { Listing } from '../../types';
import { Badge } from '../ui/Badge';
import { CountdownTimer } from '../ui/CountdownTimer';
import { PriceDisplay } from '../ui/PriceDisplay';

interface ListingCardProps {
  listing: Listing;
  onEdit?: () => void;
  onToggle?: () => void;
  onRelist?: () => void;
}

export function ListingCard({ listing, onEdit, onToggle, onRelist }: ListingCardProps) {
  const colors = useColors();
  const now = new Date().toISOString();
  const isSoldOut = listing.portions_remaining === 0;
  const isLive = listing.status === 'live' && listing.expires_at > now;
  const isExpired = listing.status === 'live' && listing.expires_at <= now;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        {/* Info */}
        <View style={styles.info}>
          <Text style={[typography.h4, { color: colors.foreground }]} numberOfLines={1}>
            {listing.food_name}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {listing.portions_remaining} / {listing.portions_total} portions
          </Text>
          <PriceDisplay
            originalPrice={listing.original_price}
            currentPrice={listing.current_price}
            discountPercent={listing.discount_percent}
            size="sm"
          />
        </View>

        {/* Status */}
        <View style={styles.statusCol}>
          {isSoldOut ? (
            <Badge variant="sold_out" />
          ) : isExpired ? (
            <Badge variant="expired" />
          ) : isLive ? (
            <Badge variant="live" dot />
          ) : (
            <Badge variant="pending" label="Scheduled" />
          )}
          <View style={styles.actions}>
            {onEdit && (
              <Pressable onPress={onEdit} style={[styles.actionBtn, { backgroundColor: colors.elevated }]}>
                <Feather name="edit-2" size={14} color={colors.textSecondary} />
              </Pressable>
            )}
            {onToggle && (
              <Pressable onPress={onToggle} style={[styles.actionBtn, { backgroundColor: colors.elevated }]}>
                <Feather name={isLive ? 'pause' : 'play'} size={14} color={colors.textSecondary} />
              </Pressable>
            )}
            {onRelist && isExpired && (
              <Pressable onPress={onRelist} style={[styles.actionBtn, { backgroundColor: colors.primaryDim }]}>
                <Feather name="refresh-cw" size={14} color={colors.primary} />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Countdown */}
      {isLive && (
        <View style={[styles.countdownRow, { borderTopColor: colors.border }]}>
          <Feather name="clock" size={12} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>Expires:</Text>
          <CountdownTimer expiresAt={listing.expires_at} compact />
          <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${(() => {
                    const now = Date.now();
                    const start = new Date(listing.goes_live_at).getTime();
                    const end = new Date(listing.expires_at).getTime();
                    if (end <= start) return 0;
                    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
                  })()}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  info: { flex: 1, gap: 4 },
  statusCol: { alignItems: 'flex-end', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  progressBg: { flex: 1, height: 3, borderRadius: 2 },
  progressFill: { height: 3, borderRadius: 2 },
});