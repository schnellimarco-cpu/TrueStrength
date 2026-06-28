import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Card, IconButton, ScreenContainer } from '@/components/ui';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getWorkoutDetail } from '@/lib/workout-history-service';
import type { CompletedWorkoutDetail, CompletedWorkoutExercise } from '@/types/workout-history';

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatVolume(kg: number): string {
  if (kg <= 0) return '0 kg';
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`;
}

function ExerciseSection({ exercise }: { exercise: CompletedWorkoutExercise }) {
  const theme = useTheme();
  const completedSets = exercise.sets.filter(s => s.completed);

  return (
    <View style={[styles.exerciseBlock, { borderColor: theme.border }]}>
      <View style={styles.exerciseHeader}>
        <Text style={[styles.exerciseName, { color: theme.text }]}>{exercise.exerciseName}</Text>
        {exercise.muscleGroup ? (
          <Text style={[styles.exerciseMuscle, { color: theme.accent }]}>
            {exercise.muscleGroup}
          </Text>
        ) : null}
      </View>

      {/* Set table header */}
      <View style={styles.setRow}>
        <Text style={[styles.setHeaderCell, styles.setNumCell, { color: theme.textTertiary }]}>SET</Text>
        <Text style={[styles.setHeaderCell, styles.setWeightCell, { color: theme.textTertiary }]}>KG</Text>
        <Text style={[styles.setHeaderCell, styles.setRepsCell, { color: theme.textTertiary }]}>REPS</Text>
        <Text style={[styles.setHeaderCell, styles.setVolCell, { color: theme.textTertiary }]}>VOL</Text>
      </View>

      {exercise.sets.map(s => (
        <View
          key={s.id}
          style={[
            styles.setRow,
            !s.completed && { opacity: 0.4 },
          ]}>
          <Text style={[styles.setCell, styles.setNumCell, { color: theme.textSecondary }]}>
            {s.setNumber}
          </Text>
          <Text style={[styles.setCell, styles.setWeightCell, { color: theme.text }]}>
            {s.weightKg > 0 ? s.weightKg : '—'}
          </Text>
          <Text style={[styles.setCell, styles.setRepsCell, { color: theme.text }]}>
            {s.reps > 0 ? s.reps : '—'}
          </Text>
          <Text style={[styles.setCell, styles.setVolCell, { color: theme.textSecondary }]}>
            {s.completed && s.volume > 0 ? `${Math.round(s.volume)}` : '—'}
          </Text>
        </View>
      ))}

      {completedSets.length === 0 && (
        <Text style={[styles.noSets, { color: theme.textTertiary }]}>No completed sets</Text>
      )}
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [workout, setWorkout] = useState<CompletedWorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getWorkoutDetail(id)
      .then(data => setWorkout(data))
      .catch(e => console.error('[WorkoutDetail]', e))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </ScreenContainer>
    );
  }

  if (!workout) {
    return (
      <ScreenContainer>
        <View style={styles.topBar}>
          <IconButton name="chevron.left" onPress={() => router.back()} accessibilityLabel="Back" />
        </View>
        <View style={styles.centered}>
          <Text style={{ color: theme.textSecondary }}>Workout not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentStyle={{ gap: Spacing.three, paddingBottom: Spacing.five }}>
      <View style={styles.topBar}>
        <IconButton name="chevron.left" onPress={() => router.back()} accessibilityLabel="Back" />
      </View>

      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>{workout.title}</Text>
        <Text style={[styles.pageDate, { color: theme.textSecondary }]}>
          {formatDate(workout.date || workout.completedAt)}
        </Text>
      </View>

      {/* Stats */}
      <Card>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatDuration(workout.durationSeconds)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Duration</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatVolume(workout.totalVolume)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Volume</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.text }]}>{workout.setCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sets</Text>
          </View>
        </View>
      </Card>

      {/* Exercises */}
      {workout.exercises.map(ex => (
        <ExerciseSection key={ex.id} exercise={ex} />
      ))}

      {workout.exercises.length === 0 && (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No exercises recorded.</Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageHeader: {
    gap: Spacing.one,
  },
  pageTitle: {
    ...Typography.title1,
  },
  pageDate: {
    ...Typography.body,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  statValue: {
    ...Typography.title3,
  },
  statLabel: {
    ...Typography.caption,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  exerciseBlock: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  exerciseHeader: {
    gap: Spacing.half,
  },
  exerciseName: {
    ...Typography.headline,
  },
  exerciseMuscle: {
    ...Typography.footnote,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setHeaderCell: {
    ...Typography.label,
    letterSpacing: 0.5,
  },
  setCell: {
    ...Typography.subhead,
  },
  setNumCell: { width: 36 },
  setWeightCell: { flex: 1 },
  setRepsCell: { flex: 1 },
  setVolCell: { flex: 1, textAlign: 'right' },
  noSets: {
    ...Typography.footnote,
  },
  empty: {
    ...Typography.body,
    textAlign: 'center',
    paddingTop: Spacing.four,
  },
});
