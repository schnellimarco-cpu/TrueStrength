import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useWorkoutHub } from '@/hooks/use-workout-hub';
import { useWorkoutHistory } from '@/hooks/use-workout-history';
import { useWorkoutPlanning } from '@/hooks/use-workout-planning';
import { useTheme } from '@/hooks/use-theme';
import { isoDate } from '@/lib/workout-planning-service';
import type { CalendarDay } from '@/types/calendar';
import type { CompletedWorkoutSummary } from '@/types/workout-history';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeDate(isoDateStr: string): string {
  if (!isoDateStr) return '';
  const d = new Date(isoDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function upcomingDayLabel(isoDateStr: string): string {
  const today = isoDate(new Date());
  const d = new Date(isoDateStr);
  d.setHours(0, 0, 0, 0);
  const todayD = new Date(today);
  todayD.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - todayD.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

// ─── Week Calendar ───────────────────────────────────────────────────────────

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function dotColor(
  state: CalendarDay['state'],
  colors: { accent: string; success: string; border: string; error: string }
) {
  switch (state) {
    case 'completed': return colors.success;
    case 'active':    return colors.error;
    case 'planned':   return colors.accent;
    case 'today':     return colors.accent;
    default:          return colors.border;
  }
}

function WeekCalendar({
  days,
  weekOffset,
  onOffsetChange,
  onDayPress,
}: {
  days: CalendarDay[];
  weekOffset: number;
  onOffsetChange: (n: number) => void;
  onDayPress: (day: CalendarDay) => void;
}) {
  const theme = useTheme();
  const todayStr = isoDate(new Date());

  return (
    <View style={calStyles.wrapper}>
      {/* Navigation row */}
      <View style={calStyles.navRow}>
        <Pressable onPress={() => onOffsetChange(weekOffset - 1)} style={calStyles.navBtn}>
          <Text style={[calStyles.navArrow, { color: theme.textSecondary }]}>‹</Text>
        </Pressable>
        <Text style={[calStyles.weekLabel, { color: theme.textSecondary }]}>
          {weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
        </Text>
        <Pressable onPress={() => onOffsetChange(weekOffset + 1)} style={calStyles.navBtn}>
          <Text style={[calStyles.navArrow, { color: theme.textSecondary }]}>›</Text>
        </Pressable>
      </View>

      {/* Day columns */}
      <View style={calStyles.daysRow}>
        {days.map((day, i) => {
          const isToday = day.date === todayStr;
          const color = dotColor(day.state, {
            accent: theme.accent,
            success: theme.success,
            border: theme.border,
            error: theme.error,
          });

          return (
            <Pressable key={day.date} onPress={() => onDayPress(day)} style={calStyles.dayCol}>
              <Text style={[calStyles.dayLetter, { color: isToday ? theme.accent : theme.textTertiary }]}>
                {DAY_LETTERS[i]}
              </Text>
              <Text style={[calStyles.dayNum, { color: isToday ? theme.accent : theme.textSecondary }]}>
                {new Date(day.date + 'T12:00:00').getDate()}
              </Text>
              <View
                style={[
                  calStyles.dot,
                  { backgroundColor: color },
                  day.state === 'rest' && { opacity: 0.3 },
                  isToday && day.state === 'today' && calStyles.todayDotRing,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    padding: Spacing.two,
  },
  navArrow: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '300',
  },
  weekLabel: {
    ...Typography.footnote,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  dayLetter: {
    ...Typography.caption,
  },
  dayNum: {
    ...Typography.captionBold,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
  },
  todayDotRing: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
});

// ─── Recent Workout Card ─────────────────────────────────────────────────────

function RecentWorkoutCard({ workout }: { workout: CompletedWorkoutSummary }) {
  const theme = useTheme();
  const duration = formatDuration(workout.durationSeconds);
  const meta = [duration, `${workout.setCount} sets`].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => router.push(`/explore/workout-detail?id=${workout.id}`)}
      style={[rwStyles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={rwStyles.main}>
        <Text style={[rwStyles.title, { color: theme.text }]}>{workout.title}</Text>
        <Text style={[rwStyles.meta, { color: theme.textSecondary }]}>{meta}</Text>
      </View>
      <Text style={[rwStyles.date, { color: theme.textTertiary }]}>
        {formatRelativeDate(workout.date || workout.completedAt)}
      </Text>
    </Pressable>
  );
}

const rwStyles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  main: { flex: 1, gap: Spacing.half },
  title: { ...Typography.headline },
  meta: { ...Typography.footnote },
  date: { ...Typography.footnote },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function WorkoutHubScreen() {
  const theme = useTheme();
  const [expandHistory, setExpandHistory] = useState(false);

  const {
    activeSession,
    loading: hubLoading,
    error: hubError,
    refresh: refreshHub,
    startWorkout,
    resumeWorkout,
    discardActive,
  } = useWorkoutHub();

  const { recentWorkouts, loading: histLoading, refresh: refreshHistory } = useWorkoutHistory();

  const activeDate = activeSession?.startedAt ? isoDate(new Date(activeSession.startedAt)) : null;

  const {
    upcomingWorkouts,
    calendarDays,
    todayWorkout,
    weekOffset,
    setWeekOffset,
    activeSplit,
  } = useWorkoutPlanning(activeDate);

  useFocusEffect(
    useCallback(() => {
      refreshHub();
      refreshHistory();
    }, [refreshHub, refreshHistory])
  );

  const loading = hubLoading || histLoading;

  function handleCalendarDayPress(day: CalendarDay) {
    if (day.state === 'completed' && day.workoutId) {
      Alert.alert(
        day.workoutTitle ?? 'Workout',
        formatRelativeDate(day.date),
        [
          { text: 'View Workout', onPress: () => router.push(`/explore/workout-detail?id=${day.workoutId}`) },
          { text: 'Close', style: 'cancel' },
        ]
      );
    } else if ((day.state === 'planned' || day.state === 'today') && day.splitDayName) {
      const muscleStr = day.muscleGroups?.join(', ') ?? '';
      Alert.alert(
        day.splitDayName,
        muscleStr || 'Planned workout',
        [
          {
            text: 'Start Workout',
            onPress: () => {
              const splitDay = activeSplit?.days.find(d => d.id === day.splitDayId);
              startWorkout(day.splitDayName!, {
                splitId: activeSplit?.id,
                splitDayId: day.splitDayId,
                splitDayExercises: splitDay?.exercises ?? [],
              });
            },
          },
          { text: 'Close', style: 'cancel' },
        ]
      );
    } else if (day.state === 'active' && activeSession) {
      resumeWorkout();
    }
  }

  const displayedHistory = expandHistory ? recentWorkouts : recentWorkouts.slice(0, 3);

  return (
    <ScreenContainer scrollable contentStyle={{ gap: Spacing.four, paddingBottom: Spacing.five }}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Workout</Text>
        {activeSplit && (
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            {activeSplit.name}
          </Text>
        )}
      </View>

      {(hubError) && (
        <Text style={[styles.errorText, { color: theme.error }]}>{hubError}</Text>
      )}

      {loading && !activeSession && recentWorkouts.length === 0 && (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      )}

      {/* ── TRAIN ─────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="Train" />

        {/* Active session */}
        {activeSession && (
          <Card>
            <Text style={[styles.cardLabel, { color: theme.accent }]}>IN PROGRESS</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{activeSession.title}</Text>
            <View style={styles.cardActions}>
              <PrimaryButton label="Resume Workout" onPress={resumeWorkout} fullWidth />
              <SmallActionButton label="Discard" onPress={discardActive} variant="ghost" />
            </View>
          </Card>
        )}

        {/* Today's planned workout */}
        {todayWorkout ? (
          <Card>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>TODAY</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{todayWorkout.splitDayName}</Text>
            {todayWorkout.muscleGroups.length > 0 && (
              <View style={styles.badgeRow}>
                {todayWorkout.muscleGroups.map(mg => (
                  <Badge key={mg} label={mg} variant="neutral" size="sm" />
                ))}
              </View>
            )}
            <View style={styles.cardActions}>
              {activeSession ? (
                <SecondaryButton label="Start Workout" onPress={() => {}} fullWidth disabled />
              ) : (
                <PrimaryButton
                  label="Start Workout"
                  onPress={() => {
                    const splitDay = activeSplit?.days.find(d => d.id === todayWorkout.splitDayId);
                    startWorkout(todayWorkout.splitDayName, {
                      splitId: activeSplit?.id,
                      splitDayId: todayWorkout.splitDayId,
                      splitDayExercises: splitDay?.exercises ?? [],
                    });
                  }}
                  fullWidth
                />
              )}
            </View>
          </Card>
        ) : !activeSession && activeSplit ? (
          <Card>
            <EmptyState
              title="Rest day"
              description="No workout planned today. Recover and come back strong."
              symbol="moon"
            />
          </Card>
        ) : !activeSession && !activeSplit ? (
          <Card>
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
        ) : null}
      </View>

      {/* ── PLAN ──────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="Plan" />

        {/* Calendar strip */}
        {calendarDays.length > 0 && (
          <Card>
            <WeekCalendar
              days={calendarDays}
              weekOffset={weekOffset}
              onOffsetChange={setWeekOffset}
              onDayPress={handleCalendarDayPress}
            />
          </Card>
        )}

        {/* Upcoming workouts */}
        {upcomingWorkouts.length > 0 && (
          <Card>
            <Text style={[styles.cardSectionLabel, { color: theme.textSecondary }]}>UPCOMING</Text>
            {upcomingWorkouts.slice(0, 5).map(w => (
              <View key={w.date} style={[styles.upcomingRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.upcomingDay, { color: w.isToday ? theme.accent : theme.textSecondary }]}>
                  {upcomingDayLabel(w.date)}
                </Text>
                <View style={styles.upcomingMain}>
                  <Text style={[styles.upcomingName, { color: theme.text }]}>{w.splitDayName}</Text>
                  {w.muscleGroups.length > 0 && (
                    <Text style={[styles.upcomingMuscles, { color: theme.textSecondary }]}>
                      {w.muscleGroups.join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Current split */}
        {activeSplit ? (
          <Card>
            <SectionHeader
              title="Current Split"
              action={{
                label: 'Edit',
                onPress: () => router.push(`/explore/split-editor?id=${activeSplit.id}`),
              }}
            />
            <Text style={[styles.cardTitle, { color: theme.text }]}>{activeSplit.name}</Text>
            <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
              {activeSplit.days.length}-day split · {activeSplit.workoutsPerWeek}× / week
            </Text>
            <View style={[styles.cardActions, { marginTop: Spacing.one }]}>
              <SecondaryButton
                label="New Split"
                onPress={() => router.push('/explore/new-split')}
                fullWidth
              />
            </View>
          </Card>
        ) : (
          <Card>
            <SectionHeader title="Training Split" />
            <EmptyState
              title="No active split"
              description="Create a training split to see your plan here."
              symbol="calendar"
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
      </View>

      {/* ── LIBRARY ───────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="Library" />
        <SecondaryButton
          label="Browse Exercise Library"
          onPress={() => router.push('/explore/exercises')}
          fullWidth
        />
        <SecondaryButton
          label="Add Custom Exercise"
          onPress={() => router.push('/explore/new-exercise')}
          fullWidth
        />
      </View>

      {/* ── HISTORY ───────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader
          title="History"
          action={
            recentWorkouts.length > 3
              ? { label: 'View All', onPress: () => router.push('/explore/history') }
              : undefined
          }
        />

        {recentWorkouts.length === 0 ? (
          <EmptyState
            title="No workouts yet"
            description="Finish a workout to see it here."
            symbol="clock"
          />
        ) : (
          <>
            {displayedHistory.map(w => (
              <RecentWorkoutCard key={w.id} workout={w} />
            ))}
            {recentWorkouts.length > 3 && !expandHistory && (
              <SmallActionButton
                label="View All History"
                onPress={() => router.push('/explore/history')}
                variant="ghost"
              />
            )}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingTop: Spacing.five,
    alignItems: 'center',
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
    ...Typography.body,
  },
  errorText: {
    ...Typography.footnote,
  },
  section: {
    gap: Spacing.two,
  },
  cardLabel: {
    ...Typography.label,
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  cardSectionLabel: {
    ...Typography.label,
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  cardTitle: {
    ...Typography.headline,
    marginBottom: Spacing.one,
  },
  cardMeta: {
    ...Typography.footnote,
  },
  cardActions: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  upcomingDay: {
    ...Typography.footnote,
    width: 56,
  },
  upcomingMain: {
    flex: 1,
    gap: Spacing.half,
  },
  upcomingName: {
    ...Typography.subhead,
  },
  upcomingMuscles: {
    ...Typography.caption,
  },
});
