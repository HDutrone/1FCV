import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, X, CircleCheck as CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { City, Commune } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [cityId, setCityId] = useState(profile?.city_id || '');
  const [communeId, setCommuneId] = useState(profile?.commune_id || '');
  const [cities, setCities] = useState<City[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCommunePicker, setShowCommunePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('cities').select('*').order('name').then(({ data }) => {
      if (data) setCities(data as City[]);
    });
  }, []);

  useEffect(() => {
    if (cityId) {
      supabase.from('communes').select('*').eq('city_id', cityId).order('name')
        .then(({ data }) => { if (data) setCommunes(data as Commune[]); });
    } else {
      setCommunes([]);
    }
  }, [cityId]);

  const selectedCity = cities.find(c => c.id === cityId);
  const selectedCommune = communes.find(c => c.id === communeId);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        bio: bio.trim(),
        city_id: cityId || null,
        commune_id: communeId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Input
          label="Nom d'affichage"
          placeholder="Votre nom"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Input
          label="Bio"
          placeholder="Quelques mots sur vous..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        <Text style={styles.fieldLabel}>Ville</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setShowCityPicker(true)}>
          <Text style={[styles.pickerText, selectedCity && styles.pickerTextActive]}>
            {selectedCity?.name || 'Choisir une ville...'}
          </Text>
          <ChevronDown size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        {cityId ? (
          <>
            <Text style={styles.fieldLabel}>Commune</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowCommunePicker(true)}>
              <Text style={[styles.pickerText, selectedCommune && styles.pickerTextActive]}>
                {selectedCommune?.name || 'Choisir une commune...'}
              </Text>
              <ChevronDown size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Identite anonyme</Text>
          <Text style={styles.infoText}>
            Votre identite est protegee par un ID anonyme: {profile?.anonymous_id}
          </Text>
          <Text style={styles.infoText}>
            Cet identifiant est utilise dans toutes les communications via la plateforme.
          </Text>
        </View>

        <Button
          title={saved ? 'Enregistre !' : 'Enregistrer les modifications'}
          onPress={handleSave}
          loading={saving}
          variant={saved ? 'secondary' : 'primary'}
          size="lg"
        />
      </ScrollView>

      <PickerModal
        visible={showCityPicker}
        title="Choisir une ville"
        items={cities}
        selectedId={cityId}
        onSelect={(item: any) => { setCityId(item?.id || ''); setCommuneId(''); setShowCityPicker(false); }}
        onClose={() => setShowCityPicker(false)}
      />
      <PickerModal
        visible={showCommunePicker}
        title="Choisir une commune"
        items={communes}
        selectedId={communeId}
        onSelect={(item: any) => { setCommuneId(item?.id || ''); setShowCommunePicker(false); }}
        onClose={() => setShowCommunePicker(false)}
      />
    </View>
  );
}

function PickerModal({ visible, title, items, selectedId, onSelect, onClose }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pickerStyles.backdrop} onPress={onClose} activeOpacity={1}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={Colors.text} /></TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: any) => (
              <TouchableOpacity
                style={[pickerStyles.option, selectedId === item.id && pickerStyles.optionSelected]}
                onPress={() => onSelect(item)}
              >
                <Text style={[pickerStyles.optionText, selectedId === item.id && pickerStyles.optionTextSelected]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
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
  form: { padding: 20, paddingBottom: 40 },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textSecondary,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    padding: 14, backgroundColor: Colors.surface, marginBottom: 16,
  },
  pickerText: { fontSize: 15, color: Colors.textTertiary },
  pickerTextActive: { color: Colors.text },
  infoCard: {
    backgroundColor: Colors.saleLight, borderRadius: 12,
    padding: 14, marginBottom: 24, gap: 4,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  infoText: { fontSize: 12, color: Colors.primary, lineHeight: 18 },
});

const pickerStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '70%', paddingBottom: 32,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  option: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  optionSelected: { backgroundColor: Colors.primaryLight + '15' },
  optionText: { fontSize: 15, color: Colors.text },
  optionTextSelected: { color: Colors.primary, fontWeight: '600' },
});
