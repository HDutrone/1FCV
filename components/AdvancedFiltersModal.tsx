import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Switch,
} from 'react-native';
import { X, RotateCcw } from 'lucide-react-native';
import { PropertyFilters, PropertyType } from '@/lib/types';
import { Colors } from '@/constants/colors';
import Input from './common/Input';
import Button from './common/Button';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'Maison' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Terrain' },
];

interface AdvancedFiltersModalProps {
  visible: boolean;
  filters: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onClose: () => void;
}

export default function AdvancedFiltersModal({ visible, filters, onApply, onClose }: AdvancedFiltersModalProps) {
  const [local, setLocal] = useState<PropertyFilters>({ ...filters });

  const resetFilters = () => {
    setLocal({
      listingType: filters.listingType,
      cityId: filters.cityId,
      communeId: filters.communeId,
    });
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const activeCount = [
    local.propertyType,
    local.minPrice,
    local.maxPrice,
    local.minBedrooms,
    local.minBathrooms,
    local.minArea,
    local.maxArea,
    local.isFurnished,
    local.hasGarage,
    local.hasPool,
    local.hasGarden,
    local.hasSecurity,
  ].filter(Boolean).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Filtres avances</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <RotateCcw size={14} color={Colors.primary} />
              <Text style={styles.resetText}>Reinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Type de bien</Text>
            <View style={styles.typeGrid}>
              {PROPERTY_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, local.propertyType === t.value && styles.typeChipActive]}
                  onPress={() => setLocal(p => ({
                    ...p,
                    propertyType: p.propertyType === t.value ? undefined : t.value,
                  }))}
                >
                  <Text style={[styles.typeChipText, local.propertyType === t.value && styles.typeChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Budget (USD)</Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Input
                  label="Min"
                  placeholder="0"
                  value={local.minPrice?.toString() || ''}
                  onChangeText={v => setLocal(p => ({ ...p, minPrice: v ? parseInt(v) : undefined }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Input
                  label="Max"
                  placeholder="Illimite"
                  value={local.maxPrice?.toString() || ''}
                  onChangeText={v => setLocal(p => ({ ...p, maxPrice: v ? parseInt(v) : undefined }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Nombre de pieces</Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Input
                  label="Chambres min."
                  placeholder="0"
                  value={local.minBedrooms?.toString() || ''}
                  onChangeText={v => setLocal(p => ({ ...p, minBedrooms: v ? parseInt(v) : undefined }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Input
                  label="SDB min."
                  placeholder="0"
                  value={local.minBathrooms?.toString() || ''}
                  onChangeText={v => setLocal(p => ({ ...p, minBathrooms: v ? parseInt(v) : undefined }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Surface (m2)</Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Input
                  label="Min"
                  placeholder="0"
                  value={local.minArea?.toString() || ''}
                  onChangeText={v => setLocal(p => ({ ...p, minArea: v ? parseInt(v) : undefined }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <Input
                  label="Max"
                  placeholder="Illimite"
                  value={local.maxArea?.toString() || ''}
                  onChangeText={v => setLocal(p => ({ ...p, maxArea: v ? parseInt(v) : undefined }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Equipements</Text>
            <View style={styles.switchList}>
              {[
                { key: 'isFurnished' as const, label: 'Meuble' },
                { key: 'hasGarage' as const, label: 'Garage' },
                { key: 'hasPool' as const, label: 'Piscine' },
                { key: 'hasGarden' as const, label: 'Jardin' },
                { key: 'hasSecurity' as const, label: 'Securite' },
              ].map(item => (
                <View key={item.key} style={styles.switchRow}>
                  <Text style={styles.switchLabel}>{item.label}</Text>
                  <Switch
                    value={!!local[item.key]}
                    onValueChange={v => setLocal(p => ({ ...p, [item.key]: v || undefined }))}
                    trackColor={{ true: Colors.primary }}
                    thumbColor={Colors.textInverse}
                  />
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title={`Appliquer${activeCount > 0 ? ` (${activeCount})` : ''}`}
              onPress={handleApply}
              size="lg"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resetText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 8, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  typeChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary, borderWidth: 1, borderColor: Colors.border,
  },
  typeChipActive: { backgroundColor: Colors.primaryLight + '20', borderColor: Colors.primary },
  typeChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  typeChipTextActive: { color: Colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  switchList: { gap: 2 },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  switchLabel: { fontSize: 15, color: Colors.text },
  footer: {
    padding: 20, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
});
