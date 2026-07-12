import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MessageCircle, LogIn, ChevronRight, Lock, House } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { RowSkeletonList } from '@/components/common/Skeleton';

interface ConversationItem {
  id: string;
  property_id: string;
  last_message_at: string;
  status: string;
  property: { title: string; listing_type: string } | null;
  other_party_label: string;
  unread_count?: number;
}

export default function MessagesScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user || !profile) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('conversations')
      .select(`
        id, property_id, last_message_at, status, conversation_type,
        property:properties(title, listing_type),
        tenant_id, owner_id, admin_id
      `)
      .or(`tenant_id.eq.${user.id},owner_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (data) {
      const items: ConversationItem[] = (data as any[]).map(c => {
        let label = 'Administrateur';
        if (profile.role === 'admin') {
          label = c.conversation_type === 'searcher_admin' ? 'Chercheur' : 'Annonceur';
        }
        return {
          id: c.id,
          property_id: c.property_id,
          last_message_at: c.last_message_at,
          status: c.status,
          property: c.property,
          other_party_label: label,
        };
      });
      setConversations(items);
    }
    setLoading(false);
  }, [user, profile]);

  useFocusEffect(useCallback(() => { fetchConversations(); }, [fetchConversations]));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    return `Il y a ${days} jours`;
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.authPrompt}>
          <View style={styles.authIcon}>
            <MessageCircle size={36} color={Colors.primary} />
          </View>
          <Text style={styles.authTitle}>Connectez-vous pour accéder à vos messages</Text>
          <Text style={styles.authText}>
            Toutes les communications passent par notre plateforme sécurisée.
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
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.privacyBadge}>
          <Lock size={12} color={Colors.primary} />
          <Text style={styles.privacyText}>Communications sécurisées</Text>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <Lock size={14} color={Colors.primary} />
        <Text style={styles.infoBannerText}>
          Toutes les communications passent par l'administrateur. Propriétaires et chercheurs ne peuvent pas s'écrire directement.
        </Text>
      </View>

      {loading ? (
        <RowSkeletonList count={5} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptyText}>
            Vos échanges avec les propriétaires et candidats apparaîtront ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.conversationItem} onPress={() => router.push(`/conversation/${item.id}` as any)}>
              <View style={styles.convIcon}>
                <House size={20} color={Colors.primary} />
              </View>
              <View style={styles.convContent}>
                <Text style={styles.convTitle} numberOfLines={1}>
                  {item.property?.title || 'Bien immobilier'}
                </Text>
                <Text style={styles.convSubtitle}>
                  {item.other_party_label} • {formatDate(item.last_message_at)}
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
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
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  privacyText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.saleLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoBannerText: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 },
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
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  convIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.saleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convContent: { flex: 1 },
  convTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  convSubtitle: { fontSize: 12, color: Colors.textSecondary },
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
