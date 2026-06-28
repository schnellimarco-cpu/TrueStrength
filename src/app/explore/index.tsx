import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import {
  Badge,
  Card,
  EmptyState,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  SecondaryButton,
  SmallActionButton,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useWorkoutHub } from '@/hooks/use-workout-hub';
import { useActiveSplit } from '@/hooks/use-active-split';
import { useTheme } from '@/hooks/use-theme';

function timeAgo(isoString: string | null): string {
  if (!isoString) return '';
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 1) return 'Just started';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

export default function WorkoutHubScreen() {
  const theme = useTheme();
  const {
    activeSession,
    loading: sessionLoading,
    error: sessionError,
    refresh: refreshSession,
    startWorkout,
    resumeWorkout,
    discardActive,
  } = useWorkoutHub();

  const {
    activeSplit,
    loading: splitLoading,
    error: splitError,
    refresh: refreshSplit,
  } = useActiveSplit();

  useFocusEffect(
    useCallback(() => {
      refreshSession();
      refreshSplit();
    }, [refreshSession, refreshSplit])
  );

  const loading = sessionLoading || splitLoading;

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </ScreenContainer>
    );
  }

  const todayDay = activeSplit?.days[0] ?? null;

  return (
    <ScreenContainer scrollable contentStyle={{ gap: Spacing.three, paddingBottom: Spacing.five }}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Workout</Text>
        <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
          {activeSplit ? `${activeSplit.name} · Ready to train.` : 'Ready to train.'}
        </Text>
      </View>

      {(sessionError || splitError) && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {sessionError ?? splitError}
        </Text>
      )}

      {/* Active Workout Card */}
      {activeSession && (
        <Card>
          <SectionHeader title="Active Workout" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>{activeSession.title}</Text>
          <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
            {timeAgo(activeSession.startedAt)}
          </Text>
          <View style={styles.cardActions}>
            <PrimaryButton label="Resume Workout" onPress={resumeWorkout} fullWidth />
            <SmallActionButton label="Discard" onPress={discardActive} variant="ghost" />
          </View>
        </Card>
      )}

      {/* Today's Workout — only if active split has days */}
      {activeSplit && todayDay && (
        <Card>
          <SectionHeader title="Today" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>{todayDay.name}</Text>
          {todayDay.muscleGroups.length > 0 && (
            <View style={styles.badgeRow}>
              {todayDay.muscleGroups.map(mg => (
                <Badge key={mg.id} label={mg.name} variant="neutral" size="sm" />
              ))}
            </View>
          )}
          {todayDay.estimatedDurationMinutes && (
            <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
              ~{todayDay.estimatedDurationMinutes} min
            </Text>
          )}
          <View style={styles.cardActions}>
            {activeSession ? (
              <SecondaryButton
                label="Start Workout"
                onPress={() => startWorkout(todayDay.name)}
                fullWidth
                disabled
              />
            ) : (
              <PrimaryButton
                label="Start Workout"
                onPress={() => startWorkout(todayDay.name)}
                fullWidth
              />
            )}
          </View>
        </Card>
      )}

      {/* Current Split */}
      {activeSplit ? (
        <Card>
          <SectionHeader
            title="Current Split"
            action={{ label: 'Edit', onPress: () => router.push(`/explore/split-editor?id=${activeSplit.id}`) }}
          />
          <Text style={[styles.cardTitle, { color: theme.text }]}>{activeSplit.name}</Text>
          <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
            {activeSplit.days.length}-day split · {activeSplit.workoutsPerWeek} workouts / week
          </Text>
        </Card>
      ) : (
        <Card>
          <SectionHeader title="Training Split" />
          <EmptyState
            title="No active split"
            description="Create a training split to plan your workouts."
            symbol="list.bullet"
          />
          <View style={[styles.cardActions, { marginTop: Spacing.two }]}>
            <PrimaryButton
              label="Create Split"
              onPress={() => router.push('/explore/new-split')}
              fullWidth
            />
          </View>
        </Card>
      )}

      {/* Exercise Library */}
      <SecondaryButton
        label="Browse Exercise Library"
        onPress={() => router.push('/explore/exercises')}
        fullWidth
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageHeader: {
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
  },
  pageSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: Spacing.one,
  },
  cardMeta: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  cardActions: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
