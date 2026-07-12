import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, RefreshControl, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Building2, Users, CircleCheck as CheckCircle, Circle as XCircle, Clock, TrendingUp, Eye, TriangleAlert as AlertTriangle, ChevronRight, Shield, UserX, Ban, Trash2, Crown, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { Property, Profile, UserRole, ROLE_CONFIGS } from '@/lib/types';

interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  pendingProperties: number;
  activeProperties: number;
  totalInterests: number;
  totalSubscriptions: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'users'>('overview');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <View style={styles.accessDenied}>
          <Shield size={48} color={Colors.error} />
          <Text style={styles.accessDeniedTitle}>Accès refusé</Text>
          <Text style={styles.accessDeniedText}>Vous n'avez pas les droits pour accéder à cette page.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const fetchData = useCallback(async () => {
    const [
      usersRes, propertiesRes, pendingRes, activeRes, interestsRes, subsRes, pendingListRes, usersListRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('properties').select('id', { count: 'exact' }),
      supabase.from('properties').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('properties').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('tenant_interests').select('id', { count: 'exact' }),
      supabase.from('user_subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('properties')
        .select('*, city:cities(name), commune:communes(name), property_images(url, is_primary)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      totalProperties: propertiesRes.count || 0,
      pendingProperties: pendingRes.count || 0,
      activeProperties: activeRes.count || 0,
      totalInterests: interestsRes.count || 0,
      totalSubscriptions: subsRes.count || 0,
    });

    if (pendingListRes.data) setPendingProperties(pendingListRes.data as unknown as Property[]);
    if (usersListRes.data) setRecentUsers(usersListRes.data as Profile[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleApprove = async (propertyId: string) => {
    await supabase.from('properties').update({ status: 'active' }).eq('id', propertyId);
    setPendingProperties(prev => prev.filter(p => p.id !== propertyId));
    setStats(prev => prev ? { ...prev, pendingProperties: prev.pendingProperties - 1, activeProperties: prev.activeProperties + 1 } : prev);
  };

  const handleReject = async (propertyId: string) => {
    await supabase.from('properties').update({ status: 'inactive' }).eq('id', propertyId);
    setPendingProperties(prev => prev.filter(p => p.id !== propertyId));
    setStats(prev => prev ? { ...prev, pendingProperties: prev.pendingProperties - 1 } : prev);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleUserAction = async (action: 'suspend' | 'ban' | 'delete' | 'activate', userId: string) => {
    setUserActionLoading(true);
    if (action === 'delete') {
      await supabase.from('profiles').delete().eq('id', userId);
      setRecentUsers(prev => prev.filter(u => u.id !== userId));
    } else {
      const statusMap = { suspend: 'suspended', ban: 'banned', activate: 'active' };
      await supabase.from('profiles').update({ status: statusMap[action] }).eq('id', userId);
      setRecentUsers(prev => prev.map(u => u.id === userId ? { ...u, status: statusMap[action] as any } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, status: statusMap[action] as any } : prev);
      }
    }
    setUserActionLoading(false);
    if (action === 'delete') { setShowUserModal(false); setSelectedUser(null); }
  };

  const handlePromoteRole = async (userId: string, newRole: UserRole) => {
    setUserActionLoading(true);
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    setRecentUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, role: newRole } : prev);
    }
    setUserActionLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tableau de bord</Text>
          <View style={styles.adminBadge}>
            <Shield size={10} color={Colors.textInverse} />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'overview', label: 'Vue d\'ensemble' },
          { key: 'properties', label: 'Annonces' },
          { key: 'users', label: 'Utilisateurs' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.key === 'properties' && (stats?.pendingProperties || 0) > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{stats?.pendingProperties}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      >
        {activeTab === 'overview' && stats && (
          <View>
            <Text style={styles.sectionLabel}>Statistiques globales</Text>
            <View style={styles.statsGrid}>
              <StatCard icon={<Users size={20} color={Colors.primary} />} label="Utilisateurs" value={stats.totalUsers} color={Colors.primary} />
              <StatCard icon={<Building2 size={20} color={Colors.accent} />} label="Annonces" value={stats.totalProperties} color={Colors.accent} />
              <StatCard icon={<Clock size={20} color={Colors.warning} />} label="En attente" value={stats.pendingProperties} color={Colors.warning} urgent={stats.pendingProperties > 0} />
              <StatCard icon={<CheckCircle size={20} color={Colors.success} />} label="Actives" value={stats.activeProperties} color={Colors.success} />
              <StatCard icon={<TrendingUp size={20} color={Colors.info} />} label="Demandes" value={stats.totalInterests} color={Colors.info} />
              <StatCard icon={<Eye size={20} color='#7C3AED' />} label="Abonnements" value={stats.totalSubscriptions} color='#7C3AED' />
            </View>

            {stats.pendingProperties > 0 && (
              <TouchableOpacity style={styles.alertBanner} onPress={() => setActiveTab('properties')}>
                <AlertTriangle size={18} color={Colors.warning} />
                <Text style={styles.alertBannerText}>
                  {stats.pendingProperties} annonce{stats.pendingProperties > 1 ? 's' : ''} en attente de validation
                </Text>
                <ChevronRight size={16} color={Colors.warning} />
              </TouchableOpacity>
            )}

            <Text style={styles.sectionLabel}>Accès rapides</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('properties')}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.warningLight }]}>
                  <Clock size={22} color={Colors.warning} />
                </View>
                <Text style={styles.quickActionLabel}>Valider les annonces</Text>
                <ChevronRight size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('users')}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.infoLight }]}>
                  <Users size={22} color={Colors.info} />
                </View>
                <Text style={styles.quickActionLabel}>Gérer les utilisateurs</Text>
                <ChevronRight size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'properties' && (
          <View>
            <Text style={styles.sectionLabel}>
              Annonces en attente ({pendingProperties.length})
            </Text>
            {pendingProperties.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle size={40} color={Colors.success} />
                <Text style={styles.emptyStateTitle}>Tout est à jour !</Text>
                <Text style={styles.emptyStateText}>Aucune annonce en attente de validation.</Text>
              </View>
            ) : (
              pendingProperties.map(property => (
                <PropertyModerationCard
                  key={property.id}
                  property={property}
                  onApprove={() => handleApprove(property.id)}
                  onReject={() => handleReject(property.id)}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'users' && (
          <View>
            <Text style={styles.sectionLabel}>
              Utilisateurs récents ({recentUsers.length})
            </Text>
            {recentUsers.map(u => (
              <UserRow
                key={u.id}
                user={u}
                onPress={() => { setSelectedUser(u); setShowUserModal(true); }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {selectedUser && (
        <Modal visible={showUserModal} transparent animationType="slide" onRequestClose={() => setShowUserModal(false)}>
          <TouchableOpacity style={modalStyles.backdrop} onPress={() => setShowUserModal(false)} activeOpacity={1}>
            <View style={modalStyles.sheet}>
              <View style={modalStyles.header}>
                <Text style={modalStyles.title}>Gérer l'utilisateur</Text>
                <TouchableOpacity onPress={() => setShowUserModal(false)}>
                  <XCircle size={22} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <View style={modalStyles.userInfo}>
                <View style={[modalStyles.avatar, { backgroundColor: (roleColors[selectedUser.role] || Colors.textTertiary) + '20' }]}>
                  <Text style={[modalStyles.avatarText, { color: roleColors[selectedUser.role] || Colors.textTertiary }]}>
                    {(selectedUser.display_name || 'U').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.userName}>{selectedUser.display_name || 'Utilisateur'}</Text>
                  <Text style={modalStyles.userRole}>Rôle : {selectedUser.role}</Text>
                  <Text style={modalStyles.userStatus}>Statut : {(selectedUser as any).status || 'active'}</Text>
                </View>
              </View>

              <Text style={modalStyles.sectionLabel}>ACTIONS</Text>
              <View style={modalStyles.actionsGrid}>
                <TouchableOpacity
                  style={[modalStyles.actionBtn, { borderColor: Colors.warning + '60' }]}
                  onPress={() => handleUserAction((selectedUser as any).status === 'suspended' ? 'activate' : 'suspend', selectedUser.id)}
                  disabled={userActionLoading}
                >
                  <UserX size={18} color={Colors.warning} />
                  <Text style={[modalStyles.actionBtnText, { color: Colors.warning }]}>
                    {(selectedUser as any).status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.actionBtn, { borderColor: Colors.error + '60' }]}
                  onPress={() => handleUserAction((selectedUser as any).status === 'banned' ? 'activate' : 'ban', selectedUser.id)}
                  disabled={userActionLoading}
                >
                  <Ban size={18} color={Colors.error} />
                  <Text style={[modalStyles.actionBtnText, { color: Colors.error }]}>
                    {(selectedUser as any).status === 'banned' ? 'Débannir' : 'Bannir'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={modalStyles.sectionLabel}>PROMOUVOIR LE RÔLE</Text>
              <View style={modalStyles.rolesGrid}>
                {(['tenant', 'buyer', 'owner', 'seller', 'agent', 'promoter', 'investor', 'admin'] as UserRole[]).map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[modalStyles.roleBtn, selectedUser.role === role && modalStyles.roleBtnActive]}
                    onPress={() => handlePromoteRole(selectedUser.id, role)}
                    disabled={userActionLoading || selectedUser.role === role}
                  >
                    <Text style={[modalStyles.roleBtnText, selectedUser.role === role && modalStyles.roleBtnTextActive]}>
                      {ROLE_CONFIGS[role].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={modalStyles.deleteBtn}
                onPress={() => handleUserAction('delete', selectedUser.id)}
                disabled={userActionLoading}
              >
                <Trash2 size={16} color={Colors.textInverse} />
                <Text style={modalStyles.deleteBtnText}>Supprimer le compte</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const roleColors: Record<string, string> = {
  admin: '#374151', tenant: '#0F3D68', owner: '#C9962B', buyer: '#0D7490',
  seller: '#DC6B2F', agent: '#7C3AED', promoter: '#059669', investor: '#B45309',
};

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  userInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  userName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  userRole: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  userStatus: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1,
    marginHorizontal: 20, marginTop: 16, marginBottom: 10,
  },
  actionsGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, backgroundColor: Colors.surfaceSecondary,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  roleBtn: {
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1, borderColor: Colors.border,
  },
  roleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  roleBtnTextActive: { color: Colors.textInverse },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 20, marginTop: 16,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.error,
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textInverse },
});

function StatCard({ icon, label, value, color, urgent }: { icon: React.ReactNode; label: string; value: number; color: string; urgent?: boolean }) {
  return (
    <View style={[statStyles.card, urgent && statStyles.cardUrgent]}>
      <View style={[statStyles.iconBox, { backgroundColor: color + '18' }]}>{icon}</View>
      <Text style={statStyles.value}>{value.toLocaleString()}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardUrgent: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warningLight,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  value: { fontSize: 22, fontWeight: '800', color: Colors.text },
  label: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
});

function PropertyModerationCard({ property, onApprove, onReject }: { property: any; onApprove: () => void; onReject: () => void }) {
  const city = (property as any).city?.name || '';
  const commune = (property as any).commune?.name || '';
  return (
    <View style={propStyles.card}>
      <View style={propStyles.header}>
        <View style={propStyles.headerLeft}>
          <Text style={propStyles.title} numberOfLines={1}>{property.title}</Text>
          <Text style={propStyles.location}>{[commune, city].filter(Boolean).join(', ')}</Text>
        </View>
        <View style={propStyles.typeBadge}>
          <Text style={propStyles.typeBadgeText}>
            {property.listing_type === 'rent' ? 'Location' : 'Vente'}
          </Text>
        </View>
      </View>
      <View style={propStyles.details}>
        <Text style={propStyles.price}>{property.price?.toLocaleString()} USD</Text>
        <Text style={propStyles.meta}>
          {property.bedrooms}ch · {property.bathrooms}bain · {property.surface_area}m²
        </Text>
      </View>
      <Text style={propStyles.description} numberOfLines={2}>{property.description || 'Aucune description'}</Text>
      <View style={propStyles.actions}>
        <TouchableOpacity style={propStyles.rejectBtn} onPress={onReject}>
          <XCircle size={16} color={Colors.error} />
          <Text style={propStyles.rejectBtnText}>Rejeter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={propStyles.approveBtn} onPress={onApprove}>
          <CheckCircle size={16} color={Colors.textInverse} />
          <Text style={propStyles.approveBtnText}>Approuver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const propStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  headerLeft: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text },
  location: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  typeBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 8,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  details: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: '800', color: Colors.accent },
  meta: { fontSize: 12, color: Colors.textTertiary },
  description: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: Colors.error },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.success,
  },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textInverse },
});

function UserRow({ user, onPress }: { user: Profile; onPress?: () => void }) {
  const color = roleColors[user.role] || Colors.textTertiary;
  const status = (user as any).status || 'active';
  const statusColor = status === 'banned' ? Colors.error : status === 'suspended' ? Colors.warning : Colors.success;
  return (
    <TouchableOpacity style={userStyles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={[userStyles.avatar, { backgroundColor: color + '20' }]}>
        <Text style={[userStyles.avatarText, { color }]}>
          {(user.display_name || 'U').slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={userStyles.info}>
        <Text style={userStyles.name}>{user.display_name || 'Utilisateur'}</Text>
        <Text style={userStyles.id} numberOfLines={1}>ID: {user.anonymous_id}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[userStyles.roleBadge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
          <Text style={[userStyles.roleText, { color }]}>{user.role}</Text>
        </View>
        <View style={[userStyles.statusDot, { backgroundColor: statusColor + '20', borderColor: statusColor + '40' }]}>
          <Text style={[userStyles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const userStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text },
  id: { fontSize: 11, color: Colors.textTertiary, marginTop: 1, fontFamily: 'monospace' },
  roleBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  roleText: { fontSize: 11, fontWeight: '700' },
  statusDot: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 3,
    backgroundColor: Colors.text,
    borderRadius: 8,
  },
  adminBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textInverse },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textTertiary },
  tabTextActive: { color: Colors.primary },
  tabBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.warning,
    alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.textInverse },
  content: { flex: 1 },
  contentPadding: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 12, marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16,
    justifyContent: 'space-between',
  },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.warning + '40',
  },
  alertBannerText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  quickActions: {
    backgroundColor: Colors.surface,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  quickActionIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  emptyState: {
    alignItems: 'center', paddingVertical: 48, gap: 10,
  },
  emptyStateTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptyStateText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  accessDenied: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12,
  },
  accessDeniedTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  accessDeniedText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  backBtn: {
    marginTop: 8, paddingVertical: 12, paddingHorizontal: 32,
    backgroundColor: Colors.primary, borderRadius: 12,
  },
  backBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textInverse },
});
