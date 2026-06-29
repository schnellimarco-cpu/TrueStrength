import { useCallback, useMemo } from 'react';
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
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useBodyweight } from '@/hooks/use-bodyweight';
import { useProgress } from '@/hooks/use-progress';
import { useTheme } from '@/hooks/use-theme';
import { formatVolume, pctChange } from '@/lib/progress-service';
import type { MuscleGroupProgress, PersonalRecordPreview } from '@/types/progress';

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function ProgressScreen() {
  const theme = useTheme();
  const { overview, muscleGroups, personalRecords, loading, refresh } = useProgress();
  const { currentWeight, history } = useBodyweight();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const weightTrend = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    const recent = history.filter(e => new Date(e.measuredAt).getTime() >= cutoff);
    if (recent.length < 2) return null;
    const delta = recent[0].weightKg - recent[recent.length - 1].weightKg;
    const sign = delta >= 0 ? '▲ +' : '▼ ';
    return `${sign}${Math.abs(delta).toFixed(1)} kg this month`;
  }, [history]);

  const weekChange = overview ? pctChange(overview.currentWeekVolume, overview.previousWeekVolume) : null;
  const monthChange = overview ? pctChange(overview.currentMonthVolume, overview.previousMonthVolume) : null;

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

  if (loading && !overview) {
    return (
      <ScreenContainer>
        <SectionHeader title="Progress" size="large" />
      </ScreenContainer>
    );
  }

  if (!overview || overview.totalWorkouts === 0) {
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

  return (
    <ScreenContainer scrollable contentStyle={styles.content}>
      <SectionHeader title="Progress" size="large" />
      <ThemedText style={styles.subtitle}>Your strength at a glance</ThemedText>

      {/* Overview grid */}
      <View style={styles.grid}>
        <View style={styles.gridCell}>
          <StatCard
            value={overview.totalWorkouts}
            label="Workouts"
          />
        </View>
        <View style={styles.gridCell}>
          <StatCard
            value={formatVolume(overview.totalVolume)}
            label="Total Volume"
            unit="kg"
          />
        </View>
        <View style={styles.gridCell}>
          <StatCard
            value={formatVolume(overview.currentWeekVolume)}
            label="This Week"
            unit="kg"
            delta={weekChange?.delta}
            positive={weekChange?.positive}
          />
        </View>
        <View style={styles.gridCell}>
          <StatCard
            value={formatVolume(overview.currentMonthVolume)}
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
            {muscleGroups.slice(0, 5).map((mg: MuscleGroupProgress, idx) => (
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
            {weightTrend ? (
              <ThemedText style={styles.bwTrend}>{weightTrend}</ThemedText>
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
      {personalRecords.length > 0 && (
        <>
          <SectionHeader title="Personal Records" />
          <Card>
            {personalRecords.map((pr: PersonalRecordPreview, idx) => (
              <View
                key={pr.exerciseName}
                style={[
                  styles.prRow,
                  idx === personalRecords.length - 1 && styles.prRowLast,
                ]}
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
    </ScreenContainer>
  );
}
