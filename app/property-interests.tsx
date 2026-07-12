import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, Clock, CircleCheck as CheckCircle, CircleX, Eye,
  MessageCircle, X, User, Calendar, Lock, Shield,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { RowSkeletonList } from '@/components/common/Skeleton';

interface InterestDetail {
  id: string;
  status: string;
  message: string;
  created_at: string;
  tenant: {
    id: string;
    anonymous_id: string;
    display_name: string;
    bio: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'En attente', color: Colors.warning, bg: Colors.warningLight, icon: Clock },
  reviewed: { label: 'Examinee', color: Colors.info, bg: Colors.infoLight, icon: Eye },
  accepted: { label: 'Acceptee', color: Colors.success, bg: Colors.successLight, icon: CheckCircle },
  rejected: { label: 'Refusee', color: Colors.error, bg: Colors.errorLight, icon: CircleX },
};

export default function PropertyInterestsScreen() {
  const { propertyId, propertyTitle } = useLocalSearchParams<{ propertyId: string; propertyTitle: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [interests, setInterests] = useState<InterestDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<InterestDetail | null>(null);

  const fetchInterests = useCallback(async () => {
    if (!user || !propertyId) return;
    setLoading(true);
    const { data } = await supabase
      .from('tenant_interests')
      .select(`
        id, status, message, created_at,
        tenant:profiles!tenant_interests_tenant_id_fkey(id, anonymous_id, display_name, bio)
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    if (data) setInterests(data as any);
    setLoading(false);
  }, [user, propertyId]);

  useFocusEffect(useCallback(() => { fetchInterests(); }, [fetchInterests]));

  const handleUpdateStatus = async (interestId: string, newStatus: string, tenantId: string) => {
    if (!user) return;
    setProcessingId(interestId);

    await supabase
      .from('tenant_interests')
      .update({ status: newStatus })
      .eq('id', interestId);

    if (newStatus === 'accepted') {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('conversations').insert({
          property_id: propertyId,
          tenant_id: tenantId,
          owner_id: user.id,
          interest_id: interestId,
          status: 'active',
          last_message_at: new Date().toISOString(),
        });
      }
    }

    setInterests(prev => prev.map(i => i.id === interestId ? { ...i, status: newStatus } : i));
    setProcessingId(null);
    setSelectedInterest(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const pendingCount = interests.filter(i => i.status === 'pending').length;
  const acceptedCount = interests.filter(i => i.status === 'accepted').length;

  const renderItem = ({ item }: { item: InterestDetail }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const StatusIcon = status.icon;

    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelectedInterest(item)} activeOpacity={0.9}>
        <View style={styles.cardHeader}>
          <View style={styles.candidateRow}>
            <View style={styles.avatarPlaceholder}>
              <User size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.candidateName}>{item.tenant?.anonymous_id || 'Candidat anonyme'}</Text>
              <View style={styles.dateRow}>
                <Calendar size={10} color={Colors.textTertiary} />
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <StatusIcon size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {item.message ? (
          <Text style={styles.messagePreview} numberOfLines={2}>{item.message}</Text>
        ) : (
          <Text style={styles.noMessage}>Aucun message</Text>
        )}

        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleUpdateStatus(item.id, 'accepted', item.tenant?.id || '')}
              disabled={processingId === item.id}
            >
              <CheckCircle size={14} color={Colors.textInverse} />
              <Text style={styles.acceptBtnText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleUpdateStatus(item.id, 'rejected', item.tenant?.id || '')}
              disabled={processingId === item.id}
            >
              <CircleX size={14} color={Colors.error} />
              <Text style={styles.rejectBtnText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'accepted' && (
          <TouchableOpacity
            style={styles.chatRow}
            onPress={async () => {
              const { data: conv } = await supabase
                .from('conversations')
                .select('id')
                .eq('property_id', propertyId)
                .eq('tenant_id', item.tenant?.id)
                .eq('owner_id', user!.id)
                .maybeSingle();
              if (conv) router.push(`/conversation/${conv.id}` as any);
            }}
          >
            <MessageCircle size={14} color={Colors.primary} />
            <Text style={styles.chatRowText}>Ouvrir la conversation</Text>
          </TouchableOpacity>
        )}
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
          <Text style={styles.headerTitle}>Candidatures</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{propertyTitle || 'Bien immobilier'}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{interests.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.warning }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{acceptedCount}</Text>
          <Text style={styles.statLabel}>Acceptees</Text>
        </View>
      </View>

      <View style={styles.privacyNote}>
        <Shield size={14} color={Colors.primary} />
        <Text style={styles.privacyText}>
          Les identites sont masquees. En acceptant un candidat, une conversation anonyme sera creee automatiquement.
        </Text>
      </View>

      {loading ? (
        <RowSkeletonList count={4} />
      ) : interests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Aucune candidature</Text>
          <Text style={styles.emptyText}>
            Les candidats interesses par votre bien apparaitront ici.
          </Text>
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

      <Modal visible={!!selectedInterest} transparent animationType="slide" onRequestClose={() => setSelectedInterest(null)}>
        <TouchableOpacity style={modalStyles.backdrop} onPress={() => setSelectedInterest(null)} activeOpacity={1}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Detail du candidat</Text>
              <TouchableOpacity onPress={() => setSelectedInterest(null)}>
                <X size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedInterest && (
              <View style={modalStyles.content}>
                <View style={modalStyles.profileRow}>
                  <View style={modalStyles.avatarLarge}>
                    <User size={28} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={modalStyles.anonId}>{selectedInterest.tenant?.anonymous_id || 'Anonyme'}</Text>
                    <Text style={modalStyles.dateLabel}>{formatDate(selectedInterest.created_at)}</Text>
                  </View>
                </View>

                {selectedInterest.tenant?.bio ? (
                  <View style={modalStyles.bioSection}>
                    <Text style={modalStyles.bioLabel}>Presentation</Text>
                    <Text style={modalStyles.bioText}>{selectedInterest.tenant.bio}</Text>
                  </View>
                ) : null}

                {selectedInterest.message ? (
                  <View style={modalStyles.msgSection}>
                    <Text style={modalStyles.msgLabel}>Message du candidat</Text>
                    <Text style={modalStyles.msgText}>{selectedInterest.message}</Text>
                  </View>
                ) : null}

                {selectedInterest.status === 'pending' && (
                  <View style={modalStyles.actionRow}>
                    <TouchableOpacity
                      style={modalStyles.acceptBtn}
                      onPress={() => handleUpdateStatus(selectedInterest.id, 'accepted', selectedInterest.tenant?.id || '')}
                      disabled={processingId === selectedInterest.id}
                    >
                      <CheckCircle size={16} color={Colors.textInverse} />
                      <Text style={modalStyles.acceptBtnText}>Accepter le candidat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={modalStyles.rejectBtn}
                      onPress={() => handleUpdateStatus(selectedInterest.id, 'rejected', selectedInterest.tenant?.id || '')}
                      disabled={processingId === selectedInterest.id}
                    >
                      <CircleX size={16} color={Colors.error} />
                      <Text style={modalStyles.rejectBtnText}>Refuser</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.saleLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  privacyText: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  list: { padding: 16 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14,
    padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  candidateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarPlaceholder: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.saleLight,
    alignItems: 'center', justifyContent: 'center',
  },
  candidateName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dateText: { fontSize: 11, color: Colors.textTertiary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  messagePreview: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 10 },
  noMessage: { fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.success, paddingVertical: 10, borderRadius: 10,
  },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textInverse },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.errorLight, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: Colors.error },
  chatRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.saleLight, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  chatRowText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  content: { padding: 20 },
  profileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20,
  },
  avatarLarge: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.saleLight,
    alignItems: 'center', justifyContent: 'center',
  },
  anonId: { fontSize: 16, fontWeight: '700', color: Colors.text },
  dateLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  bioSection: { marginBottom: 16 },
  bioLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  bioText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  msgSection: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: 12, padding: 14, marginBottom: 20,
  },
  msgLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  msgText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  actionRow: { gap: 10 },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.success, paddingVertical: 14, borderRadius: 12,
  },
  acceptBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textInverse },
  rejectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.errorLight, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  rejectBtnText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
