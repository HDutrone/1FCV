import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { House } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable', headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <House size={36} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Page introuvable</Text>
        <Text style={styles.text}>Cette page n'existe pas ou a été déplacée.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Retour à l'accueil</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.background,
    gap: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.saleLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  text: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  link: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  linkText: { fontSize: 15, fontWeight: '700', color: Colors.textInverse },
});
