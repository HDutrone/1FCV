import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock, House } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError('Email ou mot de passe incorrect.');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={Colors.gradientPrimary as any} style={styles.topSection}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <House size={30} color={Colors.textInverse} />
          </View>
          <Text style={styles.logoText}>1 Futur Chez Vous</Text>
          <Text style={styles.logoTagline}>Connectez-vous à votre compte</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

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
          placeholder="Votre mot de passe"
          value={password}
          onChangeText={setPassword}
          isPassword
          leftIcon={<Lock size={18} color={Colors.textSecondary} />}
        />

        <Button
          title="Se connecter"
          onPress={handleLogin}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.registerLink} onPress={() => router.replace('/(auth)/register' as any)}>
          <Text style={styles.registerText}>
            Pas de compte ?{' '}
            <Text style={styles.registerTextBold}>Créer un compte</Text>
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
    paddingBottom: 32,
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
  logoArea: { alignItems: 'center' },
  logoIcon: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  logoText: { fontSize: 20, fontWeight: '800', color: Colors.textInverse, marginBottom: 4 },
  logoTagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  form: { flex: 1, backgroundColor: Colors.surface },
  formContent: { padding: 24, paddingTop: 28 },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  errorBannerText: { color: Colors.error, fontSize: 14, fontWeight: '500' },
  submitBtn: { marginTop: 8 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textTertiary },
  registerLink: { alignItems: 'center' },
  registerText: { fontSize: 14, color: Colors.textSecondary },
  registerTextBold: { color: Colors.primary, fontWeight: '700' },
});
