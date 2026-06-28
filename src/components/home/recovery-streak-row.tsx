import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type RecoveryStreakRowProps = {
  recovery: { status: string; message: string };
  streak: { current: number; best: number };
};

export function RecoveryStreakRow({ recovery, streak }: RecoveryStreakRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Card style={styles.card}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RECOVERY</Text>
        <View style={styles.badgeWrap}>
          <Badge label={recovery.status} variant="success" />
        </View>
        <Text style={[styles.message, { color: theme.textSecondary }]}>{recovery.message}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>STREAK</Text>
        <Text style={[styles.streakValue, { color: theme.accent }]}>{streak.current}</Text>
        <Text style={[styles.streakUnit, { color: theme.textSecondary }]}>days current</Text>
        <Text style={[styles.bestStreak, { color: theme.textTertiary }]}>
          Best: {streak.best} days
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  card: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
  },
  badgeWrap: {
    marginBottom: Spacing.two,
  },
  message: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: Spacing.half,
  },
  streakUnit: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: Spacing.one,
  },
  bestStreak: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  },
});
