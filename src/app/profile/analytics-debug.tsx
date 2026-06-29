import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Card, ScreenContainer, SectionHeader } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useAnalytics } from '@/hooks/use-analytics';
import { useTheme } from '@/hooks/use-theme';

export default function AnalyticsDebugScreen() {
  const theme = useTheme();
  const { snapshot, loading, error, refresh } = useAnalytics();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const styles = StyleSheet.create({
    content: {
      gap: Spacing.three,
      paddingBottom: Spacing.five,
    },
    label: {
      ...Typography.footnote,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    value: {
      ...Typography.subhead,
      color: theme.text,
      fontFamily: 'monospace',
    },
    row: {
      marginBottom: Spacing.two,
    },
    tableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    tableCell: {
      ...Typography.footnote,
      color: theme.text,
      flex: 1,
    },
    tableCellRight: {
      ...Typography.footnote,
      color: theme.textSecondary,
      textAlign: 'right',
    },
    insightPriority: {
      ...Typography.caption,
      color: theme.accent,
      textTransform: 'uppercase' as const,
      marginBottom: 2,
    },
  });

  if (loading && !snapshot) {
    return (
      <ScreenContainer>
        <SectionHeader title="Analytics Debug" size="large" />
        <ThemedText style={styles.value}>Loading…</ThemedText>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <SectionHeader title="Analytics Debug" size="large" />
        <ThemedText style={[styles.value, { color: 'red' }]}>{error}</ThemedText>
      </ScreenContainer>
    );
  }

  if (!snapshot) {
    return (
      <ScreenContainer>
        <SectionHeader title="Analytics Debug" size="large" />
        <ThemedText style={styles.value}>No snapshot</ThemedText>
      </ScreenContainer>
    );
  }

  const { volume, strength, bodyweight, consistency, recovery, personalRecords } = snapshot.metrics;

  return (
    <ScreenContainer scrollable contentStyle={styles.content}>
      <SectionHeader title="Analytics Debug" size="large" />

      {/* Generated At */}
      <Card>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Generated At</ThemedText>
          <ThemedText style={styles.value}>{snapshot.generatedAt}</ThemedText>
        </View>
      </Card>

      {/* Consistency */}
      <SectionHeader title="Consistency" />
      <Card>
        {[
          ['Total Workouts', String(consistency.totalCompletedWorkouts)],
          ['Current Streak', `${consistency.currentStreak} days`],
          ['Workouts This Week', String(consistency.actualWorkoutsThisWeek)],
          ['Workouts Last Week', String(consistency.actualWorkoutsLastWeek)],
          ['Planned / Week', consistency.plannedWorkoutsPerWeek != null ? String(consistency.plannedWorkoutsPerWeek) : '—'],
          ['Latest Workout', consistency.latestWorkoutDate ?? '—'],
        ].map(([label, val]) => (
          <View key={label} style={styles.tableRow}>
            <ThemedText style={styles.tableCell}>{label}</ThemedText>
            <ThemedText style={styles.tableCellRight}>{val}</ThemedText>
          </View>
        ))}
      </Card>

      {/* Volume */}
      <SectionHeader title="Volume" />
      <Card>
        {[
          ['Total', `${volume.totalVolume.toFixed(0)} kg`],
          ['This Week', `${volume.currentWeekVolume.toFixed(0)} kg`],
          ['Last Week', `${volume.previousWeekVolume.toFixed(0)} kg`],
          ['This Month', `${volume.currentMonthVolume.toFixed(0)} kg`],
          ['Last Month', `${volume.previousMonthVolume.toFixed(0)} kg`],
        ].map(([label, val]) => (
          <View key={label} style={styles.tableRow}>
            <ThemedText style={styles.tableCell}>{label}</ThemedText>
            <ThemedText style={styles.tableCellRight}>{val}</ThemedText>
          </View>
        ))}
        {volume.volumeByMuscleGroup.map(mg => (
          <View key={mg.muscleGroup} style={styles.tableRow}>
            <ThemedText style={styles.tableCell}>{mg.muscleGroup}</ThemedText>
            <ThemedText style={styles.tableCellRight}>
              {mg.setCount} sets · {(mg.fraction * 100).toFixed(0)}%
            </ThemedText>
          </View>
        ))}
      </Card>

      {/* Strength */}
      <SectionHeader title="Strength (All Bests)" />
      <Card>
        {strength.exerciseBests.length === 0 ? (
          <ThemedText style={styles.value}>No data</ThemedText>
        ) : strength.exerciseBests.map(ex => (
          <View key={ex.exerciseName} style={styles.tableRow}>
            <ThemedText style={styles.tableCell}>{ex.exerciseName}</ThemedText>
            <ThemedText style={styles.tableCellRight}>
              {ex.maxWeightKg} kg{ex.bestEstimated1RM != null ? ` · 1RM ~${Math.round(ex.bestEstimated1RM)}` : ''}
            </ThemedText>
          </View>
        ))}
      </Card>

      {/* Bodyweight */}
      <SectionHeader title="Bodyweight" />
      <Card>
        {[
          ['Current', bodyweight.currentEntry
            ? `${bodyweight.currentEntry.weightKg} ${bodyweight.currentEntry.unit}`
            : '—'],
          ['30d Delta', bodyweight.trend30DayDeltaKg != null
            ? `${bodyweight.trend30DayDeltaKg > 0 ? '+' : ''}${bodyweight.trend30DayDeltaKg.toFixed(1)} kg`
            : '—'],
          ['30d Label', bodyweight.trend30DayLabel ?? '—'],
        ].map(([label, val]) => (
          <View key={label} style={styles.tableRow}>
            <ThemedText style={styles.tableCell}>{label}</ThemedText>
            <ThemedText style={styles.tableCellRight}>{val}</ThemedText>
          </View>
        ))}
      </Card>

      {/* Recovery */}
      <SectionHeader title="Recovery" />
      <Card>
        <View style={styles.tableRow}>
          <ThemedText style={styles.tableCell}>Days Since Last Workout</ThemedText>
          <ThemedText style={styles.tableCellRight}>
            {recovery.daysSinceLastWorkout != null ? `${recovery.daysSinceLastWorkout}d` : '—'}
          </ThemedText>
        </View>
        {recovery.muscleGroupRecovery.map(r => (
          <View key={r.muscleGroup} style={styles.tableRow}>
            <ThemedText style={styles.tableCell}>{r.muscleGroup}</ThemedText>
            <ThemedText style={styles.tableCellRight}>{r.daysSinceLastTrained}d ago</ThemedText>
          </View>
        ))}
      </Card>

      {/* Personal Records */}
      <SectionHeader title="Personal Records (Top 5)" />
      <Card>
        {personalRecords.topRecords.length === 0 ? (
          <ThemedText style={styles.value}>No data</ThemedText>
        ) : personalRecords.topRecords.map(pr => (
          <View key={pr.exerciseName} style={styles.tableRow}>
            <ThemedText style={styles.tableCell}>{pr.exerciseName}</ThemedText>
            <ThemedText style={styles.tableCellRight}>
              {pr.maxWeightKg} kg{pr.bestEstimated1RM != null ? ` · 1RM ~${Math.round(pr.bestEstimated1RM)}` : ''}
            </ThemedText>
          </View>
        ))}
      </Card>

      {/* Insights */}
      <SectionHeader title={`Insights (${snapshot.insights.length})`} />
      {snapshot.insights.length === 0 ? (
        <Card>
          <ThemedText style={styles.value}>No insights generated</ThemedText>
        </Card>
      ) : snapshot.insights.map(ins => (
        <Card key={ins.id}>
          <ThemedText style={styles.insightPriority}>
            {ins.priority.toUpperCase()} · {ins.category}
          </ThemedText>
          <ThemedText style={[styles.value, { marginBottom: 4 }]}>{ins.title}</ThemedText>
          <ThemedText style={styles.label}>{ins.description}</ThemedText>
        </Card>
      ))}
    </ScreenContainer>
  );
}
