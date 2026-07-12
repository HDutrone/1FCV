import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, Platform, ScrollView, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Key, ArrowRight, Shield, Users, MapPin, Crown, Eye, Building2, TrendingUp, House } from 'lucide-react-native';
import { useMode } from '@/context/ModeContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/common/AnimatedPressable';

const { width } = Dimensions.get('window');
const isWide = width > 600;

const CITY_IMAGES = [
  { name: 'Kinshasa', img: 'https://images.pexels.com/photos/3044473/pexels-photo-3044473.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { name: 'Lubumbashi', img: 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { name: 'Goma', img: 'https://images.pexels.com/photos/1534057/pexels-photo-1534057.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { name: 'Bukavu', img: 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { name: 'Kolwezi', img: 'https://images.pexels.com/photos/2422461/pexels-photo-2422461.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { name: 'Kalemie', img: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=600' },
];

const STATS = [
  { value: '6', label: 'Villes', icon: MapPin },
  { value: '500+', label: 'Biens', icon: Building2 },
  { value: '1K+', label: 'Utilisateurs', icon: Users },
  { value: '100%', label: 'Securise', icon: Shield },
];

const STEPS = [
  { num: '01', title: 'Recherchez', desc: 'Explorez les biens par ville, type et budget' },
  { num: '02', title: 'Contactez', desc: 'Manifestez votre interet en toute confidentialite' },
  { num: '03', title: 'Visitez', desc: 'Un agent vous accompagne lors de chaque visite' },
  { num: '04', title: 'Signez', desc: 'Contrat securise avec escrow des commissions' },
];

export default function ModeSelectionScreen() {
  const router = useRouter();
  const { selectMode } = useMode();
  const { user, loading } = useAuth();
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(16)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslate = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  useEffect(() => {
    Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.timing(heroTranslate, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    Animated.timing(cardsOpacity, { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }).start();
    Animated.timing(cardsTranslate, { toValue: 0, duration: 500, delay: 150, useNativeDriver: true }).start();
  }, []);

  const handleSelect = (mode: 'sale' | 'rent') => {
    selectMode(mode);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={Colors.gradientPrimaryDeep as any} style={styles.heroSection}>
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoImage}>
                <House size={22} color={Colors.textInverse} />
              </View>
              <View style={styles.logoTexts}>
                <Text style={styles.logoText}>1 Futur Chez Vous</Text>
                <Text style={styles.logoTagline}>Votre avenir immobilier en RDC</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={styles.loginBtnText}>Connexion</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.heroContent, { opacity: heroOpacity, transform: [{ translateY: heroTranslate }] }]}>
            <Text style={styles.heroTitle}>Trouvez votre{'\n'}futur chez vous</Text>
            <Text style={styles.heroSubtitle}>
              La plateforme immobiliere de reference en Republique Democratique du Congo.
              Securisee, transparente et 100% locale.
            </Text>
          </Animated.View>

          <View style={styles.statsRow}>
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <View key={i} style={styles.statItem}>
                  <Icon size={18} color={Colors.accent} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        <Animated.View style={[styles.selectionSection, { opacity: cardsOpacity, transform: [{ translateY: cardsTranslate }] }]}>
          <Text style={styles.sectionLabel}>JE SOUHAITE...</Text>

          <AnimatedPressable style={styles.modeCard} onPress={() => handleSelect('rent')} haptic="light" scaleTo={0.97}>
            <LinearGradient colors={Colors.gradientAccent as any} style={styles.modeCardGradient}>
              <View style={styles.modeCardIcon}>
                <Key size={28} color={Colors.textInverse} />
              </View>
              <View style={styles.modeCardContent}>
                <Text style={styles.modeCardTitle}>Louer un bien</Text>
                <Text style={styles.modeCardDesc}>Appartements, maisons, studios a la location</Text>
              </View>
              <View style={styles.modeCardArrow}>
                <ArrowRight size={18} color={Colors.textInverse} />
              </View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable style={styles.modeCard} onPress={() => handleSelect('sale')} haptic="light" scaleTo={0.97}>
            <View style={[styles.modeCardGradient, styles.modeCardSale]}>
              <View style={[styles.modeCardIcon, styles.modeCardIconSale]}>
                <House size={28} color={Colors.primary} />
              </View>
              <View style={styles.modeCardContent}>
                <Text style={[styles.modeCardTitle, styles.modeCardTitleSale]}>Acheter un bien</Text>
                <Text style={[styles.modeCardDesc, styles.modeCardDescSale]}>Maisons, villas et terrains a vendre en RDC</Text>
              </View>
              <View style={[styles.modeCardArrow, styles.modeCardArrowSale]}>
                <ArrowRight size={18} color={Colors.primary} />
              </View>
            </View>
          </AnimatedPressable>
        </Animated.View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Pourquoi 1 Futur Chez Vous ?</Text>
          <View style={styles.featuresGrid}>
            <FeatureCard
              icon={<Shield size={24} color={Colors.primary} />}
              title="Anti-contournement"
              desc="Contacts masques, chat anonyme, escrow automatique sur chaque deal"
            />
            <FeatureCard
              icon={<Eye size={24} color={Colors.primary} />}
              title="Biens verifies"
              desc="Chaque annonce est validee par notre equipe avant publication"
            />
            <FeatureCard
              icon={<Users size={24} color={Colors.primary} />}
              title="Accompagnement"
              desc="Un agent present a chaque visite et signature de contrat"
            />
            <FeatureCard
              icon={<TrendingUp size={24} color={Colors.primary} />}
              title="Mobile Money"
              desc="Paiements M-Pesa, Airtel Money, Orange Money en CDF"
            />
          </View>
        </View>

        <View style={styles.stepsSection}>
          <Text style={styles.stepsSectionTitle}>Comment ca marche</Text>
          <View style={styles.stepsGrid}>
            {STEPS.map((step, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{step.num}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.citiesSection}>
          <Text style={styles.citiesSectionTitle}>Nos villes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.citiesScroll}>
            {CITY_IMAGES.map((city, i) => (
              <TouchableOpacity key={i} style={styles.cityCard} onPress={() => handleSelect('rent')} activeOpacity={0.9}>
                <Image source={{ uri: city.img }} style={styles.cityImage} resizeMode="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.cityOverlay} />
                <Text style={styles.cityName}>{city.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.premiumSection}>
          <LinearGradient colors={Colors.gradientPrimary as any} style={styles.premiumBanner}>
            <Crown size={28} color={Colors.accent} />
            <Text style={styles.premiumTitle}>Passez en Premium</Text>
            <Text style={styles.premiumDesc}>
              Recherches illimitees, alertes push, visites prioritaires, sans publicites.
              7 jours d'essai gratuit.
            </Text>
            <TouchableOpacity style={styles.premiumCtaBtn} onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={styles.premiumCtaBtnText}>Commencer gratuitement</Text>
              <ArrowRight size={16} color={Colors.textInverse} />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.authSection}>
          <Text style={styles.authText}>Vous avez un bien a proposer ?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
            <Text style={styles.authLink}>Creer un compte proprietaire</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={styles.signInText}>Se connecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSection}>
          <House size={16} color={Colors.textTertiary} />
          <Text style={styles.footerText}>1 Futur Chez Vous - 2025 - RDC</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <View style={featureCardStyles.card}>
      <View style={featureCardStyles.iconWrap}>{icon}</View>
      <Text style={featureCardStyles.title}>{title}</Text>
      <Text style={featureCardStyles.desc}>{desc}</Text>
    </View>
  );
}

const featureCardStyles = StyleSheet.create({
  card: {
    width: '48%' as any,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.saleLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  desc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1 },
  heroSection: { paddingBottom: 24 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingHorizontal: 20, paddingBottom: 16,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  logoTexts: {},
  logoText: { fontSize: 16, fontWeight: '800', color: Colors.textInverse, letterSpacing: 0.3 },
  logoTagline: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  loginBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  loginBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textInverse },
  heroContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  heroTitle: {
    fontSize: isWide ? 44 : 34, fontWeight: '800', color: Colors.textInverse,
    lineHeight: isWide ? 52 : 42, marginBottom: 12,
  },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 22, maxWidth: 400 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginHorizontal: 20, paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.textInverse },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  selectionSection: { padding: 20 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 1.5, marginBottom: 14,
  },
  modeCard: {
    borderRadius: 18, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  modeCardGradient: {
    flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14, borderRadius: 18,
  },
  modeCardSale: { backgroundColor: Colors.textInverse },
  modeCardIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  modeCardIconSale: { backgroundColor: Colors.saleLight },
  modeCardContent: { flex: 1 },
  modeCardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textInverse, marginBottom: 3 },
  modeCardTitleSale: { color: Colors.text },
  modeCardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  modeCardDescSale: { color: Colors.textSecondary },
  modeCardArrow: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  modeCardArrowSale: { backgroundColor: Colors.saleLight },
  featuresSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  featuresSectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  stepsSection: {
    paddingHorizontal: 20, paddingVertical: 20, backgroundColor: Colors.surfaceSecondary,
  },
  stepsSectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 18 },
  stepsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stepCard: {
    width: '48%' as any,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepNum: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  stepNumText: { fontSize: 13, fontWeight: '800', color: Colors.textInverse },
  stepTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  stepDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  citiesSection: { paddingVertical: 20 },
  citiesSectionTitle: {
    fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 14, paddingHorizontal: 20,
  },
  citiesScroll: { paddingHorizontal: 20, gap: 12 },
  cityCard: { width: 140, height: 100, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  cityImage: { width: '100%', height: '100%' },
  cityOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  cityName: {
    position: 'absolute', bottom: 10, left: 12,
    fontSize: 14, fontWeight: '700', color: Colors.textInverse,
  },
  premiumSection: { paddingHorizontal: 20, paddingVertical: 8 },
  premiumBanner: { borderRadius: 18, padding: 24, alignItems: 'center', gap: 8 },
  premiumTitle: { fontSize: 20, fontWeight: '800', color: Colors.textInverse },
  premiumDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20, maxWidth: 320,
  },
  premiumCtaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent, paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 12, marginTop: 8,
  },
  premiumCtaBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textInverse },
  authSection: { paddingHorizontal: 20, paddingVertical: 20, alignItems: 'center', gap: 8 },
  authText: { fontSize: 13, color: Colors.textSecondary },
  authLink: { fontSize: 14, color: Colors.accent, fontWeight: '600', textDecorationLine: 'underline' },
  signInBtn: {
    marginTop: 4, paddingVertical: 10, paddingHorizontal: 32,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  signInText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  footerSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 20, paddingBottom: 40,
  },
  footerText: { fontSize: 12, color: Colors.textTertiary },
});
