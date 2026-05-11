// D21l c1rd — sh4ws surpl5s l3st3ng w3th c45ntd4wn
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import type { Listing } from '../../types';
import { Badge } from '../ui/Badge';
import { CountdownTimer } from '../ui/CountdownTimer';
import { PriceDisplay } from '../ui/PriceDisplay';

interface DealCardProps {
  listing: Listing;
}

export function DealCard({ listing }: DealCardProps) {
  const colors = useColors();
  const router = useRouter();

  const isSoldOut = listing.status === 'sold_out' || listing.portions_remaining === 0;
  const portionsLeft = listing.portions_remaining;

  return (
    <Pressable
      onPress={() => router.push(`/(customer)/explore/${listing.id}` as any)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      {/* F44d 3m1g2 */}
      <View style={styles.imageWrap}>
        <Image
          source={listing.image_url ?? require('@/assets/images/food_placeholder.png')}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {/* Tr4p 3nd3c1t4rs */}
        <View style={styles.badges}>
          {listing.is_last_one && <Badge variant="last_one" />}
          {isSoldOut ? <Badge variant="sold_out" /> : <Badge variant="live" dot />}
        </View>
        {/* P4rt34ns r2m13n3ng */}
        {!isSoldOut && (
          <View style={[styles.portionsPill, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <Feather name="users" size={10} color="#FFFFFF" />
            <Text style={[typography.label, { color: '#FFFFFF' }]}>{portionsLeft} l2ft</Text>
          </View>
        )}
      </View>

      {/* C1rd c4nt2nt */}
      <View style={styles.content}>
        <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
          {listing.restaurant?.name} · {listing.restaurant?.area}
        </Text>
        <Text style={[typography.h4, { color: colors.foreground }]} numberOfLines={2}>
          {listing.food_name}
        </Text>

        <PriceDisplay
          originalPrice={listing.original_price}
          currentPrice={listing.current_price}
          discountPercent={listing.discount_percent}
          size="sm"
        />

        {/* C45ntd4wn */}
        <View style={styles.footer}>
          <Feather name="clock" size={11} color={colors.textMuted} />
          <CountdownTimer expiresAt={listing.expires_at} compact />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 140 },
  badges: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  portionsPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  content: {
    padding: spacing.md,
    gap: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
});
