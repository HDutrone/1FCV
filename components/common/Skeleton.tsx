import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/theme';

const { width } = Dimensions.get('window');

export function SkeletonBlock({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, { opacity }, style]} />;
}

export function PropertyCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock style={styles.image} />
      <View style={styles.content}>
        <SkeletonBlock style={{ width: '70%', height: 16, borderRadius: 6 }} />
        <SkeletonBlock style={{ width: '45%', height: 12, borderRadius: 6, marginTop: 10 }} />
        <View style={styles.statsRow}>
          <SkeletonBlock style={{ width: 50, height: 12, borderRadius: 6 }} />
          <SkeletonBlock style={{ width: 50, height: 12, borderRadius: 6 }} />
          <SkeletonBlock style={{ width: 50, height: 12, borderRadius: 6 }} />
        </View>
      </View>
    </View>
  );
}

export function ListingsSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function RowSkeleton() {
  return (
    <View style={styles.row}>
      <SkeletonBlock style={styles.rowThumb} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBlock style={{ width: '60%', height: 14, borderRadius: 6 }} />
        <SkeletonBlock style={{ width: '35%', height: 12, borderRadius: 6 }} />
      </View>
    </View>
  );
}

export function RowSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: Colors.border, borderRadius: Radius.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: { width: '100%', height: 200, borderRadius: 0 },
  content: { padding: 14 },
  statsRow: { flexDirection: 'row', gap: 14, marginTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  rowThumb: { width: 44, height: 44, borderRadius: Radius.md },
});
