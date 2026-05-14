// New listing form — create surplus food item
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { useAuth } from '../../../context/AuthContext';
import { useColors } from '../../../hooks/useColors';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/ui/Toast';
import { useDialog } from '../../../components/ui/Dialog';

const FOOD_TAGS = ['Jollof', 'Egusi', 'Fried Rice', 'Swallow', 'Amala', 'Snack', 'Brunch', 'Vegan'];

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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  const [foodName, setFoodName] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [portions, setPortions] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<any>('other');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('21:30');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const discount = computeDiscount(originalPrice, currentPrice);

  useEffect(() => {
    if (isEditing) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFoodName(data.food_name);
        setOriginalPrice(data.original_price.toString());
        setCurrentPrice(data.current_price.toString());
        setPortions(data.portions_total.toString());
        setDescription(data.description || '');
        setCategory(data.food_category);
        setImageUri(data.image_url);

        const liveAt = new Date(data.goes_live_at);
        const expiresAt = new Date(data.expires_at);
        setStartTime(`${liveAt.getHours().toString().padStart(2, '0')}:${liveAt.getMinutes().toString().padStart(2, '0')}`);
        setEndTime(`${expiresAt.getHours().toString().padStart(2, '0')}:${expiresAt.getMinutes().toString().padStart(2, '0')}`);
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      showToast('Could not load listing details', 'error');
    }
  };

  const pickImage = async () => {
    const confirmed = await showConfirm({
      title: 'Upload Image',
      message: 'Choose a source',
      confirmText: 'Camera',
    });
    if (confirmed) {
      takePhoto();
    } else {
      launchGallery();
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast('Camera access is required to take a photo.', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const launchGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, listingId: string) => {
    const ext = uri.split('.').pop();
    const path = `${restaurant?.id}/${listingId}.${ext}`;

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: path,
      type: `image/${ext}`,
    } as any);

    const { error } = await supabase.storage
      .from('listings')
      .upload(path, formData);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('listings')
      .getPublicUrl(path);

    return publicUrl;
  };

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
    if (!portions || isNaN(Number(portions)) || Number(portions) < 1) return 'At least 1 portion required';

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime)) return 'Invalid live time format (HH:mm)';
    if (!timeRegex.test(endTime)) return 'Invalid expiry time format (HH:mm)';

    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      showToast(err, 'error');
      return;
    }

    if (!restaurant?.id) {
      showToast('Restaurant profile not found', 'error');
      return;
    }

    setLoading(true);
    try {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);

      const liveAt = new Date();
      liveAt.setHours(startH, startM, 0, 0);

      const expiresAt = new Date();
      expiresAt.setHours(endH, endM, 0, 0);

      const listingData: any = {
        restaurant_id: restaurant.id,
        food_name: foodName.trim(),
        food_category: category,
        description: description.trim(),
        original_price: parseFloat(originalPrice),
        current_price: parseFloat(currentPrice),
        discount_percent: discount,
        portions_total: parseInt(portions),
        goes_live_at: liveAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'live',
      };

      if (!isEditing) {
        listingData.portions_remaining = parseInt(portions);
      }

      let listing;
      if (isEditing) {
        const { data, error } = await supabase
          .from('listings')
          .update(listingData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        listing = data;
      } else {
        const { data, error } = await supabase
          .from('listings')
          .insert(listingData)
          .select()
          .single();
        if (error) throw error;
        listing = data;
      }

      if (imageUri && listing && !imageUri.startsWith('http')) {
        const imageUrl = await uploadImage(imageUri, listing.id);
        await supabase
          .from('listings')
          .update({ image_url: imageUrl })
          .eq('id', listing.id);
      }

      setLoading(false);
      showToast(
        isEditing ? 'Your changes have been saved.' : 'Your surplus deal is now live!',
        'success'
      );
      router.back();
    } catch (err: any) {
      setLoading(false);
      showToast(err.message || 'Could not create listing', 'error');
    }
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
          <Text style={[typography.h4, { color: colors.foreground }]}>
            {isEditing ? 'Edit Listing' : 'New Listing'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Image picker */}
          <Pressable
            onPress={pickImage}
            style={[styles.imagePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} />
            ) : (
              <View style={styles.pickerContent}>
                <Feather name="image" size={32} color={colors.textMuted} />
                <Text style={[typography.caption, { color: colors.textMuted }]}>Upload food image</Text>
              </View>
            )}
          </Pressable>

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
                      { color: portions === n ? colors.foreground : colors.foreground },
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

          {/* Pickup Timing */}
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.foreground }]}>Pickup Timing</Text>
            <View style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Goes Live At"
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="20:00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Expires At"
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="21:30"
                />
              </View>
            </View>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Enter time in 24h format (e.g., 20:00)
            </Text>
          </View>

          {/* Category selection */}
          <View style={styles.section}>
            <Text style={[typography.h4, { color: colors.foreground }]}>Category</Text>
            <View style={styles.tagsWrap}>
              {['rice', 'chicken', 'pasta', 'soup', 'snacks', 'other'].map((cat) => {
                const active = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
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
                        { color: active ? colors.primary : colors.textSecondary, textTransform: 'capitalize' },
                      ]}
                    >
                      {cat}
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
              Your listing will be visible to customers from {startTime} tonight until {endTime} or sold out.
            </Text>
          </View>

          <Button
            label={isEditing ? 'Save Changes' : 'Publish Listing'}
            onPress={handleSubmit}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1,paddingBottom: spacing.xxl },
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
  imagePicker: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: { width: '100%', height: '100%' },
  pickerContent: { alignItems: 'center', gap: 8 },
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
