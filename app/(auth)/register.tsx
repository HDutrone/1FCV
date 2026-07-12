import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock, User, Building2, Briefcase, TrendingUp, ChevronDown, ChevronUp, House } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { ROLE_CONFIGS, UserRole } from '@/lib/types';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

const SEARCHER_ROLES: UserRole[] = ['tenant', 'buyer', 'investor'];
const PUBLISHER_ROLES: UserRole[] = ['owner', 'seller', 'agent', 'promoter'];

const ROLE_ICONS: Record<UserRole, React.ComponentType<any>> = {
  tenant: User,
  buyer: User,
  owner: Building2,
  seller: TrendingUp,
  agent: Briefcase,
  promoter: Building2,
  investor: TrendingUp,
  admin: User,
};

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await signUp(email, password, displayName, role);
    setLoading(false);
    if (err) {
      setError(err.includes('already registered') ? 'Cet email est déjà utilisé.' : err);
    } else {
      setSuccess(true);
      setTimeout(() => router.replace('/(tabs)'), 1500);
    }
  };

  if (success) {
    const cfg = ROLE_CONFIGS[role];
    return (
      <View style={styles.successContainer}>
        <LinearGradient colors={Colors.gradientPrimary as any} style={styles.successGradient}>
          <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <House size={36} color={Colors.textInverse} />
          </View>
          <Text style={styles.successTitle}>Bienvenue !</Text>
          <Text style={styles.successSubtitle}>{cfg.labelFr}</Text>
          <Text style={styles.successText}>Votre compte a été créé avec succès.</Text>
        </LinearGradient>
      </View>
    );
  }

  const selectedCfg = ROLE_CONFIGS[role];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={Colors.gradientPrimary as any} style={styles.topSection}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <View style={styles.titleArea}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez 1 Futur Chez Vous</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Je suis...</Text>

        <View style={styles.categoryRow}>
          <View style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>Chercheur</Text>
            {SEARCHER_ROLES.map((r) => {
              const cfg = ROLE_CONFIGS[r];
              const Icon = ROLE_ICONS[r];
              const isActive = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleCard, isActive && { borderColor: cfg.color, backgroundColor: cfg.color + '12' }]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleCardIcon, { backgroundColor: isActive ? cfg.color : Colors.surfaceSecondary }]}>
                    <Icon size={16} color={isActive ? Colors.textInverse : Colors.textSecondary} />
                  </View>
                  <View style={styles.roleCardText}>
                    <Text style={[styles.roleCardLabel, isActive && { color: cfg.color }]}>{cfg.labelFr}</Text>
                    <Text style={styles.roleCardDesc} numberOfLines={1}>{cfg.description}</Text>
                  </View>
                  {isActive && (
                    <View style={[styles.roleCheckDot, { backgroundColor: cfg.color }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.categoryDivider} />

          <View style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>Professionnel</Text>
            {PUBLISHER_ROLES.map((r) => {
              const cfg = ROLE_CONFIGS[r];
              const Icon = ROLE_ICONS[r];
              const isActive = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleCard, isActive && { borderColor: cfg.color, backgroundColor: cfg.color + '12' }]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleCardIcon, { backgroundColor: isActive ? cfg.color : Colors.surfaceSecondary }]}>
                    <Icon size={16} color={isActive ? Colors.textInverse : Colors.textSecondary} />
                  </View>
                  <View style={styles.roleCardText}>
                    <Text style={[styles.roleCardLabel, isActive && { color: cfg.color }]}>{cfg.labelFr}</Text>
                    <Text style={styles.roleCardDesc} numberOfLines={1}>{cfg.description}</Text>
                  </View>
                  {isActive && (
                    <View style={[styles.roleCheckDot, { backgroundColor: cfg.color }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedCfg.isPro && (
          <View style={[styles.proNotice, { borderColor: selectedCfg.color + '40', backgroundColor: selectedCfg.color + '08' }]}>
            <Briefcase size={14} color={selectedCfg.color} />
            <Text style={[styles.proNoticeText, { color: selectedCfg.color }]}>
              Profil professionnel — vérification KYC requise après l'inscription
            </Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <Input
          label="Nom complet"
          placeholder="Votre nom"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          leftIcon={<User size={18} color={Colors.textSecondary} />}
        />

        <Input
          label="Adresse email"
          placeholder="votre@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          leftIcon={<Mail size={18} color={Colors.textSecondary} />}
        />

        <Input
          label="Mot de passe"
          placeholder="Minimum 6 caractères"
          value={password}
          onChangeText={setPassword}
          isPassword
          leftIcon={<Lock size={18} color={Colors.textSecondary} />}
        />

        <Input
          label="Confirmer le mot de passe"
          placeholder="Répétez votre mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          leftIcon={<Lock size={18} color={Colors.textSecondary} />}
        />

        <Button
          title="Créer mon compte"
          onPress={handleRegister}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />

        <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/(auth)/login' as any)}>
          <Text style={styles.loginText}>
            Déjà un compte ?{' '}
            <Text style={styles.loginTextBold}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  topSection: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titleArea: {},
  title: { fontSize: 26, fontWeight: '800', color: Colors.textInverse, marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  form: { flex: 1, backgroundColor: Colors.surface },
  formContent: { padding: 24 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryBlock: { flex: 1, gap: 6 },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  categoryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleCardIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardText: { flex: 1 },
  roleCardLabel: { fontSize: 12, fontWeight: '700', color: Colors.text },
  roleCardDesc: { fontSize: 10, color: Colors.textTertiary, marginTop: 1 },
  roleCheckDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  proNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  proNoticeText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  errorBannerText: { color: Colors.error, fontSize: 14, fontWeight: '500' },
  submitBtn: { marginTop: 8 },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginText: { fontSize: 14, color: Colors.textSecondary },
  loginTextBold: { color: Colors.primary, fontWeight: '700' },
  successContainer: { flex: 1 },
  successGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 30, fontWeight: '800', color: Colors.textInverse },
  successSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  successText: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
});
