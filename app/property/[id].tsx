import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Platform, Modal, TextInput,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, Heart, Bed, Bath, Maximize2, MapPin,
  CircleCheck as CheckCircle, X, Car, Waves, Trees, Shield, Lock,
  CircleAlert as AlertCircle, DollarSign, Calendar, Users, PawPrint,
  Cigarette, FileText, MessageCircle, ChevronLeft, ChevronRight,
  Clock, Eye, Handshake, CalendarCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { Property, OwnerCriteria } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import PropertyCard from '@/components/PropertyCard';
import AnimatedPressable from '@/components/common/AnimatedPressable';
import { SkeletonBlock } from '@/components/common/Skeleton';

const { width } = Dimensions.get('window');

const PLACEHOLDER_IMAGES = [
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

const INTEREST_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; description: string }> = {
  pending: { label: 'En attente', color: Colors.warning, bg: Colors.warningLight, icon: Clock, description: 'Votre demande est en cours de traitement par le proprietaire.' },
  reviewed: { label: 'Examinee', color: Colors.info, bg: Colors.infoLight, icon: Eye, description: 'Le proprietaire a pris connaissance de votre demande.' },
  accepted: { label: 'Mis en relation', color: Colors.success, bg: Colors.successLight, icon: Handshake, description: 'Felicitations ! Votre profil a ete retenu. Vous pouvez desormais echanger.' },
  rejected: { label: 'Non retenu', color: Colors.error, bg: Colors.errorLight, icon: X, description: 'Votre candidature n\'a pas ete retenue pour ce bien.' },
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [criteria, setCriteria] = useState<OwnerCriteria | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [interestStatus, setInterestStatus] = useState<string | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const galleryRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchProperty();
    if (user) {
      checkFavorite();
      checkExistingInterest();
      fetchUserFavorites();
    }
  }, [id, user]);

  const fetchProperty = async () => {
    const { data } = await supabase
      .from('properties')
      .select(`
        *,
        city:cities(id, name),
        commune:communes(id, name),
        property_images(id, url, is_primary, order_index),
        owner_criteria(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setProperty(data as Property);
      setCriteria((data as any).owner_criteria?.[0] || null);
      await supabase.from('properties').update({ views_count: (data.views_count || 0) + 1 }).eq('id', id);
      fetchSimilarProperties(data as Property);
    }
    setLoading(false);
  };

  const fetchSimilarProperties = async (prop: Property) => {
    const { data } = await supabase
      .from('properties')
      .select(`
        *,
        city:cities(id, name),
        commune:communes(id, name),
        property_images(id, url, is_primary, order_index)
      `)
      .eq('listing_type', prop.listing_type)
      .eq('city_id', prop.city_id)
      .in('status', ['approved', 'active'])
      .neq('id', prop.id)
      .limit(6);

    if (data && data.length > 0) {
      setSimilarProperties(data as Property[]);
    } else {
      const { data: fallback } = await supabase
        .from('properties')
        .select(`
          *,
          city:cities(id, name),
          commune:communes(id, name),
          property_images(id, url, is_primary, order_index)
        `)
        .eq('listing_type', prop.listing_type)
        .in('status', ['approved', 'active'])
        .neq('id', prop.id)
        .limit(4);
      if (fallback) setSimilarProperties(fallback as Property[]);
    }
  };

  const fetchUserFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id);
    if (data) setFavorites(new Set(data.map((f: any) => f.property_id)));
  };

  const checkFavorite = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', id)
      .maybeSingle();
    setIsFavorite(!!data);
  };

  const checkExistingInterest = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tenant_interests')
      .select('id, status')
      .eq('tenant_id', user.id)
      .eq('property_id', id)
      .maybeSingle();
    if (data) setInterestStatus(data.status);
  };

  const handleToggleFavorite = async () => {
    if (!user) { router.push('/(auth)/login' as any); return; }
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', id);
      setIsFavorite(false);
      setFavorites(prev => { const s = new Set(prev); s.delete(id!); return s; });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, property_id: id });
      setIsFavorite(true);
      setFavorites(prev => new Set([...prev, id!]));
    }
  };

  const handleToggleSimilarFavorite = async (propertyId: string) => {
    if (!user) return;
    const isFav = favorites.has(propertyId);
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
      setFavorites(prev => { const s = new Set(prev); s.delete(propertyId); return s; });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, property_id: propertyId });
      setFavorites(prev => new Set([...prev, propertyId]));
    }
  };

  const handleExpressInterest = async () => {
    if (!user) { router.push('/(auth)/login' as any); return; }
    setSubmittingInterest(true);

    const { data: interest, error } = await supabase.from('tenant_interests').insert({
      tenant_id: user.id,
      property_id: id,
      message: interestMessage,
    }).select().maybeSingle();

    if (!error && interest && property) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      const adminId = adminProfile?.id || null;

      const { data: searcherConv } = await supabase.from('conversations').insert({
        property_id: id,
        tenant_id: user.id,
        owner_id: adminId || property.owner_id,
        interest_id: interest.id,
        status: 'active',
        conversation_type: 'searcher_admin',
        admin_id: adminId,
      }).select().maybeSingle();

      if (searcherConv && adminId) {
        const { data: ownerConv } = await supabase.from('conversations').insert({
          property_id: id,
          tenant_id: adminId,
          owner_id: property.owner_id,
          interest_id: interest.id,
          status: 'active',
          conversation_type: 'owner_admin',
          admin_id: adminId,
          related_conversation_id: searcherConv.id,
        }).select().maybeSingle();

        if (ownerConv) {
          await supabase.from('conversations')
            .update({ related_conversation_id: ownerConv.id })
            .eq('id', searcherConv.id);
        }
      }

      setInterestStatus('pending');
      setShowInterestModal(false);
    }

    setSubmittingInterest(false);
  };

  const goToPrevImage = () => {
    if (activeImageIndex > 0) {
      const next = activeImageIndex - 1;
      setActiveImageIndex(next);
      galleryRef.current?.scrollToIndex({ index: next, animated: true });
    }
  };

  const goToNextImage = (total: number) => {
    if (activeImageIndex < total - 1) {
      const next = activeImageIndex + 1;
      setActiveImageIndex(next);
      galleryRef.current?.scrollToIndex({ index: next, animated: true });
    }
  };

  const handleGalleryScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonBlock style={{ width: '100%', height: 320, borderRadius: 0 }} />
        <View style={{ padding: 20, gap: 12 }}>
          <SkeletonBlock style={{ width: '40%', height: 26, borderRadius: 8 }} />
          <SkeletonBlock style={{ width: '80%', height: 18, borderRadius: 8 }} />
          <SkeletonBlock style={{ width: '55%', height: 14, borderRadius: 8 }} />
        </View>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Bien introuvable</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = property.property_images?.length
    ? property.property_images.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)).map(img => img.url)
    : [PLACEHOLDER_IMAGES[Math.abs(property.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length)]];

  const cityName = (property as any).city?.name || '';
  const communeName = (property as any).commune?.name || '';

  const formatPrice = (price: number, type: string) => {
    const formatted = new Intl.NumberFormat('fr-FR').format(price);
    return type === 'rent' ? `$${formatted}/mois` : `$${formatted}`;
  };

  const amenities = [
    { key: 'is_furnished', label: 'Meuble', icon: <CheckCircle size={14} color={Colors.success} /> },
    { key: 'has_garage', label: 'Garage', icon: <Car size={14} color={Colors.success} /> },
    { key: 'has_pool', label: 'Piscine', icon: <Waves size={14} color={Colors.success} /> },
    { key: 'has_garden', label: 'Jardin', icon: <Trees size={14} color={Colors.success} /> },
    { key: 'has_security', label: 'Securite', icon: <Shield size={14} color={Colors.success} /> },
  ].filter(a => (property as any)[a.key]);

  const statusConf = interestStatus ? INTEREST_STATUS_CONFIG[interestStatus] : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.imageSection}>
          <FlatList
            ref={galleryRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            onMomentumScrollEnd={handleGalleryScrollEnd}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.mainImage} resizeMode="cover" />
            )}
          />
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent']} style={styles.topGradient} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.bottomGradient} pointerEvents="none" />

          <View style={styles.imageControls}>
            <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color={Colors.textInverse} />
            </TouchableOpacity>
            <View style={styles.actionBtns}>
              <AnimatedPressable style={styles.actionBtn} onPress={handleToggleFavorite} haptic="light" scaleTo={0.85}>
                <Heart size={20} color={isFavorite ? Colors.error : Colors.textInverse} fill={isFavorite ? Colors.error : 'none'} />
              </AnimatedPressable>
            </View>
          </View>

          {images.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.galleryArrow, styles.galleryArrowLeft, activeImageIndex === 0 && styles.galleryArrowDisabled]}
                onPress={goToPrevImage}
                disabled={activeImageIndex === 0}
              >
                <ChevronLeft size={24} color={Colors.textInverse} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.galleryArrow, styles.galleryArrowRight, activeImageIndex === images.length - 1 && styles.galleryArrowDisabled]}
                onPress={() => goToNextImage(images.length)}
                disabled={activeImageIndex === images.length - 1}
              >
                <ChevronRight size={24} color={Colors.textInverse} />
              </TouchableOpacity>
            </>
          )}

          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, activeImageIndex === i && styles.dotActive]} />
              ))}
            </View>
          )}

          <View style={styles.imageFooter}>
            <Badge
              label={property.listing_type === 'sale' ? 'A Vendre' : 'A Louer'}
              variant={property.listing_type === 'sale' ? 'sale' : 'rent'}
            />
            <Text style={styles.imageCounter}>{activeImageIndex + 1}/{images.length}</Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(property.price, property.listing_type)}</Text>
            <View style={styles.viewsRow}>
              <Eye size={13} color={Colors.textTertiary} />
              <Text style={styles.viewsText}>{property.views_count} vues</Text>
            </View>
          </View>

          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.locationRow}>
            <MapPin size={14} color={Colors.primary} />
            <Text style={styles.location}>
              {communeName ? `${communeName}, ` : ''}{cityName}
            </Text>
          </View>

          {property.address_hint ? (
            <Text style={styles.addressHint}>{property.address_hint}</Text>
          ) : null}

          <View style={styles.statsGrid}>
            {property.bedrooms > 0 && (
              <View style={styles.statCard}>
                <Bed size={20} color={Colors.primary} />
                <Text style={styles.statCardValue}>{property.bedrooms}</Text>
                <Text style={styles.statCardLabel}>Chambre{property.bedrooms > 1 ? 's' : ''}</Text>
              </View>
            )}
            {property.bathrooms > 0 && (
              <View style={styles.statCard}>
                <Bath size={20} color={Colors.primary} />
                <Text style={styles.statCardValue}>{property.bathrooms}</Text>
                <Text style={styles.statCardLabel}>Salle{property.bathrooms > 1 ? 's' : ''} de bain</Text>
              </View>
            )}
            {property.surface_area > 0 && (
              <View style={styles.statCard}>
                <Maximize2 size={20} color={Colors.primary} />
                <Text style={styles.statCardValue}>{property.surface_area}</Text>
                <Text style={styles.statCardLabel}>m2</Text>
              </View>
            )}
          </View>

          {statusConf && (
            <View style={[styles.interestStatusCard, { borderColor: statusConf.color + '40' }]}>
              <View style={[styles.interestStatusHeader, { backgroundColor: statusConf.bg }]}>
                <statusConf.icon size={16} color={statusConf.color} />
                <Text style={[styles.interestStatusLabel, { color: statusConf.color }]}>{statusConf.label}</Text>
              </View>
              <Text style={styles.interestStatusDesc}>{statusConf.description}</Text>
              {interestStatus === 'accepted' && (
                <TouchableOpacity
                  style={styles.openChatBtn}
                  onPress={async () => {
                    if (!user) return;
                    const { data: conv } = await supabase
                      .from('conversations')
                      .select('id')
                      .eq('property_id', id)
                      .eq('tenant_id', user.id)
                      .maybeSingle();
                    if (conv) router.push(`/conversation/${conv.id}` as any);
                  }}
                >
                  <MessageCircle size={14} color={Colors.textInverse} />
                  <Text style={styles.openChatBtnText}>Ouvrir la conversation</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {property.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          ) : null}

          {amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipements & Caracteristiques</Text>
              <View style={styles.amenitiesGrid}>
                {amenities.map((a, i) => (
                  <View key={i} style={styles.amenityItem}>
                    {a.icon}
                    <Text style={styles.amenityText}>{a.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {property.keywords?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mots-cles</Text>
              <View style={styles.keywordsRow}>
                {property.keywords.map((kw, i) => (
                  <View key={i} style={styles.kwTag}>
                    <Text style={styles.kwTagText}>{kw}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {criteria && (
            <View style={styles.criteriaSection}>
              <View style={styles.criteriaTitleRow}>
                <Lock size={16} color={Colors.primary} />
                <Text style={styles.criteriaTitle}>Criteres du proprietaire</Text>
              </View>
              <Text style={styles.criteriaHint}>
                Verifiez que votre profil correspond a ces criteres avant de manifester votre interet.
              </Text>

              <View style={styles.criteriaGrid}>
                {criteria.min_monthly_income && (
                  <CriteriaItem icon={<DollarSign size={14} color={Colors.textSecondary} />} label="Revenu min./mois" value={`$${new Intl.NumberFormat('fr-FR').format(criteria.min_monthly_income)}`} />
                )}
                {criteria.max_occupants && (
                  <CriteriaItem icon={<Users size={14} color={Colors.textSecondary} />} label="Occupants max." value={`${criteria.max_occupants} personnes`} />
                )}
                {property.listing_type === 'rent' && criteria.advance_months && (
                  <CriteriaItem icon={<Calendar size={14} color={Colors.textSecondary} />} label="Mois d'avance" value={`${criteria.advance_months} mois`} />
                )}
                {property.listing_type === 'rent' && criteria.min_stay_months && (
                  <CriteriaItem icon={<Calendar size={14} color={Colors.textSecondary} />} label="Duree min." value={`${criteria.min_stay_months} mois`} />
                )}
                <CriteriaItem
                  icon={<PawPrint size={14} color={criteria.pets_allowed ? Colors.success : Colors.error} />}
                  label="Animaux"
                  value={criteria.pets_allowed ? 'Acceptes' : 'Non acceptes'}
                  positive={criteria.pets_allowed}
                />
                <CriteriaItem
                  icon={<Cigarette size={14} color={criteria.smoking_allowed ? Colors.success : Colors.error} />}
                  label="Fumeurs"
                  value={criteria.smoking_allowed ? 'Acceptes' : 'Non acceptes'}
                  positive={criteria.smoking_allowed}
                />
                {criteria.requires_guarantor && (
                  <CriteriaItem icon={<FileText size={14} color={Colors.warning} />} label="Caution" value="Requise" />
                )}
              </View>

              {criteria.allowed_profiles?.length > 0 && (
                <View style={styles.profileTypesRow}>
                  <Text style={styles.profileTypesLabel}>Profils recherches :</Text>
                  <View style={styles.profileTypesChips}>
                    {criteria.allowed_profiles.map((p, i) => (
                      <View key={i} style={styles.profileTypeChip}>
                        <Text style={styles.profileTypeText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {criteria.additional_requirements ? (
                <View style={styles.additionalReq}>
                  <AlertCircle size={14} color={Colors.warning} />
                  <Text style={styles.additionalReqText}>{criteria.additional_requirements}</Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.contactNote}>
            <Lock size={14} color={Colors.primary} />
            <Text style={styles.contactNoteText}>
              Toutes les communications se font exclusivement via 1 Futur Chez Vous.
              Votre identite reste protegee jusqu'a la signature du contrat.
            </Text>
          </View>

          {similarProperties.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle}>Biens similaires</Text>
              <FlatList
                data={similarProperties}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.similarCard}>
                    <PropertyCard
                      property={item}
                      isFavorite={favorites.has(item.id)}
                      onToggleFavorite={handleToggleSimilarFavorite}
                      style={{ width: width * 0.72 }}
                    />
                  </View>
                )}
                contentContainerStyle={styles.similarList}
              />
            </View>
          )}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>{property.listing_type === 'rent' ? 'Loyer mensuel' : 'Prix de vente'}</Text>
          <Text style={styles.footerPriceValue}>{formatPrice(property.price, property.listing_type)}</Text>
        </View>

        {interestStatus ? (
          <View style={[styles.interestSubmittedBtn, { borderColor: (statusConf?.color || Colors.success) + '60', backgroundColor: statusConf?.bg || Colors.successLight }]}>
            {statusConf && <statusConf.icon size={18} color={statusConf.color} />}
            <Text style={[styles.interestSubmittedText, { color: statusConf?.color || Colors.success }]}>{statusConf?.label || 'Envoye'}</Text>
          </View>
        ) : (
          <AnimatedPressable
            style={styles.interestBtn}
            onPress={() => user ? setShowInterestModal(true) : router.push('/(auth)/login' as any)}
            haptic="medium"
          >
            <MessageCircle size={18} color={Colors.textInverse} />
            <Text style={styles.interestBtnText}>Manifester mon interet</Text>
          </AnimatedPressable>
        )}
      </View>

      <Modal visible={showInterestModal} transparent animationType="slide" onRequestClose={() => setShowInterestModal(false)}>
        <TouchableOpacity style={modalStyles.backdrop} onPress={() => setShowInterestModal(false)} activeOpacity={1}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Manifester votre interet</Text>
              <TouchableOpacity onPress={() => setShowInterestModal(false)}>
                <X size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.content}>
              <View style={modalStyles.privacyNote}>
                <Lock size={14} color={Colors.primary} />
                <Text style={modalStyles.privacyText}>
                  Votre demande sera traitee par l'administrateur de 1 Futur Chez Vous. Vous ne communiquerez jamais directement avec le proprietaire - notre equipe assure la mediation.
                </Text>
              </View>

              <Text style={modalStyles.fieldLabel}>Message (optionnel)</Text>
              <TextInput
                style={modalStyles.textArea}
                placeholder="Presentez-vous brievement et expliquez votre interet pour ce bien..."
                placeholderTextColor={Colors.textTertiary}
                value={interestMessage}
                onChangeText={setInterestMessage}
                multiline
                numberOfLines={4}
              />

              <Button
                title="Envoyer ma demande"
                onPress={handleExpressInterest}
                loading={submittingInterest}
                size="lg"
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function CriteriaItem({ icon, label, value, positive }: { icon: React.ReactNode; label: string; value: string; positive?: boolean }) {
  return (
    <View style={criteriaStyles.item}>
      {icon}
      <View style={criteriaStyles.content}>
        <Text style={criteriaStyles.label}>{label}</Text>
        <Text style={[criteriaStyles.value, positive === false && criteriaStyles.valueNegative, positive === true && criteriaStyles.valuePositive]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const criteriaStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: '48%' },
  content: {},
  label: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500' },
  value: { fontSize: 13, color: Colors.text, fontWeight: '600', marginTop: 1 },
  valuePositive: { color: Colors.success },
  valueNegative: { color: Colors.error },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, color: Colors.text, fontWeight: '600' },
  backLink: { fontSize: 14, color: Colors.primary, textDecorationLine: 'underline' },
  imageSection: { position: 'relative' },
  mainImage: { width, height: 320 },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  imageControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  galleryArrowLeft: { left: 12 },
  galleryArrowRight: { right: 12 },
  galleryArrowDisabled: { opacity: 0.3 },
  dotsRow: {
    position: 'absolute',
    bottom: 42,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: Colors.textInverse,
    width: 20,
    borderRadius: 4,
  },
  imageFooter: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageCounter: { fontSize: 12, color: Colors.textInverse, fontWeight: '600' },
  contentSection: { padding: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  price: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  viewsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewsText: { fontSize: 12, color: Colors.textTertiary },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8, lineHeight: 24 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  location: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  addressHint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16, fontStyle: 'italic' },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 4,
  },
  statCardValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  statCardLabel: { fontSize: 11, color: Colors.textSecondary },
  interestStatusCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  interestStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  interestStatusLabel: { fontSize: 14, fontWeight: '700' },
  interestStatusDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  openChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginHorizontal: 14,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  openChatBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textInverse },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  amenityText: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kwTag: {
    backgroundColor: Colors.primaryLight + '18',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '40',
  },
  kwTagText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  criteriaSection: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.saleLight,
  },
  criteriaTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  criteriaTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  criteriaHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16, lineHeight: 18 },
  criteriaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 12 },
  profileTypesRow: { marginTop: 8 },
  profileTypesLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginBottom: 6 },
  profileTypesChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  profileTypeChip: {
    backgroundColor: Colors.primaryLight + '20',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  profileTypeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  additionalReq: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    backgroundColor: Colors.warningLight,
    padding: 10,
    borderRadius: 10,
  },
  additionalReqText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },
  contactNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.saleLight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  contactNoteText: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 },
  similarSection: { marginBottom: 16 },
  similarList: { gap: 12 },
  similarCard: { marginRight: 4 },
  bottomPadding: { height: 80 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  footerPrice: { flex: 1 },
  footerPriceLabel: { fontSize: 11, color: Colors.textSecondary },
  footerPriceValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  interestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  interestBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textInverse },
  interestSubmittedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  interestSubmittedText: { fontSize: 14, fontWeight: '700' },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  content: { padding: 20 },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.saleLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  privacyText: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    backgroundColor: Colors.surface,
  },
});
