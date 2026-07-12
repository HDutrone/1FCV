import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Eye, Clock, CircleCheck as CheckCircle, CircleX, Crown, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Property } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import Badge from '@/components/common/Badge';
import { RowSkeletonList } from '@/components/common/Skeleton';

const PLACEHOLDER_IMAGES = [
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400',
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'En attente', color: Colors.warning, bg: Colors.warningLight, icon: Clock },
  approved: { label: 'Approuvee', color: Colors.success, bg: Colors.successLight, icon: CheckCircle },
  active: { label: 'Active', color: Colors.success, bg: Colors.successLight, icon: CheckCircle },
  sold: { label: 'Vendu', color: Colors.primary, bg: Colors.saleLight, icon: CheckCircle },
  rented: { label: 'Loue', color: Colors.accent, bg: Colors.rentLight, icon: CheckCircle },
  inactive: { label: 'Inactive', color: Colors.error, bg: Colors.errorLight, icon: CircleX },
};

interface PropertyWithCount extends Property {
  interest_count?: number;
}

export default function MyListingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [properties, setProperties] = useState<PropertyWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('properties')
      .select(`
        *,
        city:cities(id, name),
        commune:communes(id, name),
        property_images(id, url, is_primary, order_index),
        tenant_interests(id)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const mapped = (data as any[]).map(p => ({
        ...p,
        interest_count: p.tenant_interests?.length || 0,
        tenant_interests: undefined,
      }));
      setProperties(mapped as PropertyWithCount[]);
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchListings(); }, [fetchListings]));

  const getImage = (property: Property) => {
    return property.property_images?.find(i => i.is_primary)?.url
      || property.property_images?.[0]?.url
      || PLACEHOLDER_IMAGES[0];
  };

  const renderItem = ({ item }: { item: PropertyWithCount }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const StatusIcon = status.icon;
    const cityName = (item as any).city?.name || '';

    return (
      <View style={styles.cardWrap}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/property/${item.id}` as any)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: getImage(item) }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Badge
                label={item.listing_type === 'sale' ? 'Vente' : 'Location'}
                variant={item.listing_type === 'sale' ? 'sale' : 'rent'}
                size="sm"
              />
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <StatusIcon size={12} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardLocation}>{cityName}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardPrice}>
                ${new Intl.NumberFormat('fr-FR').format(item.price)}
                {item.listing_type === 'rent' ? '/mois' : ''}
              </Text>
              <View style={styles.viewsRow}>
                <Eye size={12} color={Colors.textTertiary} />
                <Text style={styles.viewsText}>{item.views_count}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.interestsBtn}
          onPress={() => router.push({
            pathname: '/property-interests' as any,
            params: { propertyId: item.id, propertyTitle: item.title },
          })}
        >
          <Users size={14} color={Colors.primary} />
          <Text style={styles.interestsBtnText}>
            {(item.interest_count || 0)} candidature{(item.interest_count || 0) !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mes Annonces</Text>
          <Text style={styles.headerSubtitle}>{properties.length} annonce{properties.length !== 1 ? 's' : ''}</Text>
        </View>
        {!isPremium && (
          <TouchableOpacity style={styles.premiumBtn} onPress={() => router.push('/subscription' as any)}>
            <Crown size={14} color={Colors.accent} />
            <Text style={styles.premiumBtnText}>Premium</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <RowSkeletonList count={5} />
      ) : properties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Aucune annonce</Text>
          <Text style={styles.emptyText}>
            Publiez votre premier bien pour commencer a recevoir des demandes.
          </Text>
          <TouchableOpacity style={styles.publishBtn} onPress={() => router.push('/(tabs)/publish' as any)}>
            <Text style={styles.publishBtnText}>Publier un bien</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  headerSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  premiumBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: Colors.accentLight + '20',
    borderRadius: 20, borderWidth: 1, borderColor: Colors.accent + '40',
  },
  premiumBtnText: { fontSize: 12, fontWeight: '700', color: Colors.accent },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  publishBtn: {
    marginTop: 8, paddingVertical: 12, paddingHorizontal: 28,
    backgroundColor: Colors.primary, borderRadius: 12,
  },
  publishBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textInverse },
  list: { padding: 16 },
  cardWrap: { marginBottom: 14 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardImage: { width: 110, height: 110 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  cardLocation: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  viewsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewsText: { fontSize: 11, color: Colors.textTertiary },
  interestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.saleLight,
    paddingVertical: 10,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.border,
  },
  interestsBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
