import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Animated,
  RefreshControl, TouchableOpacity, Platform, Dimensions,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, Search, X, SlidersHorizontal, MapPin } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Property, PropertyFilters } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useMode } from '@/context/ModeContext';
import { useAuth } from '@/context/AuthContext';
import FilterBar from '@/components/FilterBar';
import PropertyCard from '@/components/PropertyCard';
import { ListingsSkeletonList } from '@/components/common/Skeleton';

const { width } = Dimensions.get('window');
const isWide = width > 600;

export default function ListingsScreen() {
  const { mode } = useMode();
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({ listingType: mode });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const fetchProperties = useCallback(async (currentFilters: PropertyFilters, query?: string) => {
    let q = supabase
      .from('properties')
      .select(`
        *,
        city:cities(id, name),
        commune:communes(id, name),
        property_images(id, url, is_primary, order_index)
      `)
      .eq('listing_type', currentFilters.listingType)
      .in('status', ['approved', 'active'])
      .order('created_at', { ascending: false });

    if (currentFilters.cityId) q = q.eq('city_id', currentFilters.cityId);
    if (currentFilters.communeId) q = q.eq('commune_id', currentFilters.communeId);
    if (currentFilters.minPrice) q = q.gte('price', currentFilters.minPrice);
    if (currentFilters.maxPrice) q = q.lte('price', currentFilters.maxPrice);
    if (currentFilters.propertyType) q = q.eq('property_type', currentFilters.propertyType);
    if (currentFilters.minBedrooms) q = q.gte('bedrooms', currentFilters.minBedrooms);
    if (currentFilters.minBathrooms) q = q.gte('bathrooms', currentFilters.minBathrooms);
    if (currentFilters.minArea) q = q.gte('surface_area', currentFilters.minArea);
    if (currentFilters.maxArea) q = q.lte('surface_area', currentFilters.maxArea);
    if (currentFilters.isFurnished) q = q.eq('is_furnished', true);
    if (currentFilters.hasGarage) q = q.eq('has_garage', true);
    if (currentFilters.hasPool) q = q.eq('has_pool', true);
    if (currentFilters.hasGarden) q = q.eq('has_garden', true);
    if (currentFilters.hasSecurity) q = q.eq('has_security', true);

    if (query && query.trim().length > 0) {
      q = q.or(`title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%,address_hint.ilike.%${query.trim()}%`);
    }

    const { data, error } = await q;
    if (!error && data) setProperties(data as Property[]);
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id);
    if (data) {
      setFavorites(new Set(data.map((f: any) => f.property_id)));
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      const newFilters = { ...filters, listingType: mode };
      setFilters(newFilters);
      setLoading(true);
      Promise.all([fetchProperties(newFilters, searchQuery), fetchFavorites()]).finally(() => setLoading(false));
    }, [mode])
  );

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
    setLoading(true);
    fetchProperties(newFilters, searchQuery).finally(() => setLoading(false));
  };

  const handleSearch = () => {
    setLoading(true);
    fetchProperties(filters, searchQuery).finally(() => setLoading(false));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
    setLoading(true);
    fetchProperties(filters, '').finally(() => setLoading(false));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProperties(filters, searchQuery), fetchFavorites()]);
    setRefreshing(false);
  };

  const handleToggleFavorite = async (propertyId: string) => {
    if (!user) return;
    const isFav = favorites.has(propertyId);
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
      setFavorites(prev => { const s = new Set(prev); s.delete(propertyId); return s; });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, property_id: propertyId });
      setFavorites(prev => new Set([...prev, propertyId]));
    }
  };

  useEffect(() => {
    if (!loading) {
      contentOpacity.setValue(0);
      Animated.timing(contentOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    }
  }, [loading]);

  const numColumns = isWide ? 2 : 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>1 Futur Chez Vous</Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'rent' ? 'Location de biens' : 'Achat immobilier'} en RDC
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSearch(!showSearch)}>
              <Search size={20} color={showSearch ? Colors.primary : Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Search size={16} color={Colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher par titre, description, quartier..."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <X size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />

      {loading ? (
        <ListingsSkeletonList count={4} />
      ) : properties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MapPin size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>Aucun bien trouve</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `Aucun resultat pour "${searchQuery}". Essayez un autre terme.`
              : 'Essayez de modifier vos filtres pour voir plus de resultats.'}
          </Text>
          {searchQuery && (
            <TouchableOpacity style={styles.clearSearchBtn} onPress={clearSearch}>
              <Text style={styles.clearSearchBtnText}>Effacer la recherche</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <FlatList
            key={numColumns}
            data={properties}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            renderItem={({ item }) => (
              <View style={isWide ? styles.gridItem : undefined}>
                <PropertyCard
                  property={item}
                  isFavorite={favorites.has(item.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              </View>
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
            }
            ListHeaderComponent={
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {properties.length} bien{properties.length > 1 ? 's' : ''} trouve{properties.length > 1 ? 's' : ''}
                </Text>
                {searchQuery ? (
                  <TouchableOpacity style={styles.activeSearchChip} onPress={clearSearch}>
                    <Text style={styles.activeSearchText} numberOfLines={1}>"{searchQuery}"</Text>
                    <X size={12} color={Colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 4,
    backgroundColor: Colors.surface,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    height: '100%',
  },
  searchBtn: {
    height: 42,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textInverse },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  clearSearchBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  clearSearchBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textInverse },
  listContent: { padding: 16 },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.saleLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    maxWidth: 180,
  },
  activeSearchText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  gridItem: {
    flex: 1,
    maxWidth: (width - 48) / 2,
    marginHorizontal: 4,
  },
});
