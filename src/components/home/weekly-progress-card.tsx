import { StyleSheet, Text, View } from 'react-native';

import { Card, ProgressBar } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type WeeklyProgressCardProps = {
  completed: number;
  total: number;
};

export function WeeklyProgressCard({ completed, total }: WeeklyProgressCardProps) {
  const theme = useTheme();
  const progress = completed / total;
  const pct = Math.round(progress * 100);

  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>WEEKLY PROGRESS</Text>
        <Text style={[styles.count, { color: theme.accent }]}>
          {completed} of {total} workouts
        </Text>
      </View>
      <ProgressBar progress={progress} height={8} />
      <Text style={[styles.pctLabel, { color: theme.textSecondary }]}>{pct}% completion</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.8,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  pctLabel: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: Spacing.two,
  },
});
