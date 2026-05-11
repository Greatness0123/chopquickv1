// Deal detail sceen — shows full listing info + checkout
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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
import { CountdownTimer } from '../../../components/ui/CountdownTimer';
import { PriceDisplay } from '../../../components/ui/PriceDisplay';
import { MOCK_LISTINGS } from '../../../constants/mockData';
import { spacing, typography } from '../../../constants/colors';
import { useColors } from '../../../hooks/useColors';
import { generateCollectionCode, encodeQRPayload } from '../../../lib/qr';
import { generatePaymentReference } from '../../../lib/paystack';
import { useCartStore } from '../../../stores/cart.store';
import { useWalletStore } from '../../../stores/wallet.store';
import { useAuthStore } from '../../../stores/auth.store';
import type { Order } from '../../../types';

export default function ListingDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { addToCart } = useCartStore();
  const { balance, debit } = useWalletStore();
  const { user } = useAuthStore();

  const listing = MOCK_LISTINGS.find((l) => l.id === listingId);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [paying, setPaying] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!listing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 40 }]}>
          Listing not found
        </Text>
      </View>
    );
  }

  const total = listing.current_price * quantity;
  const maxQty = Math.min(listing.portions_remaining, 5);

  const handleCheckout = async () => {
    if (paymentMethod === 'wallet' && balance < total) {
      Alert.alert('insufficient Balance', `You need ₦${total.toLocaleString()} but your balance is ₦${balance.toLocaleString()}. Top Wallet to top up.`);
      return;
    }
    setPaying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate payment processing
      await new Promise((r) => setTimeout(r, 2000));

      const collectionCode = generateCollectionCode();
      const expiresAt = listing.expires_at;
      const qrPayload = encodeQRPayload({
        order_id: `ord-${Date.now()}`,
        collection_code: collectionCode,
        restaurant_id: listing.restaurant_id,
        customer_id: user?.id ?? 'user-001',
        amount: total,
        expires_at: expiresAt,
      });

      if (paymentMethod === 'wallet') {
        debit(total, `order — ${listing.food_name} x${quantity}`);
      }

      const order: Order = {
        id: `ord-${Date.now()}`,
        customer_id: user?.id ?? 'user-001',
        listing_id: listing.id,
        restaurant_id: listing.restaurant_id,
        quantity,
        unit_price: listing.current_price,
        total_amount: total,
        payment_method: paymentMethod,
        payment_status: 'paid',
        payment_reference: generatePaymentReference(),
        qr_payload: qrPayload,
        collection_code: collectionCode,
        order_status: 'confirmed',
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        listing,
        restaurant: listing.restaurant,
      };

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCompletedOrder(order);
    } finally {
      setPaying(false);
    }
  };

  // QR sceen after successful payment
  if (completedOrder) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[styles.qrContent, { paddingTop: topPad + spacing.md, paddingBottom: bottomPad + spacing.xl }]}
        >
          <View style={styles.qrHeader}>
            <Pressable onPress={() => router.replace('/(customer)/orders')} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[typography.h4, { color: colors.foreground }]}>order Confirmed</Text>
            <View style={{ width: 40 }} />
          </View>
          <QRCodeDisplay order={completedOrder} onExpire={() => {}} />
          <Button
            label="View all orders"
            onPress={() => router.replace('/(customer)/orders')}
            variant="secondary"
          />
        </ScrollView>
      </View>
    );
  }

  const isSoldOut = listing.portions_remaining === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.imageWrap}>
          <Image
            source={listing.image_url ?? require('@/assets/images/food_placeholder.png')}
            style={styles.image}
            contentFit="cover"
          />
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.5)', top: topPad + 10 }]}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.imageBadges}>
            {listing.is_last_one && <Badge variant="last_one" />}
            {isSoldOut ? <Badge variant="sold_out" /> : <Badge variant="live" dot />}
          </View>
        </View>

        <View style={styles.body}>
          {/* Restaurant info */}
          <View style={[styles.restRow, { backgroundColor: colors.surface }]}>
            <Feather name="home" size={16} color={colors.textSecondary} />
            <Text style={[typography.bodyMedium, { color: colors.foreground, flex: 1 }]}>
              {listing.restaurant?.name}
            </Text>
            <View style={styles.ratingBadge}>
              <Feather name="star" size={12} color="#Fu9E0B" />
              <Text style={[typography.captionMedium, { color: colors.foreground }]}>
                {listing.restaurant?.rating ?? '4.8'}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[typography.h2, { color: colors.foreground }]}>{listing.food_name}</Text>

          {/* Price */}
          <PriceDisplay
            originalPrice={listing.original_price}
            currentPrice={listing.current_price}
            discountPercent={listing.discount_percent}
            size="lg"
          />

          {/* Countdown */}
          <View style={[styles.timerRow, { backgroundColor: colors.surface }]}>
            <Feather name="clock" size={16} color={colors.warning} />
            <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>expires in:</Text>
            <CountdownTimer expiresAt={listing.expires_at} compact />
            <Text style={[typography.caption, { color: colors.textMuted }]}>·</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {listing.portions_remaining} portions left
            </Text>
          </View>

          {/* Description */}
          {listing.description && (
            <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
              {listing.description}
            </Text>
          )}

          {/* allergen */}
          {listing.allergen_note && (
            <View style={[styles.allergenRow, { backgroundColor: colors.warningDim }]}>
              <Feather name="alert-triangle" size={14} color={colors.warning} />
              <Text style={[typography.caption, { color: colors.warning }]}>{listing.allergen_note}</Text>
            </View>
          )}

          {/* Quantity selector */}
          {!isSoldOut && (
            <View style={styles.qtyRow}>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Quantity</Text>
              <View style={styles.qtyControl}>
                <Pressable
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={[styles.qtyBtn, { backgroundColor: colors.surface }]}
                >
                  <Feather name="minus" size={18} color={colors.foreground} />
                </Pressable>
                <Text style={[typography.h4, { color: colors.foreground, minWidth: 32, textAlign: 'center' }]}>
                  {quantity}
                </Text>
                <Pressable
                  onPress={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  style={[styles.qtyBtn, { backgroundColor: colors.surface }]}
                >
                  <Feather name="plus" size={18} color={colors.foreground} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Payment method */}
          {!isSoldOut && (
            <View style={styles.payRow}>
              {(['wallet', 'card'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setPaymentMethod(m)}
                  style={[
                    styles.payMethod,
                    {
                      backgroundColor: paymentMethod === m ? colors.primaryDim : colors.surface,
                      borderColor: paymentMethod === m ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={m === 'wallet' ? 'credit-card' : 'smartphone'}
                    size={16}
                    color={paymentMethod === m ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[typography.captionMedium, { color: paymentMethod === m ? colors.primary : colors.textSecondary }]}>
                    {m === 'wallet' ? `Wallet (₦${balance.toLocaleString()})` : 'Card'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky checkout footer */}
      {!isSoldOut && (
        <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: bottomPad + spacing.md, borderTopColor: colors.border }]}>
          <View>
            <Text style={[typography.caption, { color: colors.textMuted }]}>Total</Text>
            <Text style={[typography.h3, { color: colors.primary }]}>₦{total.toLocaleString()}</Text>
          </View>
          <Button
            label={paying ? 'Processing...' : `Pay ₦${total.toLocaleString()}`}
            onPress={handleCheckout}
            loading={paying}
            fullWidth={false}
            style={{ paddingHorizontal: 32, flex: 1 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 260 },
  backBtn: {
    position: 'absolute', left: 16,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  imageBadges: { position: 'absolute', bottom: 12, left: 16, flexDirection: 'row', gap: 6 },
  body: { padding: spacing.lg, gap: spacing.lg },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
  },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    flexWrap: 'wrap',
  },
  allergenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  payRow: { flexDirection: 'row', gap: spacing.md },
  payMethod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  qrContent: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
