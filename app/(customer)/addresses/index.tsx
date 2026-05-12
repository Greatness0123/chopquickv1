// Delivery addresses screen — list and manage saved locations
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button';
import { spacing, typography } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useColors } from '../../../hooks/useColors';
import { supabase } from '../../../lib/supabase';

interface Address {
  id: string;
  label: string;
  address_line: string;
  is_default: boolean;
}

export default function AddressesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user?.id]);

  const setDefault = async (id: string) => {
    try {
      // 1. Unset existing default
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id)
        .eq('is_default', true);

      // 2. Set new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      fetchAddresses();
    } catch (err) {
      Alert.alert('Error', 'Could not update default address');
    }
  };

  const deleteAddress = async (id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('addresses').delete().eq('id', id);
            if (error) throw error;
            fetchAddresses();
          } catch (err) {
            Alert.alert('Error', 'Could not delete address');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.surface }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.foreground }]}>My Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDefault(item.id)}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: item.is_default ? colors.primary : colors.border }
              ]}
            >
              <View style={styles.cardInfo}>
                <View style={styles.labelRow}>
                  <Text style={[typography.bodySemiBold, { color: colors.foreground }]}>{item.label}</Text>
                  {item.is_default && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.primaryDim }]}>
                      <Text style={[typography.label, { color: colors.primary }]}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>{item.address_line}</Text>
              </View>
              <Pressable onPress={() => deleteAddress(item.id)} style={styles.deleteBtn}>
                <Feather name="trash-2" size={18} color={colors.textMuted} />
              </Pressable>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="map-pin" size={48} color={colors.border} />
              <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: 16 }]}>
                No saved addresses yet
              </Text>
            </View>
          }
        />
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          label="Add New Address"
          onPress={() => Alert.alert('Coming Soon', 'This feature is under development.')}
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', maxWidth: 1280, alignSelf: 'center',paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cardInfo: { flex: 1, gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', marginTop: 80 },
  footer: { paddingHorizontal: spacing.lg },
});
