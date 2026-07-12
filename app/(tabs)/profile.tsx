import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { User, Bell, Shield, LogOut, ChevronRight, Building2, Heart, FileText, Star, LogIn, Crown, Briefcase, TrendingUp, CircleCheck as CheckCircle, Settings, House } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ROLE_CONFIGS, isPublisher, isSearcher } from '@/lib/types';

interface ProfileStat {
  label: string;
  value: number;
}

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const { isPremium, currentPlan, isTrialActive } = useSubscription();
  const router = useRouter();
  const [stats, setStats] = useState<ProfileStat[]>([]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const [favRes, interestRes, propRes] = await Promise.all([
      supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('tenant_interests').select('id', { count: 'exact' }).eq('tenant_id', user.id),
      supabase.from('properties').select('id', { count: 'exact' }).eq('owner_id', user.id),
    ]);
    const statList: ProfileStat[] = [
      { label: 'Favoris', value: favRes.count || 0 },
    ];
    if (profile && isSearcher(profile.role)) {
      statList.push({ label: 'Demandes', value: interestRes.count || 0 });
    }
    if (profile && isPublisher(profile.role)) {
      statList.push({ label: 'Annonces', value: propRes.count || 0 });
    }
    setStats(statList);
  }, [user, profile]);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  if (!user || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <User size={40} color={Colors.primary} />
          </View>
          <Text style={styles.authTitle}>Gerez votre compte</Text>
          <Text style={styles.authText}>
            Connectez-vous pour acceder a votre profil, vos annonces et vos demandes.
          </Text>
          <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/(auth)/login' as any)}>
            <LogIn size={18} color={Colors.textInverse} />
            <Text style={styles.authBtnText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
            <Text style={styles.registerLink}>Creer un compte</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const roleCfg = ROLE_CONFIGS[profile.role];
  const roleColor = roleCfg.color;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={Colors.gradientPrimary as any} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {(profile.display_name || 'U').slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            {profile.is_verified && (
              <View style={styles.verifiedBadge}>
                <Star size={10} color={Colors.textInverse} fill={Colors.textInverse} />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{profile.display_name || 'Utilisateur'}</Text>
          {profile.agency_name ? (
            <Text style={styles.agencyName}>{profile.agency_name}</Text>
          ) : null}
          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + '30', borderColor: roleColor + '60' }]}>
              <Text style={[styles.roleText, { color: Colors.textInverse }]}>{roleCfg.labelFr}</Text>
            </View>
            {roleCfg.isPro && (
              <View style={styles.proBadge}>
                <Briefcase size={10} color={Colors.textInverse} />
                <Text style={styles.proBadgeText}>Pro</Text>
              </View>
            )}
            {profile.kyc_verified && (
              <View style={styles.kycBadge}>
                <CheckCircle size={10} color={Colors.success} />
                <Text style={styles.kycBadgeText}>KYC</Text>
              </View>
            )}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={12} color={Colors.accent} />
                <Text style={styles.premiumBadgeText}>
                  {isTrialActive ? 'Essai' : 'Premium'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.anonymousId}>ID: {profile.anonymous_id}</Text>
        </LinearGradient>

        {!isPremium && isPublisher(profile.role) && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => router.push('/subscription' as any)}>
            <View style={styles.upgradeBannerIcon}>
              <Crown size={18} color={Colors.accent} />
            </View>
            <View style={styles.upgradeBannerContent}>
              <Text style={styles.upgradeBannerTitle}>Passez en Premium</Text>
              <Text style={styles.upgradeBannerText}>7 jours d'essai gratuit</Text>
            </View>
            <ChevronRight size={18} color={Colors.accent} />
          </TouchableOpacity>
        )}

        {roleCfg.isPro && !profile.kyc_verified && (
          <TouchableOpacity style={styles.kycBanner} onPress={() => {}}>
            <View style={styles.kycBannerIcon}>
              <Shield size={18} color={Colors.warning} />
            </View>
            <View style={styles.kycBannerContent}>
              <Text style={styles.kycBannerTitle}>Vérification KYC requise</Text>
              <Text style={styles.kycBannerText}>Validez votre identité professionnelle</Text>
            </View>
            <ChevronRight size={18} color={Colors.warning} />
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          {stats.map((stat, i) => (
            <View key={i} style={[styles.statItem, i < stats.length - 1 && styles.statItemBorder]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activite</Text>
          <MenuRow icon={<Heart size={18} color={Colors.error} />} label="Mes Favoris" onPress={() => router.push('/(tabs)/favorites' as any)} />
          {isPublisher(profile.role) && (
            <MenuRow icon={<Building2 size={18} color={Colors.accent} />} label="Mes Annonces" onPress={() => router.push('/my-listings' as any)} />
          )}
          {isSearcher(profile.role) && (
            <MenuRow icon={<FileText size={18} color={Colors.primary} />} label="Mes Demandes" onPress={() => router.push('/my-requests' as any)} />
          )}
          {profile.role === 'agent' && (
            <MenuRow
              icon={<TrendingUp size={18} color='#7C3AED' />}
              label="Commissions & KPI"
              badge={`${Math.round((profile.commission_rate || 0.5) * 100)}% split`}
              onPress={() => {}}
            />
          )}
          {profile.role === 'investor' && (
            <MenuRow
              icon={<TrendingUp size={18} color='#B45309' />}
              label="Portefeuille & IRR"
              onPress={() => {}}
            />
          )}
          {profile.role === 'admin' && (
            <MenuRow
              icon={<Settings size={18} color={Colors.text} />}
              label="Tableau de bord Admin"
              badge="Admin"
              onPress={() => router.push('/admin' as any)}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <MenuRow
            icon={<Crown size={18} color={Colors.accent} />}
            label="Abonnement"
            onPress={() => router.push('/subscription' as any)}
            badge={isPremium ? 'Premium' : 'Gratuit'}
          />
          <MenuRow icon={<User size={18} color={Colors.textSecondary} />} label="Modifier le profil" onPress={() => router.push('/edit-profile' as any)} />
          <MenuRow icon={<Bell size={18} color={Colors.textSecondary} />} label="Notifications" onPress={() => {}} />
          <MenuRow icon={<Shield size={18} color={Colors.textSecondary} />} label="Confidentialite et securite" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <LogOut size={18} color={Colors.error} />
            <Text style={styles.signOutText}>Se deconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <House size={16} color={Colors.textTertiary} />
          <Text style={styles.footerText}>1 Futur Chez Vous - 2025</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function MenuRow({ icon, label, onPress, badge }: { icon: React.ReactNode; label: string; onPress: () => void; badge?: string }) {
  return (
    <TouchableOpacity style={menuStyles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={menuStyles.iconContainer}>{icon}</View>
      <Text style={menuStyles.label}>{label}</Text>
      {badge && (
        <View style={menuStyles.badge}>
          <Text style={menuStyles.badgeText}>{badge}</Text>
        </View>
      )}
      <ChevronRight size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  badge: {
    paddingVertical: 3, paddingHorizontal: 8,
    backgroundColor: Colors.accentLight + '20',
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.accent },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  profileHeader: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 6,
  },
  avatarContainer: { position: 'relative', marginBottom: 4 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.textInverse },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: Colors.textInverse },
  verifiedBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  profileName: { fontSize: 22, fontWeight: '800', color: Colors.textInverse },
  agencyName: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', justifyContent: 'center' },
  roleBadge: {
    paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
  },
  roleText: { fontSize: 12, fontWeight: '700' },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  proBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textInverse },
  kycBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
  },
  kycBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12,
    backgroundColor: 'rgba(232,146,10,0.2)',
    borderWidth: 1, borderColor: 'rgba(232,146,10,0.4)',
  },
  premiumBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.accent },
  anonymousId: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' },
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 12, padding: 14,
    backgroundColor: Colors.accentLight + '15', borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accent + '30',
  },
  upgradeBannerIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.accentLight + '25',
    alignItems: 'center', justifyContent: 'center',
  },
  upgradeBannerContent: { flex: 1 },
  upgradeBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  upgradeBannerText: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  kycBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 8, padding: 14,
    backgroundColor: Colors.warningLight,
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warning + '40',
  },
  kycBannerIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  kycBannerContent: { flex: 1 },
  kycBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  kycBannerText: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginTop: 12,
  },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: 18,
  },
  statItemBorder: {
    borderRightWidth: 1, borderRightColor: Colors.border,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  section: {
    backgroundColor: Colors.surface,
    marginTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: Colors.error },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 24,
  },
  footerText: { fontSize: 12, color: Colors.textTertiary },
  authPrompt: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12,
  },
  authIconContainer: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: Colors.saleLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  authTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  authText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  authBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, marginTop: 8,
  },
  authBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textInverse },
  registerLink: {
    fontSize: 14, color: Colors.primary, fontWeight: '600', textDecorationLine: 'underline',
  },
});
