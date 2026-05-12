import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing, typography } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';

interface RatingInputProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
}

export function RatingInput({ rating, onRatingChange, maxRating = 5 }: RatingInputProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {[...Array(maxRating)].map((_, i) => (
        <Pressable
          key={i}
          onPress={() => onRatingChange(i + 1)}
          style={({ pressed }) => [
            styles.star,
            { opacity: pressed ? 0.7 : 1 }
          ]}
        >
          <Feather
            name={i < rating ? 'star' : 'star'}
            size={32}
            color={i < rating ? '#FFD700' : colors.border}
            style={i < rating ? styles.filledStar : null}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  star: {
    padding: 4,
  },
  filledStar: {
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
