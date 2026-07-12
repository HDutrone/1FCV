import React from 'react';
import { Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/theme';
import AnimatedPressable from './AnimatedPressable';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    styles[`textVariant_${variant}`],
    textStyle,
  ];

  const content = loading ? (
    <ActivityIndicator color={variant === 'primary' || variant === 'secondary' || variant === 'danger' ? Colors.textInverse : Colors.primary} size="small" />
  ) : (
    <Text style={textStyles}>{title}</Text>
  );

  if (variant === 'primary' || variant === 'secondary') {
    const gradientColors = variant === 'primary' ? Colors.gradientPrimary : Colors.gradientAccent;
    return (
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled || loading}
        haptic="light"
        style={[styles.base, styles[`size_${size}`], (disabled || loading) && styles.disabled, style]}
      >
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject as ViewStyle}
        />
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      haptic="light"
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  size_sm: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radius.sm },
  size_md: { paddingVertical: 14, paddingHorizontal: 24 },
  size_lg: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: Radius.lg },
  variant_outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  variant_ghost: { backgroundColor: 'transparent' },
  variant_danger: { backgroundColor: Colors.error },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '700' },
  text_sm: { fontSize: 13 },
  text_md: { fontSize: 15 },
  text_lg: { fontSize: 17 },
  textVariant_primary: { color: Colors.textInverse },
  textVariant_secondary: { color: Colors.textInverse },
  textVariant_outline: { color: Colors.primary },
  textVariant_ghost: { color: Colors.primary },
  textVariant_danger: { color: Colors.textInverse },
});
