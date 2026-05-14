// Explore screen — deal browsing home for customers
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DealCard } from '../../../components/customer/DealCard';
import { DealCardSkeleton } from '../../../components/ui/SkeletonLoader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { spacing, typography } from '../../../constants/colors';
import { supabase } from '../../../lib/supabase';
import { useColors } from '../../../hooks/useColors';
import type { FoodCategory } from '../../../types';

const CATEGORIES: { id: FoodCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'rice', label: 'Rice' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'soup', label: 'Soup' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'other', label: 'Other' },
];

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignSelf: 'center', paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  catList: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.sm },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E8480F',
  },
  list: { paddingHorizontal: spacing.lg },
  skeletons: { padding: spacing.lg, gap: spacing.md },
});

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FoodCategory | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const fetchListings = async () => {
    try {
      let query = supabase
        .from('listings')
        .select(`
          *,
          restaurant:restaurants!fk_restaurant(*)
        `)
        .eq('status', 'live');

      if (category !== 'all') {
        query = query.eq('food_category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      const now = new Date().toISOString();
      const liveDeals = (data || []).filter(
        (l) => l.goes_live_at <= now && l.expires_at > now
      );

      setListings(liveDeals);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchListings();
  }, [category]);

  const onRefresh = async () => {
    setRefreshing(true);
    fetchListings();
  };

  const ListHeader = () => {
    const now = new Date();
    const is8PM = now.getHours() >= 20;

    return (
      <View>
        <View style={[styles.header, { paddingTop: topPad + spacing.md }]}>
          <View>
            <Text style={[typography.h2, { color: colors.foreground }]}>Tonight's Deals</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {is8PM ? 'Live Now' : 'Starts at 8:00PM'}
            </Text>
          </View>
        </View>

        <View style={[styles.searchRow, { backgroundColor: colors.surface, marginHorizontal: spacing.lg }]}>
          <Feather name="search" size={18} color={colors.placeholder} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search restaurants or dishes..."
            placeholderTextColor={colors.placeholder}
            style={[typography.body, { flex: 1, color: colors.foreground }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setCategory(item.id)}
              style={[
                styles.catChip,
                {
                  backgroundColor: category === item.id ? colors.primary : colors.surface,
                  borderColor: category === item.id ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionMedium,
                  { color: category === item.id ? colors.foreground : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />

        <View style={[styles.liveBar, { backgroundColor: colors.surface, marginHorizontal: spacing.lg }]}>
          <View style={styles.liveDot} />
          <Text style={[typography.captionMedium, { color: colors.foreground }]}>
            {listings.length} deals {is8PM ? 'live right now' : 'scheduled for tonight'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => <DealCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No deals available"
              description="Check back at 8PM for tonight's surplus meals"
            />
          }
          renderItem={({ item }) => <DealCard listing={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}