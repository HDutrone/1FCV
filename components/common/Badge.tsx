import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

type BadgeVariant = 'sale' | 'rent' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export default function Badge({ label, variant = 'neutral', size = 'md', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[`variant_${variant}`], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  size_sm: { paddingVertical: 2, paddingHorizontal: 7 },
  size_md: { paddingVertical: 4, paddingHorizontal: 10 },
  variant_sale: { backgroundColor: Colors.saleLight },
  variant_rent: { backgroundColor: Colors.rentLight },
  variant_success: { backgroundColor: Colors.successLight },
  variant_warning: { backgroundColor: Colors.warningLight },
  variant_error: { backgroundColor: Colors.errorLight },
  variant_info: { backgroundColor: Colors.infoLight },
  variant_neutral: { backgroundColor: Colors.surfaceSecondary },
  text: { fontWeight: '700', letterSpacing: 0.3 },
  textSize_sm: { fontSize: 10 },
  textSize_md: { fontSize: 11 },
  text_sale: { color: Colors.sale },
  text_rent: { color: Colors.accent },
  text_success: { color: Colors.success },
  text_warning: { color: Colors.warning },
  text_error: { color: Colors.error },
  text_info: { color: Colors.info },
  text_neutral: { color: Colors.textSecondary },
});
