import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Card } from './card';

type StatCardProps = {
  value: string | number;
  label: string;
  unit?: string;
  delta?: string;
  positive?: boolean;
};

export function StatCard({ value, label, unit, delta, positive }: StatCardProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
        {unit && (
          <Text style={[styles.unit, { color: theme.textSecondary }]}>{unit}</Text>
        )}
      </View>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      {delta && (
        <Text style={[styles.delta, { color: positive ? theme.success : theme.error }]}>
          {delta}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  unit: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  delta: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: Spacing.half,
  },
});
