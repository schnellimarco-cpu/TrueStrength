import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StrengthScoreCardProps = {
  value: number | null;
  weeklyChange?: string | null;
  ninetyDayChange?: string | null;
  personalBest?: string;
  trend: string;
};

export function StrengthScoreCard({
  value,
  weeklyChange,
  ninetyDayChange,
  personalBest,
  trend,
}: StrengthScoreCardProps) {
  const theme = useTheme();
  const showStats = weeklyChange != null || ninetyDayChange != null;

  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>STRENGTH SCORE</Text>
        {personalBest && <Badge label={personalBest} variant="accent" size="sm" />}
      </View>

      <View style={styles.heroArea}>
        <Text style={[styles.heroScore, { color: theme.accent }]}>
          {value != null ? Math.round(value) : '—'}
        </Text>
        <Text style={[styles.trend, { color: theme.textSecondary }]}>{trend}</Text>
      </View>

      {showStats && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.statsRow}>
            {weeklyChange != null && (
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: theme.accent }]}>{weeklyChange}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>This Week</Text>
              </View>
            )}
            {weeklyChange != null && ninetyDayChange != null && (
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            )}
            {ninetyDayChange != null && (
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: theme.accent }]}>{ninetyDayChange}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>90 Days</Text>
              </View>
            )}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.8,
  },
  heroArea: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingBottom: Spacing.three,
  },
  heroScore: {
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 64,
    letterSpacing: -1,
  },
  trend: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.two,
  },
  statsRow: {
    flexDirection: 'row',
    paddingTop: Spacing.one,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: Spacing.one,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
    letterSpacing: 0.4,
  },
});
