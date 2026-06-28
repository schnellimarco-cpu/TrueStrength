import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card, SmallActionButton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SetRow } from './set-row';
import type { WorkoutExercise } from './types';

type ExerciseCardProps = {
  exercise: WorkoutExercise;
  onAddSet: () => void;
  onUpdateSet: (setId: string, field: 'weight' | 'reps', value: string) => void;
  onToggleSet: (setId: string) => void;
  onStartRestTimer: () => void;
};

export function ExerciseCard({
  exercise,
  onAddSet,
  onUpdateSet,
  onToggleSet,
  onStartRestTimer,
}: ExerciseCardProps) {
  const theme = useTheme();

  let workingCount = 0;

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[styles.exerciseName, { color: theme.text }]}>{exercise.name}</Text>
        <Badge label={exercise.muscleGroup} variant="neutral" size="sm" />
      </View>

      <Text style={[styles.prevBest, { color: theme.textTertiary }]}>
        Prev: {exercise.previousBest}
      </Text>

      <View style={styles.colHeader}>
        <Text style={[styles.colLabel, { width: 28, textAlign: 'center', color: theme.textTertiary }]}>
          SET
        </Text>
        <Text style={[styles.colLabel, { flex: 2, textAlign: 'center', color: theme.textTertiary }]}>
          KG
        </Text>
        <Text style={[styles.colLabel, { width: 12, color: theme.textTertiary }]} />
        <Text style={[styles.colLabel, { flex: 1, textAlign: 'center', color: theme.textTertiary }]}>
          REPS
        </Text>
        <Text style={[styles.colLabel, { width: 44, textAlign: 'center', color: theme.textTertiary }]}>
          ✓
        </Text>
      </View>

      <View style={styles.setsContainer}>
        {exercise.sets.map(set => {
          let displayIndex: string;
          if (set.type === 'warmup') {
            displayIndex = 'W';
          } else {
            workingCount += 1;
            displayIndex = String(workingCount);
          }
          return (
            <SetRow
              key={set.id}
              set={set}
              displayIndex={displayIndex}
              onUpdate={(field, value) => onUpdateSet(set.id, field, value)}
              onToggle={() => onToggleSet(set.id)}
            />
          );
        })}
      </View>

      <View style={styles.footer}>
        <SmallActionButton label="Add Set" onPress={onAddSet} variant="ghost" />
        <SmallActionButton label="Rest Timer" onPress={onStartRestTimer} variant="ghost" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    flex: 1,
    marginRight: Spacing.two,
  },
  prevBest: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: Spacing.two,
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
    marginBottom: Spacing.one,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
    letterSpacing: 0.4,
  },
  setsContainer: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
