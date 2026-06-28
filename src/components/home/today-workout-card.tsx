import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TodayWorkoutCardProps = {
  name: string;
  focus: string;
  duration: string;
  onStart: () => void;
};

export function TodayWorkoutCard({ name, focus, duration, onStart }: TodayWorkoutCardProps) {
  const theme = useTheme();

  return (
    <Card>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TODAY'S WORKOUT</Text>
      <Text style={[styles.workoutName, { color: theme.text }]}>{name}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>{focus}</Text>
        <Text style={[styles.metaDim, { color: theme.textTertiary }]}> · {duration}</Text>
      </View>
      <PrimaryButton label="Start Workout" onPress={onStart} fullWidth />
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
  workoutName: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
    marginBottom: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  meta: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  metaDim: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});
