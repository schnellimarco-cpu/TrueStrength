import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { EmptyState, IconButton, ScreenContainer } from '@/components/ui';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useWorkoutHistory } from '@/hooks/use-workout-history';
import { useTheme } from '@/hooks/use-theme';
import type { CompletedWorkoutSummary } from '@/types/workout-history';

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatRelativeDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatVolume(kg: number): string {
  if (kg <= 0) return '';
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`;
}

function WorkoutHistoryCard({ workout }: { workout: CompletedWorkoutSummary }) {
  const theme = useTheme();
  const duration = formatDuration(workout.durationSeconds);
  const volume = formatVolume(workout.totalVolume);

  const meta = [
    duration,
    `${workout.setCount} sets`,
    volume,
  ].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => router.push(`/explore/workout-detail?id=${workout.id}`)}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardMain}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{workout.title}</Text>
        {workout.splitDayName && (
          <Text style={[styles.cardSplit, { color: theme.accent }]}>{workout.splitDayName}</Text>
        )}
        <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>{meta}</Text>
      </View>
      <Text style={[styles.cardDate, { color: theme.textTertiary }]}>
        {formatRelativeDate(workout.date || workout.completedAt)}
      </Text>
    </Pressable>
  );
}

export default function WorkoutHistoryScreen() {
  const theme = useTheme();
  const { recentWorkouts, loading, refresh } = useWorkoutHistory();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <ScreenContainer scrollable contentStyle={{ gap: Spacing.three, paddingBottom: Spacing.five }}>
      <View style={styles.topBar}>
        <IconButton name="chevron.left" onPress={() => router.back()} accessibilityLabel="Back" />
      </View>

      <Text style={[styles.pageTitle, { color: theme.text }]}>Workout History</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : recentWorkouts.length === 0 ? (
        <EmptyState
          title="No workouts yet"
          description="Complete your first workout to see it here."
          symbol="clock"
        />
      ) : (
        recentWorkouts.map(w => <WorkoutHistoryCard key={w.id} workout={w} />)
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: Spacing.two,
  },
  pageTitle: {
    ...Typography.title1,
  },
  centered: {
    paddingTop: Spacing.five,
    alignItems: 'center',
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  cardMain: {
    flex: 1,
    gap: Spacing.half,
  },
  cardTitle: {
    ...Typography.headline,
  },
  cardSplit: {
    ...Typography.footnote,
  },
  cardMeta: {
    ...Typography.footnote,
  },
  cardDate: {
    ...Typography.footnote,
    marginTop: 2,
  },
});
