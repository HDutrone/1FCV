import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Switch, Modal, FlatList, Image, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, ChevronDown, CircleCheck as CheckCircle, X, LogIn, Crown, Camera, Plus, Trash2, ImagePlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { City, Commune } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

const PROPERTY_TYPES = [
  { value: 'house', label: 'Maison' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Terrain' },
];

const KEYWORDS = ['Neuf', 'Rénové', 'Meublé', 'Climatisé', 'Eau courante', 'Électricité', 'Internet', 'Sécurisé', 'Vue dégagée', 'Près école', 'Proche marché', 'Calme'];

const TOTAL_STEPS = 4;

export default function PublishScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { isPremium, canPublishListing } = useSubscription();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCommunePicker, setShowCommunePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    listingType: 'rent' as 'rent' | 'sale',
    title: '',
    description: '',
    price: '',
    propertyType: 'house',
    bedrooms: '3',
    bathrooms: '1',
    surfaceArea: '',
    cityId: '',
    communeId: '',
    addressHint: '',
    isFurnished: false,
    hasGarage: false,
    hasPool: false,
    hasGarden: false,
    hasSecurity: false,
    keywords: [] as string[],
    minIncome: '',
    maxOccupants: '4',
    petsAllowed: false,
    smokingAllowed: false,
    requiresGuarantor: false,
    advanceMonths: '1',
    minStayMonths: '1',
    additionalRequirements: '',
  });

  useEffect(() => {
    supabase.from('cities').select('*').order('name').then(({ data }) => {
      if (data) setCities(data as City[]);
    });
  }, []);

  useEffect(() => {
    if (form.cityId) {
      supabase.from('communes').select('*').eq('city_id', form.cityId).order('name')
        .then(({ data }) => { if (data) setCommunes(data as Commune[]); });
    }
  }, [form.cityId]);

  const toggleKeyword = (kw: string) => {
    setForm(prev => ({
      ...prev,
      keywords: prev.keywords.includes(kw)
        ? prev.keywords.filter(k => k !== kw)
        : [...prev.keywords, kw],
    }));
  };

  const handlePickImage = async () => {
    if (imageUris.length >= 8) return;

    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Veuillez autoriser l\'accès à votre galerie pour ajouter des photos.',
      );
      return;
    }

    const remaining = 8 - imageUris.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map(a => a.uri);
      setImageUris(prev => [...prev, ...newUris].slice(0, 8));
      setImageFiles(prev => [...prev, ...newUris.map(() => null)].slice(0, 8));
    }
  };

  const handleWebFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 8 - imageUris.length;
    const selected = Array.from(files).slice(0, remaining);
    const newUris = selected.map(f => URL.createObjectURL(f));
    const newFiles = selected.map(f => f as File);
    setImageUris(prev => [...prev, ...newUris].slice(0, 8));
    setImageFiles(prev => [...prev, ...newFiles].slice(0, 8));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToStorage = async (propertyId: string): Promise<void> => {
    if (!user || imageUris.length === 0) return;
    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i];
        const file = imageFiles[i];
        const ext = 'jpg';
        const path = `${user.id}/${propertyId}/${Date.now()}_${i}.${ext}`;

        let uploadError: any = null;

        if (Platform.OS === 'web' && file) {
          const { error } = await supabase.storage
            .from('property-images')
            .upload(path, file, { contentType: file.type, upsert: true });
          uploadError = error;
        } else {
          const response = await fetch(uri);
          const blob = await response.blob();
          const { error } = await supabase.storage
            .from('property-images')
            .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
          uploadError = error;
        }

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('property-images')
            .getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        await Promise.all(
          uploadedUrls.map((url, index) =>
            supabase.from('property_images').insert({
              property_id: propertyId,
              url,
              is_primary: index === 0,
              order_index: index,
            })
          )
        );
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setLoading(true);

    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        owner_id: user.id,
        listing_type: form.listingType,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        property_type: form.propertyType,
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        surface_area: parseFloat(form.surfaceArea) || 0,
        city_id: form.cityId || null,
        commune_id: form.communeId || null,
        address_hint: form.addressHint,
        is_furnished: form.isFurnished,
        has_garage: form.hasGarage,
        has_pool: form.hasPool,
        has_garden: form.hasGarden,
        has_security: form.hasSecurity,
        keywords: form.keywords,
        status: 'pending',
      })
      .select()
      .single();

    if (!error && property) {
      await Promise.all([
        supabase.from('owner_criteria').insert({
          property_id: property.id,
          min_monthly_income: parseFloat(form.minIncome) || null,
          max_occupants: parseInt(form.maxOccupants) || 10,
          pets_allowed: form.petsAllowed,
          smoking_allowed: form.smokingAllowed,
          requires_guarantor: form.requiresGuarantor,
          advance_months: parseInt(form.advanceMonths) || 1,
          min_stay_months: parseInt(form.minStayMonths) || 1,
          additional_requirements: form.additionalRequirements,
        }),
        uploadImagesToStorage(property.id),
      ]);
      setSuccess(true);
    }
    setLoading(false);
  };

  const selectedCity = cities.find(c => c.id === form.cityId);
  const selectedCommune = communes.find(c => c.id === form.communeId);
  const selectedType = PROPERTY_TYPES.find(t => t.value === form.propertyType);

  useEffect(() => {
    if (user && profile?.role === 'owner') {
      canPublishListing().then(can => setLimitReached(!can));
    }
  }, [user, profile]);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Publier un bien</Text>
        </View>
        <View style={styles.authPrompt}>
          <Building2 size={48} color={Colors.primary} />
          <Text style={styles.authTitle}>Connexion requise</Text>
          <Text style={styles.authText}>
            Connectez-vous ou creez un compte proprietaire pour publier votre bien.
          </Text>
          <Button title="Se connecter" onPress={() => router.push('/(auth)/login' as any)} />
        </View>
      </View>
    );
  }

  if (limitReached && !isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Publier un bien</Text>
        </View>
        <View style={styles.authPrompt}>
          <Crown size={48} color={Colors.accent} />
          <Text style={styles.authTitle}>Limite atteinte</Text>
          <Text style={styles.authText}>
            Votre plan gratuit est limite a 1 annonce. Passez en Premium pour publier des annonces illimitees.
          </Text>
          <Button title="Voir les offres Premium" onPress={() => router.push('/subscription' as any)} />
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <CheckCircle size={64} color={Colors.success} />
        <Text style={styles.successTitle}>Annonce soumise !</Text>
        <Text style={styles.successText}>
          Votre annonce est en cours de vérification par notre équipe. Elle sera publiée après validation.
        </Text>
        <Button
          title="Retour à l'accueil"
          onPress={() => { setSuccess(false); setStep(1); setImageUris([]); router.replace('/(tabs)'); }}
        />
      </View>
    );
  }

  const stepLabels = ['Infos', 'Détails', 'Photos', 'Critères'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Publier un bien</Text>
        <Text style={styles.headerSubtitle}>Étape {step} / {TOTAL_STEPS}</Text>
      </View>

      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map(s => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>{s}</Text>
            </View>
            <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
              {stepLabels[s - 1]}
            </Text>
            {s < TOTAL_STEPS && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Type d'annonce</Text>
            <View style={styles.typeRow}>
              {(['rent', 'sale'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, form.listingType === t && (t === 'rent' ? styles.typeBtnRent : styles.typeBtnSale)]}
                  onPress={() => setForm(p => ({ ...p, listingType: t }))}
                >
                  <Text style={[styles.typeBtnText, form.listingType === t && styles.typeBtnTextActive]}>
                    {t === 'rent' ? 'À Louer' : 'À Vendre'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Titre de l'annonce" placeholder="Ex: Belle villa meublée à Gombe" value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} />
            <Input label={`Prix (USD${form.listingType === 'rent' ? '/mois' : ''})`} placeholder="Ex: 800" value={form.price} onChangeText={v => setForm(p => ({ ...p, price: v }))} keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Type de bien</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowTypePicker(true)}>
              <Text style={styles.pickerText}>{selectedType?.label || 'Choisir...'}</Text>
              <ChevronDown size={16} color={Colors.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Ville</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowCityPicker(true)}>
              <Text style={styles.pickerText}>{selectedCity?.name || 'Choisir une ville...'}</Text>
              <ChevronDown size={16} color={Colors.textSecondary} />
            </TouchableOpacity>

            {form.cityId && (
              <>
                <Text style={styles.fieldLabel}>Commune</Text>
                <TouchableOpacity style={styles.picker} onPress={() => setShowCommunePicker(true)}>
                  <Text style={styles.pickerText}>{selectedCommune?.name || 'Choisir une commune...'}</Text>
                  <ChevronDown size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </>
            )}

            <Input label="Indice de localisation" placeholder="Ex: Près du rond-point Victoire" value={form.addressHint} onChangeText={v => setForm(p => ({ ...p, addressHint: v }))} />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>Détails du bien</Text>
            <View style={styles.inlineRow}>
              <View style={styles.inlineItem}>
                <Input label="Chambres" placeholder="3" value={form.bedrooms} onChangeText={v => setForm(p => ({ ...p, bedrooms: v }))} keyboardType="numeric" />
              </View>
              <View style={styles.inlineItem}>
                <Input label="Salles de bain" placeholder="1" value={form.bathrooms} onChangeText={v => setForm(p => ({ ...p, bathrooms: v }))} keyboardType="numeric" />
              </View>
            </View>
            <Input label="Surface (m²)" placeholder="Ex: 150" value={form.surfaceArea} onChangeText={v => setForm(p => ({ ...p, surfaceArea: v }))} keyboardType="numeric" />
            <Input label="Description" placeholder="Décrivez votre bien en détail..." value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />

            <Text style={styles.sectionTitle}>Équipements</Text>
            <View style={styles.switchGrid}>
              {[
                { key: 'isFurnished', label: 'Meublé' },
                { key: 'hasGarage', label: 'Garage' },
                { key: 'hasPool', label: 'Piscine' },
                { key: 'hasGarden', label: 'Jardin' },
                { key: 'hasSecurity', label: 'Sécurité' },
              ].map(item => (
                <View key={item.key} style={styles.switchItem}>
                  <Text style={styles.switchLabel}>{item.label}</Text>
                  <Switch
                    value={(form as any)[item.key]}
                    onValueChange={v => setForm(p => ({ ...p, [item.key]: v }))}
                    trackColor={{ true: Colors.primary }}
                    thumbColor={Colors.textInverse}
                  />
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Mots-clés</Text>
            <View style={styles.keywordsGrid}>
              {KEYWORDS.map(kw => (
                <TouchableOpacity
                  key={kw}
                  style={[styles.kwChip, form.keywords.includes(kw) && styles.kwChipActive]}
                  onPress={() => toggleKeyword(kw)}
                >
                  <Text style={[styles.kwChipText, form.keywords.includes(kw) && styles.kwChipTextActive]}>
                    {kw}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.sectionTitle}>Photos du bien</Text>
            <Text style={styles.sectionHint}>
              Ajoutez jusqu'à 8 photos. La première photo sera l'image principale de votre annonce.
            </Text>

            <View style={styles.photosGrid}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                  {index === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Principale</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => handleRemoveImage(index)}>
                    <Trash2 size={14} color={Colors.textInverse} />
                  </TouchableOpacity>
                </View>
              ))}

              {imageUris.length < 8 && (
                <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage}>
                  <ImagePlus size={28} color={Colors.textTertiary} />
                  <Text style={styles.addPhotoBtnText}>Ajouter</Text>
                  <Text style={styles.addPhotoBtnHint}>{imageUris.length}/8</Text>
                </TouchableOpacity>
              )}
            </View>

            {imageUris.length === 0 && (
              <View style={styles.noPhotosHint}>
                <Camera size={40} color={Colors.border} />
                <Text style={styles.noPhotosTitle}>Aucune photo ajoutée</Text>
                <Text style={styles.noPhotosText}>
                  Les annonces avec photos reçoivent 5x plus de contacts. Ajoutez au moins 3 photos.
                </Text>
              </View>
            )}

            <View style={styles.photoTipsBox}>
              <Text style={styles.photoTipsTitle}>Conseils pour de bonnes photos</Text>
              <Text style={styles.photoTip}>• Photographiez en journée avec bonne lumière</Text>
              <Text style={styles.photoTip}>• Commencez par la façade ou le salon</Text>
              <Text style={styles.photoTip}>• Montrez toutes les pièces principales</Text>
              <Text style={styles.photoTip}>• Évitez les photos floues ou sombres</Text>
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.sectionTitle}>Critères d'acceptation</Text>
            <Text style={styles.sectionHint}>
              Ces critères seront visibles par les candidats pour qu'ils puissent auto-évaluer leur profil.
            </Text>

            <Input label="Revenu mensuel minimum (USD)" placeholder="Ex: 500" value={form.minIncome} onChangeText={v => setForm(p => ({ ...p, minIncome: v }))} keyboardType="numeric" />
            <Input label="Nombre maximal d'occupants" placeholder="4" value={form.maxOccupants} onChangeText={v => setForm(p => ({ ...p, maxOccupants: v }))} keyboardType="numeric" />

            {form.listingType === 'rent' && (
              <>
                <View style={styles.inlineRow}>
                  <View style={styles.inlineItem}>
                    <Input label="Mois d'avance" placeholder="1" value={form.advanceMonths} onChangeText={v => setForm(p => ({ ...p, advanceMonths: v }))} keyboardType="numeric" />
                  </View>
                  <View style={styles.inlineItem}>
                    <Input label="Durée min. (mois)" placeholder="6" value={form.minStayMonths} onChangeText={v => setForm(p => ({ ...p, minStayMonths: v }))} keyboardType="numeric" />
                  </View>
                </View>
              </>
            )}

            <View style={styles.switchGrid}>
              {[
                { key: 'petsAllowed', label: 'Animaux acceptés' },
                { key: 'smokingAllowed', label: 'Fumeurs acceptés' },
                { key: 'requiresGuarantor', label: 'Caution requise' },
              ].map(item => (
                <View key={item.key} style={styles.switchItem}>
                  <Text style={styles.switchLabel}>{item.label}</Text>
                  <Switch
                    value={(form as any)[item.key]}
                    onValueChange={v => setForm(p => ({ ...p, [item.key]: v }))}
                    trackColor={{ true: Colors.primary }}
                    thumbColor={Colors.textInverse}
                  />
                </View>
              ))}
            </View>

            <Input
              label="Exigences supplémentaires"
              placeholder="Tout autre critère important..."
              value={form.additionalRequirements}
              onChangeText={v => setForm(p => ({ ...p, additionalRequirements: v }))}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </View>
        )}

        <View style={styles.navRow}>
          {step > 1 && (
            <Button title="Précédent" onPress={() => setStep(s => s - 1)} variant="outline" style={{ flex: 1 }} />
          )}
          {step < TOTAL_STEPS ? (
            <Button title="Suivant" onPress={() => setStep(s => s + 1)} style={{ flex: 1 }} />
          ) : (
            <Button title="Soumettre l'annonce" onPress={handleSubmit} loading={loading || uploadingImages} style={{ flex: 1 }} />
          )}
        </View>
      </ScrollView>

      <PickerModal visible={showCityPicker} title="Choisir une ville" items={cities} onSelect={(item: any) => { setForm(p => ({ ...p, cityId: item?.id || '', communeId: '' })); setShowCityPicker(false); }} onClose={() => setShowCityPicker(false)} selectedId={form.cityId} />
      <PickerModal visible={showCommunePicker} title="Choisir une commune" items={communes} onSelect={(item: any) => { setForm(p => ({ ...p, communeId: item?.id || '' })); setShowCommunePicker(false); }} onClose={() => setShowCommunePicker(false)} selectedId={form.communeId} />
      <PickerModal visible={showTypePicker} title="Type de bien" items={PROPERTY_TYPES.map(t => ({ id: t.value, name: t.label }))} onSelect={(item: any) => { setForm(p => ({ ...p, propertyType: item?.id || 'house' })); setShowTypePicker(false); }} onClose={() => setShowTypePicker(false)} selectedId={form.propertyType} />

      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleWebFileChange as any}
        />
      )}
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    gap: 0,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: Colors.primary },
  stepDotText: { fontSize: 12, fontWeight: '700', color: Colors.textTertiary },
  stepDotTextActive: { color: Colors.textInverse },
  stepLabel: { fontSize: 10, color: Colors.textTertiary, marginLeft: 3, fontWeight: '500' },
  stepLabelActive: { color: Colors.primary },
  stepLine: { width: 24, height: 2, backgroundColor: Colors.border, marginHorizontal: 3 },
  stepLineActive: { backgroundColor: Colors.primary },
  form: { flex: 1 },
  formContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 8, marginBottom: 12 },
  sectionHint: { fontSize: 13, color: Colors.textSecondary, marginTop: -8, marginBottom: 14, lineHeight: 19 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeBtnRent: { backgroundColor: Colors.rentLight, borderColor: Colors.accent },
  typeBtnSale: { backgroundColor: Colors.saleLight, borderColor: Colors.primary },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.text },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.surface,
    marginBottom: 16,
  },
  pickerText: { fontSize: 15, color: Colors.text },
  inlineRow: { flexDirection: 'row', gap: 12 },
  inlineItem: { flex: 1 },
  switchGrid: { gap: 2, marginBottom: 16 },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  switchLabel: { fontSize: 15, color: Colors.text },
  keywordsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  kwChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kwChipActive: { backgroundColor: Colors.primaryLight + '20', borderColor: Colors.primary },
  kwChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  kwChipTextActive: { color: Colors.primary, fontWeight: '600' },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: { fontSize: 9, color: Colors.textInverse, fontWeight: '700' },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
    gap: 4,
  },
  addPhotoBtnText: { fontSize: 12, color: Colors.textTertiary, fontWeight: '600' },
  addPhotoBtnHint: { fontSize: 10, color: Colors.textTertiary },
  noPhotosHint: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  noPhotosTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  noPhotosText: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', lineHeight: 19, paddingHorizontal: 16 },
  photoTipsBox: {
    backgroundColor: Colors.infoLight,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    marginBottom: 8,
  },
  photoTipsTitle: { fontSize: 13, fontWeight: '700', color: Colors.info, marginBottom: 4 },
  photoTip: { fontSize: 12, color: Colors.info, lineHeight: 18 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  authTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  authText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  successText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 23, paddingHorizontal: 24 },
});

const pickerStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  option: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  optionSelected: { backgroundColor: Colors.primaryLight + '15' },
  optionText: { fontSize: 15, color: Colors.text },
  optionTextSelected: { color: Colors.primary, fontWeight: '600' },
});
