import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { City, Commune, PropertyFilters } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useMode } from '@/context/ModeContext';
import AdvancedFiltersModal from './AdvancedFiltersModal';

interface FilterBarProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
}

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const { mode, setMode } = useMode();
  const [cities, setCities] = useState<City[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCommunePicker, setShowCommunePicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    supabase.from('cities').select('*').order('name').then(({ data }) => {
      if (data) setCities(data as City[]);
    });
  }, []);

  useEffect(() => {
    if (filters.cityId) {
      supabase.from('communes').select('*').eq('city_id', filters.cityId).order('name')
        .then(({ data }) => {
          if (data) setCommunes(data as Commune[]);
        });
    } else {
      setCommunes([]);
    }
  }, [filters.cityId]);

  const selectedCity = cities.find(c => c.id === filters.cityId);
  const selectedCommune = communes.find(c => c.id === filters.communeId);

  const handleCitySelect = (city: City | null) => {
    onFiltersChange({ ...filters, cityId: city?.id, communeId: undefined });
    setShowCityPicker(false);
  };

  const handleCommuneSelect = (commune: Commune | null) => {
    onFiltersChange({ ...filters, communeId: commune?.id });
    setShowCommunePicker(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'rent' && styles.modeBtnActive]}
          onPress={() => {
            setMode('rent');
            onFiltersChange({ ...filters, listingType: 'rent' });
          }}
        >
          <Text style={[styles.modeBtnText, mode === 'rent' && styles.modeBtnTextActive]}>
            Location
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'sale' && styles.modeBtnActiveSale]}
          onPress={() => {
            setMode('sale');
            onFiltersChange({ ...filters, listingType: 'sale' });
          }}
        >
          <Text style={[styles.modeBtnText, mode === 'sale' && styles.modeBtnTextActive]}>
            Achat
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        <TouchableOpacity style={styles.filterChip} onPress={() => setShowCityPicker(true)}>
          <Text style={[styles.chipText, selectedCity && styles.chipTextActive]}>
            {selectedCity ? selectedCity.name : 'Ville'}
          </Text>
          <ChevronDown size={13} color={selectedCity ? Colors.primary : Colors.textSecondary} />
          {selectedCity && (
            <TouchableOpacity
              onPress={() => onFiltersChange({ ...filters, cityId: undefined, communeId: undefined })}
              style={styles.clearChip}
            >
              <X size={11} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {filters.cityId && (
          <TouchableOpacity style={styles.filterChip} onPress={() => setShowCommunePicker(true)}>
            <Text style={[styles.chipText, selectedCommune && styles.chipTextActive]}>
              {selectedCommune ? selectedCommune.name : 'Commune'}
            </Text>
            <ChevronDown size={13} color={selectedCommune ? Colors.primary : Colors.textSecondary} />
            {selectedCommune && (
              <TouchableOpacity
                onPress={() => onFiltersChange({ ...filters, communeId: undefined })}
                style={styles.clearChip}
              >
                <X size={11} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.filterIconBtn} onPress={() => setShowAdvanced(true)}>
          <SlidersHorizontal size={14} color={Colors.textSecondary} />
          <Text style={styles.chipText}>Filtres</Text>
        </TouchableOpacity>
      </ScrollView>

      <PickerModal
        visible={showCityPicker}
        title="Choisir une ville"
        items={cities}
        selectedId={filters.cityId}
        onSelect={(item) => handleCitySelect(item as City)}
        onClose={() => setShowCityPicker(false)}
      />
      <PickerModal
        visible={showCommunePicker}
        title="Choisir une commune"
        items={communes}
        selectedId={filters.communeId}
        onSelect={(item) => handleCommuneSelect(item as Commune)}
        onClose={() => setShowCommunePicker(false)}
      />
      <AdvancedFiltersModal
        visible={showAdvanced}
        filters={filters}
        onApply={onFiltersChange}
        onClose={() => setShowAdvanced(false)}
      />
    </View>
  );
}

function PickerModal({
  visible, title, items, selectedId, onSelect, onClose,
}: {
  visible: boolean;
  title: string;
  items: { id: string; name: string }[];
  selectedId?: string;
  onSelect: (item: { id: string; name: string } | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pickerStyles.backdrop} onPress={onClose} activeOpacity={1}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={pickerStyles.clearOption} onPress={() => onSelect(null)}>
            <Text style={pickerStyles.clearOptionText}>Toutes les options</Text>
          </TouchableOpacity>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
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
  container: {
    backgroundColor: Colors.surface,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modeBtnActive: {
    backgroundColor: Colors.accentLight + '20',
    borderColor: Colors.accent,
  },
  modeBtnActiveSale: {
    backgroundColor: Colors.primaryLight + '20',
    borderColor: Colors.primary,
  },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  modeBtnTextActive: { color: Colors.primary },
  filtersRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  clearChip: { marginLeft: 2 },
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
  clearOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  clearOptionText: { fontSize: 15, color: Colors.textSecondary },
  option: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  optionSelected: { backgroundColor: Colors.primaryLight + '15' },
  optionText: { fontSize: 15, color: Colors.text },
  optionTextSelected: { color: Colors.primary, fontWeight: '600' },
});
