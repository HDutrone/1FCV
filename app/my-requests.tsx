import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Clock, CircleCheck as CheckCircle, CircleX, Eye, MessageCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { RowSkeletonList } from '@/components/common/Skeleton';

interface InterestItem {
  id: string;
  status: string;
  message: string;
  created_at: string;
  property: {
    id: string;
    title: string;
    price: number;
    listing_type: string;
    property_images: { url: string; is_primary: boolean }[];
    city: { name: string } | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'En attente', color: Colors.warning, bg: Colors.warningLight, icon: Clock },
  reviewed: { label: 'Examinee', color: Colors.info, bg: Colors.infoLight, icon: Eye },
  accepted: { label: 'Acceptee', color: Colors.success, bg: Colors.successLight, icon: CheckCircle },
  rejected: { label: 'Refusee', color: Colors.error, bg: Colors.errorLight, icon: CircleX },
};

const PLACEHOLDER = 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400';

export default function MyRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('tenant_interests')
      .select(`
        id, status, message, created_at,
        property:properties(
          id, title, price, listing_type,
          property_images(url, is_primary),
          city:cities(name)
        )
      `)
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setInterests(data as any);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchRequests(); }, [fetchRequests]));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getImage = (item: InterestItem) => {
    const imgs = item.property?.property_images;
    return imgs?.find(i => i.is_primary)?.url || imgs?.[0]?.url || PLACEHOLDER;
  };

  const handleOpenConversation = async (interest: InterestItem) => {
    if (!user || !interest.property) return;

    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('property_id', interest.property.id)
      .eq('tenant_id', user.id)
      .maybeSingle();

    if (conv) {
      router.push(`/conversation/${conv.id}` as any);
    }
  };

  const renderItem = ({ item }: { item: InterestItem }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const StatusIcon = status.icon;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => item.property && router.push(`/property/${item.property.id}` as any)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: getImage(item) }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <StatusIcon size={12} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.property?.title || 'Bien immobilier'}</Text>
          <Text style={styles.cardPrice}>
            ${new Intl.NumberFormat('fr-FR').format(item.property?.price || 0)}
            {item.property?.listing_type === 'rent' ? '/mois' : ''}
          </Text>
          {item.status === 'accepted' && (
            <TouchableOpacity style={styles.chatBtn} onPress={() => handleOpenConversation(item)}>
              <MessageCircle size={14} color={Colors.primary} />
              <Text style={styles.chatBtnText}>Ouvrir la conversation</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mes Demandes</Text>
          <Text style={styles.headerSubtitle}>{interests.length} demande{interests.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {loading ? (
        <RowSkeletonList count={4} />
      ) : interests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Aucune demande</Text>
          <Text style={styles.emptyText}>
            Manifestez votre interet pour un bien et suivez l'avancement de vos demandes ici.
          </Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)' as any)}>
            <Text style={styles.browseBtnText}>Parcourir les biens</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={interests}
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  browseBtn: {
    marginTop: 8, paddingVertical: 12, paddingHorizontal: 28,
    backgroundColor: Colors.primary, borderRadius: 12,
  },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textInverse },
  list: { padding: 16 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14,
    overflow: 'hidden', marginBottom: 14,
    flexDirection: 'row',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardImage: { width: 100, height: 120 },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 11, color: Colors.textTertiary },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 4 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 6, paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: Colors.saleLight, borderRadius: 8, alignSelf: 'flex-start',
  },
  chatBtnText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
});
