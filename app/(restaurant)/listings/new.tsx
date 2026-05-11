// New listing form — create surplus food item
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { spacing, typography } from '../../../constants/colors';
import { useColors } from '../../../hooks/useColors';

const FOOD_TAGS = ['Jollof', 'egusi', 'Fried Rice', 'Swollow', 'amala', 'Snack', 'Brnch', 'Vegan'];

function getDefaultExpiry() {
  const d = new Date();
  d.setHours(21, 30, 0, 0);
  return d.toISOString().slice(0, 16);
}

function computeDiscount(original: string, current: string): number {
  const o = parseFloat(original);
  const c = parseFloat(current);
  if (!o || !c || c >= o) return 0;
  return Math.round(((o - c) / o) * 100);
}

export default function NewListingScreen() {
  const colors = useColors();
  const router = useRouter();

  const [foodName, setFoodName] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [portions, setPortions] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const discount = computeDiscount(originalPrice, currentPrice);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const validate = () => {
    if (!foodName.trim()) return 'Food name is required';
    if (!originalPrice || isNaN(Number(originalPrice))) return 'Valid original price required';
    if (!currentPrice || isNaN(Number(currentPrice))) return 'Valid discounted price required';
    if (Number(currentPrice) >= Number(originalPrice)) return 'Sale price must be lower than original';
    if (!portions || isNaN(Number(portions)) || Number(portions) < 1) return 'at least 1 portion required';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation error', err);
      return;
    }
    setLoading(true);
    // Stub — will call Supabase when keys are provided
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    Alert.alert('Listing Created', 'Your surplus deal is now live!', [
      { text: 'oK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[typography.h4, { color: colors.foreground }]}>New Listing</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic info */}
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.foreground }]}>Food Details</Text>
            <Input
              label="Food Name"
              value={foodName}
              onChangeText={setFoodName}
              placeholder="2.g. Jollof Rice with Chicken"
              placeholderTextColor={colors.placeholder}
            />
            <Input
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="What makes it special?"
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top', paddingTop: 8 }}
            />
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.foreground }]}>Pricing</Text>
            <View style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="original Price (₦)"
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  placeholder="3200"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Sale Price (₦)"
                  value={currentPrice}
                  onChangeText={setCurrentPrice}
                  placeholder="1600"
                  keyboardType="numeric"
                />
              </View>
            </View>
            {discount > 0 && (
              <View style={[styles.discountBanner, { backgroundColor: colors.successDim }]}>
                <Feather name="tag" size={14} color={colors.success} />
                <Text style={[typography.bodyMedium, { color: colors.success }]}>
                  {discount}% discount — great deal!
                </Text>
              </View>
            )}
          </View>

          {/* Portions */}
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.foreground }]}>Portions available</Text>
            <View style={styles.portionRow}>
              {['1', '2', '3', '5', '10'].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setPortions(n)}
                  style={[
                    styles.portionBtn,
                    {
                      backgroundColor: portions === n ? colors.primary : colors.elevated,
                      borderColor: portions === n ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.bodyMedium,
                      { color: portions === n ? '#FFFFFF' : colors.foreground },
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
              <View style={{ flex: 1 }}>
                <Input
                  value={portions}
                  onChangeText={setPortions}
                  placeholder="custom"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Food tags */}
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.foreground }]}>Food Tags</Text>
            <View style={styles.tagsWrap}>
              {FOOD_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: active ? colors.primaryDim : colors.elevated,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.captionMedium,
                        { color: active ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* info banner */}
          <View style={[styles.infoBanner, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
            <Feather name="info" size={14} color={colors.textMuted} />
            <Text style={[typography.caption, { color: colors.textMuted, flex: 1 }]}>
              Your listing will be visible to customers from 8pm tonight until 9:30pm or sold out.
            </Text>
          </View>

          <Button label="Publish Listing" onPress={handleSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 40 },
  section: { gap: spacing.md },
  priceRow: { flexDirection: 'row', gap: spacing.md },
  discountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    borderRadius: 10,
  },
  portionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  portionBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
  },
});
