import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Card, PrimaryButton, ScreenContainer } from '@/components/ui';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getWorkoutDetail } from '@/lib/workout-history-service';
import type { CompletedWorkoutDetail } from '@/types/workout-history';

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatVolume(kg: number): string {
  if (kg <= 0) return '0 kg';
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`;
}

export default function WorkoutSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [workout, setWorkout] = useState<CompletedWorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getWorkoutDetail(id)
      .then(data => setWorkout(data))
      .catch(e => console.error('[WorkoutSummary]', e))
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
        <View style={styles.centered}>
          <Text style={{ color: theme.textSecondary }}>Workout not found.</Text>
        </View>
        <PrimaryButton label="Done" onPress={() => router.replace('/explore')} fullWidth />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentStyle={{ gap: Spacing.four, paddingBottom: Spacing.five }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.accent }]}>WORKOUT COMPLETE</Text>
        <Text style={[styles.title, { color: theme.text }]}>{workout.title}</Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>{formatDate(workout.date)}</Text>
      </View>

      {/* Stats row */}
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
            <Text style={[styles.statValue, { color: theme.text }]}>
              {workout.exerciseCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Exercises</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {workout.setCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sets</Text>
          </View>
        </View>
      </Card>

      {/* Exercise summary */}
      {workout.exercises.length > 0 && (
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>EXERCISES</Text>
          {workout.exercises.map((ex, i) => (
            <View
              key={ex.id}
              style={[
                styles.exerciseRow,
                i < workout.exercises.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}>
              <Text style={[styles.exerciseName, { color: theme.text }]}>{ex.exerciseName}</Text>
              <Text style={[styles.exerciseMeta, { color: theme.textSecondary }]}>
                {ex.sets.filter(s => s.completed).length} sets
                {ex.muscleGroup ? ` · ${ex.muscleGroup}` : ''}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Actions */}
      <PrimaryButton label="Done" onPress={() => router.replace('/explore')} fullWidth />
      <Pressable
        onPress={() => router.push(`/explore/workout-detail?id=${id}`)}
        style={styles.detailLink}>
        <Text style={[styles.detailLinkText, { color: theme.textSecondary }]}>
          View Full Details
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: Spacing.four,
    gap: Spacing.one,
    alignItems: 'center',
  },
  label: {
    ...Typography.label,
    letterSpacing: 1,
  },
  title: {
    ...Typography.title1,
    textAlign: 'center',
  },
  date: {
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
  sectionTitle: {
    ...Typography.label,
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  exerciseRow: {
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  exerciseName: {
    ...Typography.headline,
  },
  exerciseMeta: {
    ...Typography.footnote,
  },
  detailLink: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  detailLinkText: {
    ...Typography.subhead,
  },
});
