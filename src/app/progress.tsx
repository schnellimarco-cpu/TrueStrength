import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import {
  Card,
  EmptyState,
  PrimaryButton,
  ProgressBar,
  ScreenContainer,
  SecondaryButton,
  SectionHeader,
  StatCard,
} from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useAnalytics } from '@/hooks/use-analytics';
import { useTheme } from '@/hooks/use-theme';
import { formatVolume, pctChange, getTopCoachInsights } from '@/lib/analytics';
import type { MuscleGroupVolume, ExerciseBest, AnalyticsInsight } from '@/types/analytics';

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function ProgressScreen() {
  const theme = useTheme();
  const { snapshot, loading, refresh } = useAnalytics();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const styles = StyleSheet.create({
    subtitle: {
      ...Typography.subhead,
      color: theme.textSecondary,
      marginBottom: Spacing.one,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
    },
    gridCell: {
      flex: 1,
      minWidth: '45%',
    },
    muscleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      marginBottom: Spacing.two,
    },
    muscleName: {
      ...Typography.subhead,
      color: theme.text,
      width: 92,
    },
    muscleBar: {
      flex: 1,
    },
    muscleCount: {
      ...Typography.footnote,
      color: theme.textSecondary,
      width: 50,
      textAlign: 'right',
    },
    prRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.two,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    prRowLast: {
      borderBottomWidth: 0,
    },
    prName: {
      ...Typography.subhead,
      color: theme.text,
      flex: 1,
    },
    prWeight: {
      ...Typography.subhead,
      color: theme.text,
      fontWeight: '700',
    },
    pr1rm: {
      ...Typography.footnote,
      color: theme.textSecondary,
      marginLeft: Spacing.two,
      width: 70,
      textAlign: 'right',
    },
    bwRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.one,
    },
    bwValue: {
      ...Typography.title1,
      color: theme.text,
    },
    bwUnit: {
      ...Typography.title3,
      color: theme.textSecondary,
    },
    bwUpdated: {
      ...Typography.footnote,
      color: theme.textSecondary,
      marginTop: Spacing.one,
    },
    bwTrend: {
      ...Typography.subhead,
      color: theme.accent,
      marginTop: Spacing.one,
    },
    insightRow: {
      paddingVertical: Spacing.two,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    insightRowLast: {
      borderBottomWidth: 0,
    },
    insightTitle: {
      ...Typography.subhead,
      color: theme.text,
      fontWeight: '600' as const,
      marginBottom: Spacing.one,
    },
    insightDesc: {
      ...Typography.footnote,
      color: theme.textSecondary,
    },
    ssHero: {
      alignItems: 'center' as const,
      paddingVertical: Spacing.two,
      gap: Spacing.one,
    },
    ssScore: {
      ...Typography.largeTitle,
      color: theme.accent,
      fontWeight: '700' as const,
    },
    ssLabel: {
      ...Typography.footnote,
      color: theme.textSecondary,
    },
    content: {
      gap: Spacing.three,
      paddingBottom: Spacing.five,
    },
    emptyContent: {
      flex: 1,
      justifyContent: 'center',
      gap: Spacing.three,
      paddingBottom: Spacing.five,
    },
  });

  if (loading && !snapshot) {
    return (
      <ScreenContainer>
        <SectionHeader title="Progress" size="large" />
      </ScreenContainer>
    );
  }

  const totalWorkouts = snapshot?.metrics.consistency.totalCompletedWorkouts ?? 0;

  if (!snapshot || totalWorkouts === 0) {
    return (
      <ScreenContainer contentStyle={styles.emptyContent}>
        <SectionHeader title="Progress" size="large" />
        <EmptyState
          title="No progress yet"
          description="Complete your first workout to unlock progress analytics."
          symbol="chart.bar.fill"
        />
        <PrimaryButton
          label="Start Workout"
          onPress={() => router.push('/explore')}
          fullWidth
        />
      </ScreenContainer>
    );
  }

  const { volume, bodyweight, personalRecords, consistency } = snapshot.metrics;
  const muscleGroups = volume.volumeByMuscleGroup;
  const records = personalRecords.topRecords;
  const currentWeight = bodyweight.currentEntry;

  const weekChange = pctChange(volume.currentWeekVolume, volume.previousWeekVolume);
  const monthChange = pctChange(volume.currentMonthVolume, volume.previousMonthVolume);

  return (
    <ScreenContainer scrollable contentStyle={styles.content}>
      <SectionHeader title="Progress" size="large" />
      <ThemedText style={styles.subtitle}>Your strength at a glance</ThemedText>

      {/* Strength Score */}
      <SectionHeader title="Strength Score" />
      {snapshot.strengthScore.missingBodyweight ? (
        <>
          <EmptyState
            title="Add bodyweight to unlock"
            description="Your Strength Score is bodyweight-relative. Add your weight to calculate it."
            symbol="scalemass.fill"
          />
          <PrimaryButton
            label="Add Weight"
            onPress={() => router.push('/profile/update-weight')}
            fullWidth
          />
        </>
      ) : snapshot.strengthScore.overallScore == null ? (
        <EmptyState
          title="No valid sets yet"
          description="Log weight and reps to calculate your Strength Score."
          symbol="dumbbell.fill"
        />
      ) : (
        <Card>
          <View style={styles.ssHero}>
            <ThemedText style={styles.ssScore}>
              {snapshot.strengthScore.overallScore.toFixed(1)}
            </ThemedText>
            <ThemedText style={styles.ssLabel}>
              DOTS · {snapshot.strengthScore.validExerciseCount} exercise{snapshot.strengthScore.validExerciseCount === 1 ? '' : 's'}
            </ThemedText>
          </View>
          {snapshot.strengthScore.exerciseScores.slice(0, 3).map((s, idx, arr) => (
            <View
              key={s.exerciseName}
              style={[styles.prRow, idx === arr.length - 1 && styles.prRowLast]}
            >
              <ThemedText style={styles.prName}>{s.exerciseName}</ThemedText>
              <ThemedText style={styles.prWeight}>{s.relativeStrengthScore.toFixed(1)}</ThemedText>
            </View>
          ))}
        </Card>
      )}

      {/* Overview grid */}
      <View style={styles.grid}>
        <View style={styles.gridCell}>
          <StatCard value={totalWorkouts} label="Workouts" />
        </View>
        <View style={styles.gridCell}>
          <StatCard value={formatVolume(volume.totalVolume)} label="Total Volume" unit="kg" />
        </View>
        <View style={styles.gridCell}>
          <StatCard
            value={formatVolume(volume.currentWeekVolume)}
            label="This Week"
            unit="kg"
            delta={weekChange?.delta}
            positive={weekChange?.positive}
          />
        </View>
        <View style={styles.gridCell}>
          <StatCard
            value={formatVolume(volume.currentMonthVolume)}
            label="This Month"
            unit="kg"
            delta={monthChange?.delta}
            positive={monthChange?.positive}
          />
        </View>
      </View>

      {/* Muscle groups */}
      {muscleGroups.length > 0 && (
        <>
          <SectionHeader title="Most Trained" />
          <Card>
            {muscleGroups.slice(0, 5).map((mg: MuscleGroupVolume, idx) => (
              <View
                key={mg.muscleGroup}
                style={[
                  styles.muscleRow,
                  idx === Math.min(muscleGroups.length, 5) - 1 && { marginBottom: 0 },
                ]}
              >
                <ThemedText style={styles.muscleName}>{mg.muscleGroup}</ThemedText>
                <View style={styles.muscleBar}>
                  <ProgressBar progress={mg.fraction} height={8} />
                </View>
                <ThemedText style={styles.muscleCount}>{mg.setCount} sets</ThemedText>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Bodyweight */}
      <SectionHeader title="Bodyweight" />
      {currentWeight ? (
        <>
          <Card>
            <View style={styles.bwRow}>
              <ThemedText style={styles.bwValue}>
                {currentWeight.weightKg % 1 === 0
                  ? currentWeight.weightKg.toFixed(0)
                  : currentWeight.weightKg.toFixed(1)}
              </ThemedText>
              <ThemedText style={styles.bwUnit}>{currentWeight.unit}</ThemedText>
            </View>
            <ThemedText style={styles.bwUpdated}>
              Last updated: {relativeDate(currentWeight.measuredAt)}
            </ThemedText>
            {bodyweight.trend30DayLabel ? (
              <ThemedText style={styles.bwTrend}>{bodyweight.trend30DayLabel}</ThemedText>
            ) : null}
          </Card>
          <SecondaryButton
            label="Update Weight"
            onPress={() => router.push('/profile/update-weight')}
            fullWidth
          />
        </>
      ) : (
        <>
          <EmptyState
            title="No weight data"
            description="Add your bodyweight to improve future strength analysis."
            symbol="scalemass.fill"
          />
          <PrimaryButton
            label="Add Weight"
            onPress={() => router.push('/profile/update-weight')}
            fullWidth
          />
        </>
      )}

      {/* Personal Records */}
      {records.length > 0 && (
        <>
          <SectionHeader title="Personal Records" />
          <Card>
            {records.map((pr: ExerciseBest, idx) => (
              <View
                key={pr.exerciseName}
                style={[styles.prRow, idx === records.length - 1 && styles.prRowLast]}
              >
                <ThemedText style={styles.prName}>{pr.exerciseName}</ThemedText>
                <ThemedText style={styles.prWeight}>
                  {pr.maxWeightKg % 1 === 0
                    ? pr.maxWeightKg.toFixed(0)
                    : pr.maxWeightKg.toFixed(1)} kg
                </ThemedText>
                <ThemedText style={styles.pr1rm}>
                  {pr.bestEstimated1RM != null
                    ? `1RM ~${Math.round(pr.bestEstimated1RM)} kg`
                    : ''}
                </ThemedText>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Top Insights */}
      {snapshot.insights.length > 0 && (() => {
        const topInsights = getTopCoachInsights(snapshot, 3);
        return (
          <>
            <SectionHeader title="Insights" />
            <Card>
              {topInsights.map((insight: AnalyticsInsight, idx: number) => (
                <View
                  key={insight.id}
                  style={[styles.insightRow, idx === topInsights.length - 1 && styles.insightRowLast]}
                >
                  <ThemedText style={styles.insightTitle}>{insight.title}</ThemedText>
                  <ThemedText style={styles.insightDesc}>{insight.description}</ThemedText>
                </View>
              ))}
            </Card>
          </>
        );
      })()}

      {/* Streak info */}
      {consistency.currentStreak >= 2 && (
        <ThemedText style={[styles.subtitle, { textAlign: 'center' }]}>
          🔥 {consistency.currentStreak}-day training streak
        </ThemedText>
      )}
    </ScreenContainer>
  );
}
