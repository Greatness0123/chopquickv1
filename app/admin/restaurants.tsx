// Admin — Restaurants tab
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ToastViewport } from '../../components/ui/Toast';
import { useToast } from '../../components/ui/Toast';
import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { supabase } from '../../lib/supabase';

const ADMIN_KEY = 'chopquick_admin_access';

function formatNGN(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export default function AdminRestaurantsScreen() {
  const colors = useColors();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suspended, setSuspended] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(ADMIN_KEY).then((val) => {
      if (val === 'true') setIsAdmin(true);
    });
  }, []);

  React.useEffect(() => {
    if (isAdmin) fetchRestaurants();
  }, [isAdmin]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRestaurants(data || []);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchRestaurants();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
  };

  const toggleSuspend = async (id: string, currentlySuspended: boolean) => {
    setSuspended((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      await supabase
        .from('restaurants')
        .update({ is_suspended: !currentlySuspended })
        .eq('id', id);
    } catch (err) {
      console.error('Failed to toggle suspend:', err);
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.accessDenied}>
          <Text style={[typography.h4, { color: colors.textMuted }]}>Admin access only</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ToastViewport />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.foreground }]}>Restaurants</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {restaurants.length} registered
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : restaurants.length === 0 ? (
          <EmptyState
            icon="home"
            title="No restaurants yet"
            description="All registered restaurants will appear here"
          />
        ) : (
          restaurants.map((r) => {
            const isSuspended = suspended.has(r.id) || r.is_suspended;
            return (
              <View key={r.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[typography.bodySemiBold, { color: colors.foreground }]}>
                        {r.name || 'Unnamed Restaurant'}
                      </Text>
                      {isSuspended && (
                        <Badge variant="rejected" label="Suspended" />
                      )}
                    </View>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                      ID: {r.id.slice(0, 8)}...
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[typography.label, { color: colors.textMuted }]}>Revenue</Text>
                    <Text style={[typography.bodySemiBold, { color: colors.success }]}>
                      {formatNGN(r.total_revenue_recovered || 0)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[typography.label, { color: colors.textMuted }]}>Location</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {r.address || 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[typography.label, { color: colors.textMuted }]}>Joined</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {r.created_at ? formatDate(r.created_at) : 'Unknown'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => toggleSuspend(r.id, isSuspended)}
                  style={[
                    styles.suspendBtn,
                    { backgroundColor: isSuspended ? colors.success + '20' : colors.error + '20' },
                  ]}
                >
                  <Text
                    style={[
                      typography.captionMedium,
                      { color: isSuspended ? colors.success : colors.error },
                    ]}
                  >
                    {isSuspended ? 'Unsuspend' : 'Suspend'}
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  scroll: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: 14, padding: spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#2A2930',
  },
  statItem: { flex: 1 },
  suspendBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});