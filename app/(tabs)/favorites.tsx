import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Heart, LogIn } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Property } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import PropertyCard from '@/components/PropertyCard';
import { ListingsSkeletonList } from '@/components/common/Skeleton';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select(`
        property_id,
        property:properties(
          *,
          city:cities(id, name),
          commune:communes(id, name),
          property_images(id, url, is_primary, order_index)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const props = data.map((f: any) => f.property).filter(Boolean) as Property[];
      setFavorites(props);
      setFavoriteIds(new Set(props.map(p => p.id)));
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchFavorites(); }, [fetchFavorites]));

  const handleToggleFavorite = async (propertyId: string) => {
    if (!user) return;
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
    setFavorites(prev => prev.filter(p => p.id !== propertyId));
    setFavoriteIds(prev => { const s = new Set(prev); s.delete(propertyId); return s; });
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Favoris</Text>
        </View>
        <View style={styles.authPrompt}>
          <View style={styles.authIcon}>
            <Heart size={36} color={Colors.primary} />
          </View>
          <Text style={styles.authTitle}>Connectez-vous pour voir vos favoris</Text>
          <Text style={styles.authText}>
            Sauvegardez les biens qui vous intéressent et retrouvez-les ici.
          </Text>
          <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/(auth)/login' as any)}>
            <LogIn size={18} color={Colors.textInverse} />
            <Text style={styles.authBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
        <Text style={styles.headerSubtitle}>{favorites.length} bien{favorites.length !== 1 ? 's' : ''} sauvegardé{favorites.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <ListingsSkeletonList count={3} />
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heart size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>Aucun favori pour l'instant</Text>
          <Text style={styles.emptyText}>
            Appuyez sur le coeur d'un bien pour le sauvegarder ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              isFavorite={favoriteIds.has(item.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  authIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.saleLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  authTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  authText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 8,
  },
  authBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textInverse },
});
