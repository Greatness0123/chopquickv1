// Admin — Customers tab
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../components/ui/EmptyState';
import { ToastViewport } from '../../components/ui/Toast';
import { useToast } from '../../components/ui/Toast';
import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { supabase } from '../../lib/supabase';

const ADMIN_KEY = 'chopquick_admin_access';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export default function AdminCustomersScreen() {
  const colors = useColors();
  const [isAdmin, setIsAdmin] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(ADMIN_KEY).then((val) => {
      if (val === 'true') setIsAdmin(true);
    });
  }, []);

  React.useEffect(() => {
    if (isAdmin) fetchProfiles();
  }, [isAdmin]);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfiles();
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
        <Text style={[typography.h3, { color: colors.foreground }]}>Customers</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {profiles.length} registered
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
        ) : profiles.length === 0 ? (
          <EmptyState
            icon="users"
            title="No customers yet"
            description="All customers will appear here"
          />
        ) : (
          profiles.map((p) => (
            <View key={p.id} style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.avatar}>
                <Text style={[typography.h4, { color: colors.foreground }]}>
                  {(p.full_name || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodySemiBold, { color: colors.foreground }]}>
                  {p.full_name || 'Unnamed'}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {p.email || p.id}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                  Joined {formatDate(p.created_at)}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[typography.caption, { color: colors.success }]}>Active</Text>
              </View>
            </View>
          ))
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8480F20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 8,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});