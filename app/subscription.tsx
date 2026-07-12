import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Crown, Check, X, Zap, Shield, Eye, Bell, Star, TrendingUp, Briefcase, ChartBar as BarChart2, Building2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { supabase } from '@/lib/supabase';
import { PaymentMethod, ROLE_CONFIGS } from '@/lib/types';

const PAYMENT_METHODS: { id: PaymentMethod; name: string; color: string }[] = [
  { id: 'mpesa', name: 'M-Pesa (Vodacom)', color: '#E60000' },
  { id: 'airtel', name: 'Airtel Money', color: '#ED1C24' },
  { id: 'orange', name: 'Orange Money', color: '#FF6600' },
];

interface FeatureRow {
  icon: React.ComponentType<any>;
  free: string;
  premium: string;
}

const FEATURES_BY_ROLE: Record<string, FeatureRow[]> = {
  tenant: [
    { icon: Eye, free: '5 recherches/jour', premium: 'Recherches illimitees' },
    { icon: Bell, free: 'Pas d\'alertes', premium: 'Alertes push personnalisees' },
    { icon: Star, free: '3 interets/semaine', premium: 'Interets illimites' },
    { icon: Zap, free: 'Publicites', premium: 'Sans publicites' },
    { icon: Shield, free: 'Visites standard', premium: 'Visites prioritaires' },
  ],
  buyer: [
    { icon: Eye, free: '5 recherches/jour', premium: 'Recherches illimitees' },
    { icon: Bell, free: 'Pas d\'alertes', premium: 'Alertes push achat' },
    { icon: TrendingUp, free: 'Pas de simulation', premium: 'Simulation pret bancaire' },
    { icon: Zap, free: 'Publicites', premium: 'Sans publicites' },
    { icon: Shield, free: 'Visites standard', premium: 'Visites prioritaires' },
  ],
  owner: [
    { icon: Building2, free: '1 annonce', premium: 'Annonces illimitees' },
    { icon: Zap, free: 'Pas de boost', premium: 'Boost de visibilite' },
    { icon: BarChart2, free: 'Stats basiques', premium: 'Stats detaillees des leads' },
  ],
  seller: [
    { icon: Building2, free: '1 annonce vente', premium: 'Ventes illimitees' },
    { icon: Zap, free: 'Pas de boost', premium: 'Boost de visibilite' },
    { icon: BarChart2, free: 'Stats basiques', premium: 'Gestion offres concurrentes' },
  ],
  agent: [
    { icon: Building2, free: '3 biens geres', premium: 'Biens illimites' },
    { icon: TrendingUp, free: 'Split 50/50', premium: 'Split optimise + KPI' },
    { icon: BarChart2, free: 'Pas de stats', premium: 'Tableau de bord commissions' },
    { icon: Bell, free: 'Alertes basiques', premium: 'Alertes temps reel' },
  ],
  promoter: [
    { icon: Building2, free: '1 projet', premium: 'Projets illimites' },
    { icon: Zap, free: 'Pas de boost', premium: 'Boost promotions' },
    { icon: BarChart2, free: 'Stats basiques', premium: 'CA promos + analytics' },
    { icon: Bell, free: 'Alertes basiques', premium: 'Alertes investisseurs' },
  ],
  investor: [
    { icon: TrendingUp, free: '10 recherches/jour', premium: 'Recherches illimitees' },
    { icon: BarChart2, free: 'Pas d\'analytics', premium: 'Portefeuille + IRR' },
    { icon: Building2, free: 'Simulation basique', premium: 'Simulations pret avancees' },
    { icon: Bell, free: 'Alertes basiques', premium: 'Alertes opportunites' },
  ],
  admin: [
    { icon: Shield, free: 'Acces complet', premium: 'Acces complet' },
  ],
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { plans, currentSubscription, isPremium, refreshSubscription } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const role = profile?.role || 'tenant';
  const roleCfg = ROLE_CONFIGS[role];
  const rolePlans = plans.filter(p => p.target_role === role);
  const freePlan = rolePlans.find(p => p.price_cdf === 0);
  const premiumPlan = rolePlans.find(p => p.price_cdf > 0);
  const features = FEATURES_BY_ROLE[role] || FEATURES_BY_ROLE['tenant'];

  const handleSelectPremium = () => {
    if (!premiumPlan) return;
    setSelectedPlanId(premiumPlan.id);
    setShowPaymentModal(true);
  };

  const handleSubscribe = async () => {
    if (!user || !selectedPlanId || !selectedPayment) return;
    setProcessing(true);

    const ref = `${selectedPayment.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await supabase.from('user_subscriptions').insert({
      user_id: user.id,
      plan_id: selectedPlanId,
      status: 'trial',
      payment_method: selectedPayment,
      payment_reference: ref,
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await refreshSubscription();
    setProcessing(false);
    setSuccess(true);
    setShowPaymentModal(false);
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Crown size={40} color={Colors.accent} />
          </View>
          <Text style={styles.successTitle}>Bienvenue en Premium !</Text>
          <Text style={styles.successText}>
            Votre essai gratuit de 7 jours est active. Profitez de toutes les fonctionnalites premium.
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={() => router.back()}>
            <Text style={styles.successBtnText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const heroCopy = {
    tenant: 'Trouvez votre bien plus vite',
    buyer: 'Achetez au meilleur prix',
    owner: 'Maximisez vos leads locatifs',
    seller: 'Vendez plus rapidement',
    agent: 'Gerez plus de biens, gagnez plus',
    promoter: 'Accelerez vos projets',
    investor: 'Optimisez votre portefeuille',
    admin: 'Acces complet',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonnements</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={Colors.gradientPrimary as any} style={styles.heroBanner}>
          <Crown size={32} color={Colors.accent} />
          <Text style={styles.heroTitle}>{heroCopy[role] || heroCopy.tenant}</Text>
          <View style={[styles.roleChip, { backgroundColor: roleCfg.color + '30', borderColor: roleCfg.color + '60' }]}>
            <Text style={[styles.roleChipText, { color: Colors.textInverse }]}>{roleCfg.labelFr}</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Passez en Premium pour debloquer toutes les fonctionnalites
          </Text>
          {isPremium && (
            <View style={styles.activeBadge}>
              <Check size={14} color={Colors.success} />
              <Text style={styles.activeBadgeText}>Abonnement actif</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>Comparaison des plans</Text>

          <View style={styles.comparisonHeader}>
            <View style={styles.comparisonHeaderLeft} />
            <View style={styles.comparisonHeaderPlan}>
              <Text style={styles.planHeaderText}>Gratuit</Text>
            </View>
            <View style={[styles.comparisonHeaderPlan, styles.comparisonHeaderPremium]}>
              <Crown size={14} color={Colors.accent} />
              <Text style={[styles.planHeaderText, styles.planHeaderTextPremium]}>Premium</Text>
            </View>
          </View>

          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <View key={i} style={styles.comparisonRow}>
                <View style={styles.comparisonFeature}>
                  <Icon size={16} color={Colors.textSecondary} />
                </View>
                <View style={styles.comparisonCell}>
                  <Text style={styles.comparisonFreeText}>{feature.free}</Text>
                </View>
                <View style={[styles.comparisonCell, styles.comparisonCellPremium]}>
                  <Text style={styles.comparisonPremiumText}>{feature.premium}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.plansRow}>
          <View style={styles.planCard}>
            <Text style={styles.planName}>Gratuit</Text>
            <Text style={styles.planPrice}>0 CDF</Text>
            <Text style={styles.planPeriod}>/mois</Text>
            <View style={styles.planDivider} />
            <Text style={styles.planDesc}>{freePlan?.features?.description || 'Fonctionnalites de base'}</Text>
            {!isPremium && (
              <View style={styles.currentPlanBadge}>
                <Text style={styles.currentPlanText}>Plan actuel</Text>
              </View>
            )}
          </View>

          <View style={[styles.planCard, styles.planCardPremium]}>
            <LinearGradient colors={Colors.gradientAccent as any} style={styles.premiumBadgeGradient}>
              <Crown size={12} color={Colors.textInverse} />
              <Text style={styles.premiumBadgeGradientText}>Recommande</Text>
            </LinearGradient>
            <Text style={styles.planName}>Premium</Text>
            <Text style={styles.planPricePremium}>
              {(premiumPlan?.price_cdf || 0).toLocaleString('fr-FR')} CDF
            </Text>
            <Text style={styles.planPeriod}>/mois</Text>
            <Text style={styles.planPriceUsd}>
              ~ ${premiumPlan?.price_usd || 0} USD
            </Text>
            <View style={styles.planDivider} />
            <Text style={styles.planDesc}>{premiumPlan?.features?.description || 'Toutes les fonctionnalites'}</Text>
            <Text style={styles.trialNote}>7 jours d'essai gratuit</Text>

            {isPremium ? (
              <View style={styles.currentPlanBadge}>
                <Check size={14} color={Colors.success} />
                <Text style={[styles.currentPlanText, { color: Colors.success }]}>Actif</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.upgradeBtnInCard} onPress={handleSelectPremium}>
                <Text style={styles.upgradeBtnText}>Essayer gratuitement</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Modes de paiement acceptes</Text>
          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map(pm => (
              <View key={pm.id} style={styles.paymentMethodItem}>
                <View style={[styles.paymentDot, { backgroundColor: pm.color }]} />
                <Text style={styles.paymentMethodName}>{pm.name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.paymentNote}>
            Les paiements sont traites en Francs Congolais (CDF) via Mobile Money.
            Commission de 10% prelevee automatiquement sur chaque transaction immobiliere.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showPaymentModal} transparent animationType="slide" onRequestClose={() => setShowPaymentModal(false)}>
        <TouchableOpacity style={modalStyles.backdrop} onPress={() => setShowPaymentModal(false)} activeOpacity={1}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Choisir le paiement</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.content}>
              <Text style={modalStyles.priceLabel}>
                {(premiumPlan?.price_cdf || 0).toLocaleString('fr-FR')} CDF/mois
              </Text>
              <Text style={modalStyles.trialLabel}>Essai gratuit 7 jours inclus</Text>

              {PAYMENT_METHODS.map(pm => (
                <TouchableOpacity
                  key={pm.id}
                  style={[modalStyles.paymentOption, selectedPayment === pm.id && modalStyles.paymentOptionActive]}
                  onPress={() => setSelectedPayment(pm.id)}
                >
                  <View style={[modalStyles.paymentDot, { backgroundColor: pm.color }]} />
                  <Text style={modalStyles.paymentName}>{pm.name}</Text>
                  {selectedPayment === pm.id && <Check size={18} color={Colors.primary} />}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[modalStyles.confirmBtn, !selectedPayment && modalStyles.confirmBtnDisabled]}
                onPress={handleSubscribe}
                disabled={!selectedPayment || processing}
              >
                {processing ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={modalStyles.confirmBtnText}>Commencer l'essai gratuit</Text>
                )}
              </TouchableOpacity>

              <Text style={modalStyles.termsText}>
                En souscrivant, vous acceptez les conditions d'utilisation.
                Vous serez debite apres la periode d'essai de 7 jours.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scrollContent: { paddingBottom: 40 },
  heroBanner: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.textInverse, textAlign: 'center' },
  roleChip: {
    paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
  },
  roleChipText: { fontSize: 12, fontWeight: '700' },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(16,185,129,0.2)', paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, marginTop: 4,
  },
  activeBadgeText: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  comparisonSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  comparisonHeader: { flexDirection: 'row', marginBottom: 2 },
  comparisonHeaderLeft: { width: 36 },
  comparisonHeaderPlan: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary, borderRadius: 8, marginHorizontal: 3,
  },
  comparisonHeaderPremium: {
    backgroundColor: Colors.accentLight + '20',
    flexDirection: 'row', justifyContent: 'center', gap: 4,
  },
  planHeaderText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  planHeaderTextPremium: { color: Colors.accent },
  comparisonRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingVertical: 10,
  },
  comparisonFeature: { width: 36, alignItems: 'center' },
  comparisonCell: { flex: 1, paddingHorizontal: 6 },
  comparisonCellPremium: { backgroundColor: Colors.accentLight + '08' },
  comparisonFreeText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  comparisonPremiumText: { fontSize: 12, color: Colors.primary, fontWeight: '600', textAlign: 'center' },
  plansRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  planCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16,
    padding: 18, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  planCardPremium: { borderColor: Colors.accent, position: 'relative', paddingTop: 32 },
  premiumBadgeGradient: {
    position: 'absolute', top: -12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20,
  },
  premiumBadgeGradientText: { fontSize: 11, fontWeight: '700', color: Colors.textInverse },
  planName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  planPrice: { fontSize: 24, fontWeight: '800', color: Colors.text },
  planPricePremium: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  planPriceUsd: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  planPeriod: { fontSize: 12, color: Colors.textSecondary, marginTop: -2 },
  planDivider: { width: '100%', height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  planDesc: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  trialNote: { fontSize: 11, color: Colors.success, fontWeight: '600', marginTop: 6 },
  currentPlanBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 12, paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: Colors.surfaceSecondary, borderRadius: 8,
  },
  currentPlanText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  upgradeBtnInCard: {
    marginTop: 12, paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: Colors.primary, borderRadius: 10,
  },
  upgradeBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textInverse },
  paymentSection: { paddingHorizontal: 16, marginBottom: 24 },
  paymentMethods: { gap: 8, marginBottom: 12 },
  paymentMethodItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  paymentDot: { width: 10, height: 10, borderRadius: 5 },
  paymentMethodName: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  paymentNote: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12,
  },
  successIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.accentLight + '20',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  successText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 23 },
  successBtn: {
    marginTop: 16, paddingVertical: 14, paddingHorizontal: 40,
    backgroundColor: Colors.primary, borderRadius: 12,
  },
  successBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textInverse },
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
  priceLabel: { fontSize: 24, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  trialLabel: { fontSize: 13, color: Colors.success, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.border, marginBottom: 10,
  },
  paymentOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '10' },
  paymentDot: { width: 14, height: 14, borderRadius: 7 },
  paymentName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  confirmBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: Colors.primary, marginTop: 10,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
  termsText: { fontSize: 11, color: Colors.textTertiary, textAlign: 'center', marginTop: 12, lineHeight: 16 },
});
