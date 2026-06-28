import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  size?: 'large' | 'normal';
};

export function SectionHeader({
  title,
  subtitle,
  action,
  size = 'normal',
}: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={size === 'large' ? styles.containerLarge : styles.containerNormal}>
      <View style={styles.row}>
        <Text
          style={[
            size === 'large' ? styles.titleLarge : styles.titleNormal,
            { color: size === 'large' ? theme.text : theme.textSecondary },
          ]}>
          {size === 'normal' ? title.toUpperCase() : title}
        </Text>
        {action && (
          <Pressable
            onPress={action.onPress}
            style={({ pressed }) => pressed && styles.pressed}>
            <Text style={[styles.actionText, { color: theme.accent }]}>
              {action.label}
            </Text>
          </Pressable>
        )}
      </View>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerLarge: {
    marginBottom: Spacing.one,
    paddingTop: Spacing.two,
  },
  containerNormal: {
    marginBottom: Spacing.two,
    paddingTop: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleLarge: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
    flex: 1,
  },
  titleNormal: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.8,
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.6,
  },
});
