// Restaurant dashboard — daily stats, active listings, pending pickups
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingCard } from '../../../components/restaurant/ListingCard';
import { StatsCard } from '../../../components/restaurant/StatsCard';
import { Badge } from '../../../components/ui/Badge';
import { spacing, typography } from '../../../constants/colors';
import { MOCK_LISTINGS, MOCK_ORDERS } from '../../../constants/mockData';
import { useAuth } from '../../../context/AuthContext';
import { useColors } from '../../../hooks/useColors';

function formatNGN(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { restaurant, user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Filter mock data for this restaurant
  const myListings = useMemo(
    () => MOCK_LISTINGS.filter((l) => l.restaurant_id === (restaurant?.id ?? 'rest-001')),
    [restaurant]
  );

  const myOrders = useMemo(
    () => MOCK_ORDERS.filter((o) => o.restaurant_id === (restaurant?.id ?? 'rest-001')),
    [restaurant]
  );

  const activeListings = myListings.filter((l) => l.status === 'live');
  const pendingOrders = myOrders.filter((o) => o.order_status === 'confirmed');
  const todayRevenue = myOrders
    .filter((o) => o.order_status === 'collected')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const totalMealsSaved = myOrders.filter((o) => o.order_status === 'collected').length;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Welcome back
            </Text>
            <Text style={[typography.h3, { color: colors.foreground }]}>
              {restaurant?.name ?? 'owner'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(restaurant)/settings' as any)}
            style={[styles.avatarBtn, { backgroundColor: colors.surface }]}
          >
            <Feather name="user" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Today stats grid */}
        <View style={styles.statsRow}>
          <StatsCard
            label="ToDaY'S ReVeNue"
            value={formatNGN(todayRevenue || 24500)}
            subValue="+₦4,200 vs yesterday"
            color={colors.success}
            style={{ flex: 1 }}
          />
          <StatsCard
            label="Meals Saved"
            value={String(totalMealsSaved || 8)}
            subValue="orders collected"
            color={colors.primary}
            style={{ flex: 1 }}
          />
        </View>

        <View style={styles.statsRow}>
          <StatsCard
            label="aCTiVe LiSTiNGS"
            value={String(activeListings.length || 2)}
            subValue="live right now"
            style={{ flex: 1 }}
          />
          <StatsCard
            label="PeNDiNG PiCKuP"
            value={String(pendingOrders.length || 3)}
            subValue="awaiting collection"
            color={colors.warning}
            style={{ flex: 1 }}
          />
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <Pressable
            onPress={() => router.push('/(restaurant)/listings/new' as any)}
            style={[styles.newListingBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
            <Text style={[typography.bodySemiBold, { color: '#FFFFFF' }]}>New Listing</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(restaurant)/verify' as any)}
            style={[styles.scanBtn, { backgroundColor: colors.elevated, borderColor: colors.border }]}
          >
            <Feather name="camera" size={18} color={colors.foreground} />
            <Text style={[typography.bodyMedium, { color: colors.foreground }]}>Scan QR</Text>
          </Pressable>
        </View>

        {/* active listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.h4, { color: colors.foreground }]}>active Listings</Text>
            <Pressable onPress={() => router.push('/(restaurant)/listings' as any)}>
              <Text style={[typography.captionMedium, { color: colors.primary }]}>See all</Text>
            </Pressable>
          </View>
          {(activeListings.length > 0 ? activeListings : myListings).slice(0, 3).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
          {myListings.length === 0 && (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
              <Feather name="package" size={28} color={colors.textMuted} />
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                No listings yet
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Create your first surplus deal
              </Text>
            </View>
          )}
        </View>

        {/* Pending pickups */}
        <View style={styles.section}>
          <Text style={[typography.h4, { color: colors.foreground, marginBottom: spacing.sm }]}>
            Pending Pickups
          </Text>
          {(pendingOrders.length > 0 ? pendingOrders : myOrders).slice(0, 4).map((order) => (
            <View
              key={order.id}
              style={[styles.orderRow, { backgroundColor: colors.surface }]}
            >
              <View style={styles.orderLeft}>
                <Text style={[typography.bodyMedium, { color: colors.foreground }]}>
                  #{order.collection_code}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {order.listing?.food_name ?? 'Food item'} · {formatTime(order.created_at)}
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Badge variant="confirmed" />
                <Text style={[typography.captionMedium, { color: colors.primary }]}>
                  ₦{order.total_amount.toLocaleString('en-NG')}
                </Text>
              </View>
            </View>
          ))}
          {myOrders.length === 0 && (
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', padding: spacing.lg }]}>
              No pending pickups
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  quickActions: { flexDirection: 'row', gap: spacing.md },
  newListingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  scanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  emptyBox: {
    borderRadius: 14,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: 6,
  },
  orderLeft: { gap: 4 },
  orderRight: { alignItems: 'flex-end', gap: 6 },
});
