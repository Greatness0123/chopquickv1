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
import { MOCK_ORDERS } from '../../../constants/mockData';
import { spacing, typography } from '../../../constants/colors';
import { useColors } from '../../../hooks/useColors';
import { useRouter } from 'expo-router';

const TABS = [
  { id: 'active', label: 'active' },
  { id: 'past', label: 'Past' },
];

export default function OrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'active' | 'past'>('active');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const activeOrders = MOCK_ORDERS.filter((o) =>
    ['pending_payment', 'confirmed'].includes(o.order_status)
  );
  const pastOrders = MOCK_ORDERS.filter((o) =>
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
          { paddingBottom: bottomPad + 80 },
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
  container: { flex: 1 },
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
