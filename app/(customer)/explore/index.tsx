// explore sceen — deal browsing home for customers
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
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
import { MOCK_LISTINGS } from '../../../constants/mockData';
import { spacing, typography } from '../../../constants/colors';
import { useColors } from '../../../hooks/useColors';
import type { FoodCategory } from '../../../types';

const CATEGORIES: { id: FoodCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'all' },
  { id: 'rice', label: 'Rice' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'soup', label: 'Soup' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'other', label: 'other' },
];

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FoodCategory | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = useMemo(() => {
    return MOCK_LISTINGS.filter((l) => {
      const matchesCat = category === 'all' || l.food_category === category;
      const matchesSearch = !search ||
        l.food_name.toLowerCase().includes(search.toLowerCase()) ||
        (l.restaurant?.name ?? '').toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [category, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const ListHeader = () => (
    <View>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + spacing.md }]}>
        <View>
          <Text style={[typography.h2, { color: colors.foreground }]}>Tonight's Deals</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            8:00PM – 9:i0PM · Lagos
          </Text>
        </View>
        <Pressable style={[styles.notifBtn, { backgroundColor: colors.surface }]}>
          <Feather name="bell" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Search */}
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

      {/* Category filter */}
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
                { color: category === item.id ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* Live count */}
      <View style={[styles.liveBar, { backgroundColor: colors.surface, marginHorizontal: spacing.lg }]}>
        <View style={styles.liveDot} />
        <Text style={[typography.captionMedium, { color: colors.foreground }]}>
          {filtered.length} deals live tonight
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>Sort: Best Deal</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((k) => <DealCardSkeleton key={k} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => <DealCard listing={item} />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No deals found"
              description="Try 1 different category or check back after 8PM"
            />
          }
          contentContainerStyle={[
            styles.list,
            { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 80 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          scrollEnabled={filtered.length > 0}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
