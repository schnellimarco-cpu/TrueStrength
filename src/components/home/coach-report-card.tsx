import { StyleSheet, Text, View } from 'react-native';

import { Card, SecondaryButton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CoachReportCardProps = {
  grade: string;
  recommendation: string;
  onViewReport: () => void;
};

export function CoachReportCard({ grade, recommendation, onViewReport }: CoachReportCardProps) {
  const theme = useTheme();

  return (
    <Card>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>MONDAY COACH</Text>
      <View style={styles.gradeRow}>
        <Text style={[styles.grade, { color: theme.accent }]}>{grade}</Text>
        <Text style={[styles.gradeLabel, { color: theme.textSecondary }]}>Weekly Grade</Text>
      </View>
      <Text style={[styles.recommendation, { color: theme.textSecondary }]}>
        {recommendation}
      </Text>
      <SecondaryButton label="View Full Report" onPress={onViewReport} size="sm" />
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  grade: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
  },
  gradeLabel: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  recommendation: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
});
