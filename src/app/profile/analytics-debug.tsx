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

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.tableRow}>
        <ThemedText style={styles.tableCell}>{label}</ThemedText>
        <ThemedText style={styles.tableCellRight}>{value}</ThemedText>
      </View>
    );
  }

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

      {/* Raw Data Summary */}
      <SectionHeader title="Raw Data Summary" />
      <Card>
        <Row label="Workouts" value={String(snapshot.rawSummary.workoutCount)} />
        <Row label="Unique Exercises" value={String(snapshot.rawSummary.uniqueExerciseCount)} />
        <Row label="Total Completed Sets" value={String(snapshot.rawSummary.totalSets)} />
        <Row label="Bodyweight Entries" value={String(snapshot.rawSummary.bodyweightEntryCount)} />
        <Row label="Active Split" value={snapshot.rawSummary.hasActiveSplit ? 'Yes' : 'No'} />
      </Card>

      {/* Consistency */}
      <SectionHeader title="Consistency" />
      <Card>
        <Row label="Total Workouts" value={String(consistency.totalCompletedWorkouts)} />
        <Row label="Current Streak" value={`${consistency.currentStreak} days`} />
        <Row label="Longest Streak" value={`${consistency.longestStreak} days`} />
        <Row label="Workouts This Week" value={String(consistency.actualWorkoutsThisWeek)} />
        <Row label="Workouts Last Week" value={String(consistency.actualWorkoutsLastWeek)} />
        <Row
          label="Avg / Week"
          value={consistency.averageWorkoutsPerWeek != null
            ? consistency.averageWorkoutsPerWeek.toFixed(1)
            : '—'}
        />
        <Row
          label="Completion Rate"
          value={consistency.completionRate != null
            ? `${(consistency.completionRate * 100).toFixed(0)}%`
            : '—'}
        />
        <Row
          label="Planned / Week"
          value={consistency.plannedWorkoutsPerWeek != null
            ? String(consistency.plannedWorkoutsPerWeek)
            : '—'}
        />
        <Row label="Latest Workout" value={consistency.latestWorkoutDate ?? '—'} />
      </Card>

      {/* Volume */}
      <SectionHeader title="Volume" />
      <Card>
        <Row label="Total" value={`${volume.totalVolume.toFixed(0)} kg`} />
        <Row label="Avg / Workout" value={`${volume.averageWorkoutVolume.toFixed(0)} kg`} />
        <Row label="Avg Sets / Workout" value={volume.averageSetsPerWorkout.toFixed(1)} />
        <Row label="Avg Reps / Workout" value={volume.averageRepsPerWorkout.toFixed(0)} />
        <Row label="This Week" value={`${volume.currentWeekVolume.toFixed(0)} kg`} />
        <Row label="Last Week" value={`${volume.previousWeekVolume.toFixed(0)} kg`} />
        <Row label="This Month" value={`${volume.currentMonthVolume.toFixed(0)} kg`} />
        <Row label="Last Month" value={`${volume.previousMonthVolume.toFixed(0)} kg`} />
        {volume.volumeByMuscleGroup.map(mg => (
          <Row
            key={mg.muscleGroup}
            label={mg.muscleGroup}
            value={`${mg.setCount} sets · ${(mg.fraction * 100).toFixed(0)}%`}
          />
        ))}
      </Card>

      {/* Top Exercises by Volume */}
      <SectionHeader title="Top Exercises (Volume)" />
      <Card>
        {volume.volumeByExercise.length === 0 ? (
          <ThemedText style={styles.value}>No data</ThemedText>
        ) : volume.volumeByExercise.slice(0, 10).map(ex => (
          <Row
            key={ex.exerciseName}
            label={ex.exerciseName}
            value={`${ex.totalVolume.toFixed(0)} kg · ${ex.setCount} sets`}
          />
        ))}
      </Card>

      {/* Strength */}
      <SectionHeader title="Strength" />
      <Card>
        <Row
          label="Avg Intensity"
          value={strength.averageIntensityKg != null
            ? `${strength.averageIntensityKg.toFixed(1)} kg`
            : '—'}
        />
        {strength.exerciseBests.map(ex => (
          <Row
            key={ex.exerciseName}
            label={ex.exerciseName}
            value={`${ex.maxWeightKg} kg${ex.bestEstimated1RM != null ? ` · 1RM ~${Math.round(ex.bestEstimated1RM)}` : ''}${ex.bestSetDate ? ` (${ex.bestSetDate})` : ''}`}
          />
        ))}
      </Card>

      {/* Bodyweight */}
      <SectionHeader title="Bodyweight" />
      <Card>
        <Row
          label="Current"
          value={bodyweight.currentEntry
            ? `${bodyweight.currentEntry.weightKg} ${bodyweight.currentEntry.unit}`
            : '—'}
        />
        <Row
          label="Average"
          value={bodyweight.averageBodyweightKg != null
            ? `${bodyweight.averageBodyweightKg.toFixed(1)} kg`
            : '—'}
        />
        <Row
          label="All-Time Change"
          value={bodyweight.allTimeChangeKg != null
            ? `${bodyweight.allTimeChangeKg > 0 ? '+' : ''}${bodyweight.allTimeChangeKg.toFixed(1)} kg`
            : '—'}
        />
        <Row
          label="30d Delta"
          value={bodyweight.trend30DayDeltaKg != null
            ? `${bodyweight.trend30DayDeltaKg > 0 ? '+' : ''}${bodyweight.trend30DayDeltaKg.toFixed(1)} kg`
            : '—'}
        />
        <Row label="30d Label" value={bodyweight.trend30DayLabel ?? '—'} />
        <Row
          label="Workout Date Map"
          value={`${Object.keys(bodyweight.workoutDateWeightMap).length} entries`}
        />
      </Card>

      {/* Recovery */}
      <SectionHeader title="Recovery" />
      <Card>
        <Row
          label="Days Since Last Workout"
          value={recovery.daysSinceLastWorkout != null ? `${recovery.daysSinceLastWorkout}d` : '—'}
        />
        {recovery.muscleGroupRecovery.map(r => (
          <Row
            key={r.muscleGroup}
            label={r.muscleGroup}
            value={`${r.daysSinceLastTrained}d ago`}
          />
        ))}
      </Card>

      {/* Personal Records */}
      <SectionHeader title="Personal Records (Top 5)" />
      <Card>
        {personalRecords.topRecords.length === 0 ? (
          <ThemedText style={styles.value}>No data</ThemedText>
        ) : personalRecords.topRecords.map(pr => (
          <Row
            key={pr.exerciseName}
            label={pr.exerciseName}
            value={`${pr.maxWeightKg} kg${pr.bestEstimated1RM != null ? ` · 1RM ~${Math.round(pr.bestEstimated1RM)}` : ''}`}
          />
        ))}
      </Card>

      {/* Recent PRs */}
      <SectionHeader title={`Recent PRs (${personalRecords.recentPRCandidates.length})`} />
      <Card>
        {personalRecords.recentPRCandidates.length === 0 ? (
          <ThemedText style={styles.value}>No PRs in last 30 days</ThemedText>
        ) : personalRecords.recentPRCandidates.map(pr => (
          <Row
            key={pr.exerciseName}
            label={pr.exerciseName}
            value={`${pr.maxWeightKg} kg · ${pr.bestSetDate ?? '—'}`}
          />
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

      {/* Strength Score */}
      <SectionHeader title={`Strength Score (${snapshot.strengthScore.formula.toUpperCase()})`} />
      <Card>
        <Row
          label="Overall Score"
          value={snapshot.strengthScore.overallScore?.toFixed(1) ?? '—'}
        />
        <Row
          label="Valid Exercises"
          value={String(snapshot.strengthScore.validExerciseCount)}
        />
        <Row
          label="Excluded"
          value={String(snapshot.strengthScore.excludedExerciseCount)}
        />
        <Row
          label="Missing Bodyweight"
          value={snapshot.strengthScore.missingBodyweight ? 'Yes' : 'No'}
        />
        {snapshot.strengthScore.exerciseScores.slice(0, 10).map(s => (
          <Row
            key={s.exerciseName}
            label={s.exerciseName}
            value={`${s.relativeStrengthScore.toFixed(1)} · 1RM ${s.bestEstimatedOneRepMax.toFixed(0)} kg @ ${s.bodyweightUsed.toFixed(1)} kg BW`}
          />
        ))}
      </Card>
    </ScreenContainer>
  );
}
