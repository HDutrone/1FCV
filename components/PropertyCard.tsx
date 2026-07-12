import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Bed, Bath, Maximize2, Heart, MapPin } from 'lucide-react-native';
import { Property } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { Radius, Shadows } from '@/constants/theme';
import Badge from './common/Badge';
import AnimatedPressable from './common/AnimatedPressable';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width > 600 ? (width - 48) / 2 : width - 32;

const PLACEHOLDER_IMAGES = [
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=800',
];

interface PropertyCardProps {
  property: Property;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  style?: object;
}

export default function PropertyCard({ property, isFavorite, onToggleFavorite, style }: PropertyCardProps) {
  const router = useRouter();
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const [heartScale] = useState(() => new Animated.Value(1));

  const primaryImage = property.property_images?.find(img => img.is_primary)?.url
    || property.property_images?.[0]?.url
    || PLACEHOLDER_IMAGES[Math.abs(property.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length)];

  const formatPrice = (price: number, currency: string, type: string) => {
    const formatted = new Intl.NumberFormat('fr-FR').format(price);
    if (type === 'rent') return `$${formatted}/mois`;
    return `$${formatted}`;
  };

  const cityName = (property as any).city?.name || '';
  const communeName = (property as any).commune?.name || '';
  const location = communeName ? `${communeName}, ${cityName}` : cityName;

  const handleImageLoad = () => {
    Animated.timing(imageOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  };

  const handleToggleFavorite = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, speed: 40, bounciness: 12 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
    onToggleFavorite?.(property.id);
  };

  return (
    <AnimatedPressable
      style={[styles.card, style] as any}
      onPress={() => router.push(`/property/${property.id}` as any)}
      scaleTo={0.98}
    >
      <View style={styles.imageContainer}>
        <Animated.Image
          source={{ uri: primaryImage }}
          style={[styles.image, { opacity: imageOpacity }]}
          resizeMode="cover"
          onLoad={handleImageLoad}
        />
        <LinearGradient
          colors={['transparent', 'rgba(7,31,54,0.65)']}
          style={styles.imageOverlay}
          pointerEvents="none"
        />

        <View style={styles.topRow}>
          <Badge
            label={property.listing_type === 'sale' ? 'À Vendre' : 'À Louer'}
            variant={property.listing_type === 'sale' ? 'sale' : 'rent'}
            size="sm"
          />
          <AnimatedPressable
            style={styles.heartBtn}
            onPress={handleToggleFavorite}
            haptic="light"
            scaleTo={0.85}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                size={18}
                color={isFavorite ? Colors.error : Colors.textInverse}
                fill={isFavorite ? Colors.error : 'none'}
              />
            </Animated.View>
          </AnimatedPressable>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {formatPrice(property.price, property.currency, property.listing_type)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>

        <View style={styles.locationRow}>
          <MapPin size={12} color={Colors.textSecondary} />
          <Text style={styles.location} numberOfLines={1}>{location}</Text>
        </View>

        <View style={styles.statsRow}>
          {property.bedrooms > 0 && (
            <View style={styles.stat}>
              <Bed size={14} color={Colors.primary} />
              <Text style={styles.statText}>{property.bedrooms} ch.</Text>
            </View>
          )}
          {property.bathrooms > 0 && (
            <View style={styles.stat}>
              <Bath size={14} color={Colors.primary} />
              <Text style={styles.statText}>{property.bathrooms} sdb</Text>
            </View>
          )}
          {property.surface_area > 0 && (
            <View style={styles.stat}>
              <Maximize2 size={14} color={Colors.primary} />
              <Text style={styles.statText}>{property.surface_area} m²</Text>
            </View>
          )}
        </View>

        {property.is_furnished && (
          <View style={styles.tagRow}>
            <View style={styles.tag}><Text style={styles.tagText}>Meublé</Text></View>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 16,
    ...Shadows.md,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
    backgroundColor: Colors.surfaceSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(7,31,54,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textInverse,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.primaryLight + '20',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
});
