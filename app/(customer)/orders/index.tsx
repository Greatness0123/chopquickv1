// orders sceen — active + past orders
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderCard } from '../../../components/customer/OrderCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { spacing, typography } from '../../../constants/colors';
import { useColors } from '../../../hooks/useColors';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

const TABS = [
  { id: 'active', label: 'active' },
  { id: 'past', label: 'Past' },
];

export default function OrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const fetchOrders = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, listing:listings(*), restaurant:restaurants(*)')
        .eq('customer_id', user.id);

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const activeOrders = orders.filter((o) =>
    ['pending_payment', 'confirmed'].includes(o.order_status)
  );
  const pastOrders = orders.filter((o) =>
    ['collected', 'uncollected', 'refunded'].includes(o.order_status)
  );

  const currentOrders = tab === 'active' ? activeOrders : pastOrders;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + spacing.md }]}>
        <Text style={[typography.h2, { color: colors.foreground }]}>My Orders</Text>
        <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id as 'active' | 'past')}
              style={[
                styles.tabBtn,
                tab === t.id && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  typography.captionMedium,
                  { color: tab === t.id ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {t.label}
              </Text>
              {t.id === 'active' && activeOrders.length > 0 && (
                <View style={[styles.badge, { backgroundColor: tab === 'active' ? '#FFFFFFoo' : colors.primary }]}>
                  <Text style={[typography.label, { color: '#FFFFFF' }]}>{activeOrders.length}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {currentOrders.length === 0 ? (
          <EmptyState
            icon={tab === 'active' ? 'shopping-bag' : 'clock'}
            title={tab === 'active' ? 'No active orders' : 'No past orders'}
            description={tab === 'active' ? 'Browse tonight\'s deals and place your first order' : 'Your completed orders will appear here'}
            actionLabel={tab === 'active' ? 'Browse Deals' : undefined}
            onAction={tab === 'active' ? () => router.push('/(customer)/explore') : undefined}
          />
        ) : (
          currentOrders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', maxWidth: 1280, alignSelf: 'center',paddingBottom: spacing.xxl },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
