// Restaurant listings — all surplus items for this restaurant
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { EmptyState } from '../../../components/ui/EmptyState';
import { spacing, typography } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useColors } from '../../../hooks/useColors';
import { supabase } from '../../../lib/supabase';
import type { Listing } from '../../../types';

type FilterTab = 'all' | 'live' | 'sold_out';

export default function ListingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { restaurant } = useAuth();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);

  const fetchListings = async () => {
    if (!restaurant?.id) return;
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchListings();
  }, [restaurant?.id]);

  const filtered = useMemo(() => {
    if (filter === 'all') return listings;
    return listings.filter((l) => l.status === filter);
  }, [listings, filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'all', count: listings.length },
    { key: 'live', label: 'Live', count: listings.filter((l) => l.status === 'live').length },
    { key: 'sold_out', label: 'Sold out', count: listings.filter((l) => l.status === 'sold_out').length },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.foreground }]}>Listings</Text>
        <Pressable
          onPress={() => router.push('/(restaurant)/listings/new' as any)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <Text style={[typography.captionMedium, { color: '#FFFFFF' }]}>New</Text>
        </Pressable>
      </View>

      {/* Filter tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setFilter(t.key)}
            style={[
              styles.tab,
              filter === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                typography.bodyMedium,
                { color: filter === t.key ? colors.primary : colors.textSecondary },
              ]}
            >
              {t.label}
            </Text>
            <View
              style={[
                styles.countPill,
                { backgroundColor: filter === t.key ? colors.primaryDim : colors.elevated },
              ]}
            >
              <Text
                style={[
                  typography.label,
                  { color: filter === t.key ? colors.primary : colors.textMuted },
                ]}
              >
                {t.count}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon="package"
            title="No listings"
            description="add surplus food to start earning"
            actionLabel="Create Listing"
            onAction={() => router.push('/(restaurant)/listings/new' as any)}
          />
        ) : (
          filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onEdit={() => {}}
              onToggle={() => {}}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    marginRight: spacing.xl,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
});
