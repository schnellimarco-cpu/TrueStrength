import { StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BadgeVariant = 'accent' | 'neutral' | 'success' | 'error';
type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
};

export function Badge({ label, variant = 'neutral', size = 'md' }: BadgeProps) {
  const theme = useTheme();

  const bg = {
    accent: theme.accentSubtle,
    neutral: theme.surface,
    success: 'rgba(52,199,89,0.12)',
    error: 'rgba(255,59,48,0.12)',
  }[variant];

  const textColor = {
    accent: theme.accent,
    neutral: theme.textSecondary,
    success: theme.success,
    error: theme.error,
  }[variant];

  return (
    <View
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: bg },
      ]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  sm: {
    height: 18,
  },
  md: {
    height: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
  },
});
