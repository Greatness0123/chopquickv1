// Reports — revenue analytics and performance metrics
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatsCard } from '../../../components/restaurant/StatsCard';
import { spacing, typography } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useColors } from '../../../hooks/useColors';
import { supabase } from '../../../lib/supabase';

type Period = '7d' | '30d' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  all: 'all Time',
};


function formatNGN(n: number) {
  if (n >= 1000) return `₦${(n / 1000).toFixed(1)}k`;
  return `₦${n}`;
}

export default function ReportsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { restaurant } = useAuth();
  const [period, setPeriod] = useState<Period>('7d');
  const [orders, setOrders] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    if (!restaurant?.id) return;
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*,customer:profiles(full_name), listing:listings(*))')
        .eq('restaurant_id', restaurant.id);

      const { data: listingsData } = await supabase
        .from('listings')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      setOrders(ordersData || []);
      setListings(listingsData || []);
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReportsData();
  }, [restaurant?.id]);

  const collectedOrders = orders.filter((o) => o.order_status === 'collected');
  const totalRevenue = collectedOrders.reduce((s, o) => s + o.total_amount, 0);
  const totalOrders = collectedOrders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const cancelRate = orders.length > 0 ? Math.round((orders.filter(o => o.order_status === 'uncollected').length / orders.length) * 100) : 0;

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const data = days.map((day, idx) => {
      const dayOrders = collectedOrders.filter(o => {
        const d = new Date(o.created_at);
        return d.getDay() === idx && (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
      });
      return {
        day,
        revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0),
        orders: dayOrders.length
      };
    });
    // Rotate to start from 7 days ago
    const today = now.getDay();
    return [...data.slice(today + 1), ...data.slice(0, today + 1)];
  }, [collectedOrders]);

  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue), 1000);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.foreground }]}>Reports</Text>
        <Pressable
          onPress={() => router.push('/(restaurant)/withdraw' as any)}
          style={[styles.withdrawBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="arrow-up-right" size={14} color="#FFFFFF" />
          <Text style={[typography.captionMedium, { color: '#FFFFFF' }]}>Withdraw</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Period selector */}
        <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodBtn,
                period === p && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  typography.captionMedium,
                  { color: period === p ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {PERIOD_LABELS[p]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Key metrics */}
        <View style={styles.statsRow}>
          <StatsCard
            label="Total Revenue"
            value={`₦${totalRevenue.toLocaleString('en-NG')}`}
            subValue="+18% vs last period"
            color={colors.success}
            style={{ flex: 1 }}
          />
          <StatsCard
            label="Total Orders"
            value={String(totalOrders)}
            subValue="orders completed"
            style={{ flex: 1 }}
          />
        </View>

        <View style={styles.statsRow}>
          <StatsCard
            label="Avg Order Value"
            value={`₦${avgOrderValue.toLocaleString('en-NG')}`}
            style={{ flex: 1 }}
          />
          <StatsCard
            label="Cancel Rate"
            value={`${cancelRate}%`}
            subValue="of all orders"
            color={cancelRate > 10 ? colors.error : colors.foreground}
            style={{ flex: 1 }}
          />
        </View>

        {/* Revenue bar chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[typography.h4, { color: colors.foreground, marginBottom: spacing.lg }]}>
            Weekly Revenue
          </Text>
          <View style={styles.chart}>
            {weeklyData.map((d, i) => {
              const barHeight = Math.max(4, (d.revenue / maxRevenue) * 120);
              const isToday = i === weeklyData.length - 1;
              return (
                <View key={d.day} style={styles.barCol}>
                  <Text style={[typography.label, { color: colors.textMuted, marginBottom: 4 }]}>
                    {formatNGN(d.revenue)}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: isToday ? colors.primary : colors.elevated,
                        borderRadius: 6,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      typography.label,
                      { color: isToday ? colors.primary : colors.textMuted, marginTop: 6 },
                    ]}
                  >
                    {d.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top items */}
        <View style={[styles.topItemsCard, { backgroundColor: colors.surface }]}>
          <Text style={[typography.h4, { color: colors.foreground, marginBottom: spacing.md }]}>
            Top Selling items
          </Text>
          {listings.slice(0, 4).map((listing, idx) => (
            <View
              key={listing.id}
              style={[styles.topItemRow, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.rank, { backgroundColor: idx === 0 ? colors.primaryDim : colors.elevated }]}>
                <Text
                  style={[
                    typography.label,
                    { color: idx === 0 ? colors.primary : colors.textMuted },
                  ]}
                >
                  #{idx + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyMedium, { color: colors.foreground }]} numberOfLines={1}>
                  {listing.food_name}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {listing.portions_total - listing.portions_remaining} sold
                </Text>
              </View>
              <Text style={[typography.bodySemiBold, { color: colors.primary }]}>
                ₦{((listing.portions_total - listing.portions_remaining) * listing.current_price).toLocaleString('en-NG')}
              </Text>
            </View>
          ))}
        </View>

        {/* earnings summary */}
        <View style={[styles.earningsSummary, { backgroundColor: colors.surface }]}>
          <View style={styles.earningsRow}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Gross earnings</Text>
            <Text style={[typography.bodySemiBold, { color: colors.foreground }]}>
              ₦{totalRevenue.toLocaleString('en-NG')}
            </Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Platform fee (5%)</Text>
            <Text style={[typography.bodySemiBold, { color: colors.error }]}>
              -₦{Math.round(totalRevenue * 0.05).toLocaleString('en-NG')}
            </Text>
          </View>
          <View style={[styles.earningsRow, styles.netRow, { borderTopColor: colors.border }]}>
            <Text style={[typography.bodyMedium, { color: colors.foreground }]}>Net Payout</Text>
            <Text style={[typography.bodySemiBold, { color: colors.success }]}>
              ₦{Math.round(totalRevenue * 0.95).toLocaleString('en-NG')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 ,paddingBottom: spacing.xxl},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
  },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 120 },
  periodRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  chartCard: { borderRadius: 16, padding: spacing.lg },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 0,
  },
  bar: { width: '70%' },
  topItemsCard: { borderRadius: 16, padding: spacing.lg },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsSummary: { borderRadius: 16, padding: spacing.lg, gap: spacing.md },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netRow: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
});
