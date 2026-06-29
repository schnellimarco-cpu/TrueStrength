import { weekBounds, monthBounds } from './utils';
import type {
  AnalyticsRawData,
  AnalyticsRawWorkout,
  VolumeMetrics,
  StrengthMetrics,
  BodyweightMetrics,
  ConsistencyMetrics,
  RecoveryMetrics,
  PersonalRecordMetrics,
  ExerciseBest,
  MuscleGroupVolume,
  AnalyticsSnapshot,
} from '@/types/analytics';

// ─── Volume ───────────────────────────────────────────────────────────────────

function computeVolumeMetrics(workouts: AnalyticsRawWorkout[]): VolumeMetrics {
  const currWeek = weekBounds(0);
  const prevWeek = weekBounds(1);
  const currMonth = monthBounds(0);
  const prevMonth = monthBounds(1);

  let totalVolume = 0;
  let currentWeekVolume = 0;
  let previousWeekVolume = 0;
  let currentMonthVolume = 0;
  let previousMonthVolume = 0;

  const muscleMap = new Map<string, { setCount: number; totalVolume: number }>();

  for (const workout of workouts) {
    const completedAt = workout.completedAt ? new Date(workout.completedAt) : null;
    let workoutVolume = 0;

    for (const ex of workout.exercises) {
      const mg = ex.muscleGroup?.trim();
      let exSets = 0;
      let exVolume = 0;

      for (const s of ex.sets) {
        if (!s.completed) continue;
        const v = s.weightKg * s.reps;
        workoutVolume += v;
        exSets++;
        exVolume += v;
      }

      if (mg && exSets > 0) {
        const existing = muscleMap.get(mg) ?? { setCount: 0, totalVolume: 0 };
        muscleMap.set(mg, {
          setCount: existing.setCount + exSets,
          totalVolume: existing.totalVolume + exVolume,
        });
      }
    }

    totalVolume += workoutVolume;

    if (completedAt) {
      if (completedAt >= currWeek.start && completedAt <= currWeek.end) currentWeekVolume += workoutVolume;
      if (completedAt >= prevWeek.start && completedAt <= prevWeek.end) previousWeekVolume += workoutVolume;
      if (completedAt >= currMonth.start && completedAt <= currMonth.end) currentMonthVolume += workoutVolume;
      if (completedAt >= prevMonth.start && completedAt <= prevMonth.end) previousMonthVolume += workoutVolume;
    }
  }

  const entries: MuscleGroupVolume[] = Array.from(muscleMap.entries())
    .map(([muscleGroup, s]) => ({ muscleGroup, ...s, fraction: 0 }))
    .sort((a, b) => b.setCount - a.setCount)
    .slice(0, 8);

  const maxSets = entries[0]?.setCount ?? 1;
  entries.forEach(e => { e.fraction = e.setCount / maxSets; });

  return {
    totalVolume,
    currentWeekVolume,
    previousWeekVolume,
    currentMonthVolume,
    previousMonthVolume,
    volumeByMuscleGroup: entries,
  };
}

// ─── Strength ─────────────────────────────────────────────────────────────────

function computeStrengthMetrics(workouts: AnalyticsRawWorkout[]): StrengthMetrics {
  const map = new Map<string, ExerciseBest>();

  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      const name = ex.exerciseName?.trim();
      if (!name) continue;

      const existing = map.get(name) ?? { exerciseName: name, maxWeightKg: 0, bestEstimated1RM: null };

      for (const s of ex.sets) {
        if (!s.completed) continue;
        if (s.weightKg > existing.maxWeightKg) existing.maxWeightKg = s.weightKg;
        if (s.estimated1RM != null) {
          if (existing.bestEstimated1RM == null || s.estimated1RM > existing.bestEstimated1RM) {
            existing.bestEstimated1RM = s.estimated1RM;
          }
        }
      }

      map.set(name, existing);
    }
  }

  const exerciseBests = Array.from(map.values())
    .filter(e => e.maxWeightKg > 0)
    .sort((a, b) => b.maxWeightKg - a.maxWeightKg);

  return { exerciseBests };
}

// ─── Bodyweight ───────────────────────────────────────────────────────────────

function computeBodyweightMetrics(raw: AnalyticsRawData): BodyweightMetrics {
  const history = raw.bodyweightHistory;
  const currentEntry = history[0] ?? null;

  if (history.length < 2) {
    return { currentEntry, trend30DayDeltaKg: null, trend30DayLabel: null };
  }

  const cutoff = Date.now() - 30 * 86400000;
  const recent = history.filter(e => new Date(e.measuredAt).getTime() >= cutoff);

  if (recent.length < 2) {
    return { currentEntry, trend30DayDeltaKg: null, trend30DayLabel: null };
  }

  const delta = recent[0].weightKg - recent[recent.length - 1].weightKg;
  const sign = delta >= 0 ? '▲ +' : '▼ ';
  return {
    currentEntry,
    trend30DayDeltaKg: delta,
    trend30DayLabel: `${sign}${Math.abs(delta).toFixed(1)} kg this month`,
  };
}

// ─── Consistency ──────────────────────────────────────────────────────────────

function computeCurrentStreak(workouts: AnalyticsRawWorkout[]): number {
  if (workouts.length === 0) return 0;

  const uniqueDates = [...new Set(
    workouts
      .map(w => w.date ?? w.completedAt?.slice(0, 10))
      .filter((d): d is string => !!d)
  )].sort().reverse();

  if (uniqueDates.length === 0) return 0;

  const todayISO = new Date().toISOString().slice(0, 10);
  const yesterdayISO = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (uniqueDates[0] !== todayISO && uniqueDates[0] !== yesterdayISO) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const curr = new Date(uniqueDates[i - 1]).getTime();
    const prev = new Date(uniqueDates[i]).getTime();
    if (Math.round((curr - prev) / 86400000) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function computeConsistencyMetrics(raw: AnalyticsRawData): ConsistencyMetrics {
  const { workouts, activeSplitWorkoutsPerWeek } = raw;
  const currWeek = weekBounds(0);
  const prevWeek = weekBounds(1);

  let actualWorkoutsThisWeek = 0;
  let actualWorkoutsLastWeek = 0;
  let latestWorkoutDate: string | null = null;

  for (const w of workouts) {
    if (!w.completedAt) continue;
    const d = new Date(w.completedAt);
    if (d >= currWeek.start && d <= currWeek.end) actualWorkoutsThisWeek++;
    if (d >= prevWeek.start && d <= prevWeek.end) actualWorkoutsLastWeek++;
    if (!latestWorkoutDate || w.completedAt > latestWorkoutDate) {
      latestWorkoutDate = w.completedAt;
    }
  }

  return {
    totalCompletedWorkouts: workouts.length,
    currentStreak: computeCurrentStreak(workouts),
    actualWorkoutsThisWeek,
    actualWorkoutsLastWeek,
    plannedWorkoutsPerWeek: activeSplitWorkoutsPerWeek,
    latestWorkoutDate,
  };
}

// ─── Recovery ─────────────────────────────────────────────────────────────────

function computeRecoveryMetrics(workouts: AnalyticsRawWorkout[]): RecoveryMetrics {
  if (workouts.length === 0) {
    return { daysSinceLastWorkout: null, muscleGroupRecovery: [] };
  }

  const lastWorkoutDate = workouts[0].completedAt;
  const daysSinceLastWorkout = lastWorkoutDate
    ? Math.floor((Date.now() - new Date(lastWorkoutDate).getTime()) / 86400000)
    : null;

  const mgLastDate = new Map<string, string>();

  for (const workout of workouts) {
    if (!workout.completedAt) continue;
    const dateStr = workout.completedAt.slice(0, 10);
    for (const ex of workout.exercises) {
      const mg = ex.muscleGroup?.trim();
      if (!mg) continue;
      const existing = mgLastDate.get(mg);
      if (!existing || dateStr > existing) mgLastDate.set(mg, dateStr);
    }
  }

  const muscleGroupRecovery = Array.from(mgLastDate.entries())
    .map(([muscleGroup, dateStr]) => ({
      muscleGroup,
      daysSinceLastTrained: Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000),
    }))
    .sort((a, b) => b.daysSinceLastTrained - a.daysSinceLastTrained);

  return { daysSinceLastWorkout, muscleGroupRecovery };
}

// ─── Personal Records ─────────────────────────────────────────────────────────

function computePersonalRecordMetrics(strength: StrengthMetrics): PersonalRecordMetrics {
  return { topRecords: strength.exerciseBests.slice(0, 5) };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function computeAllMetrics(raw: AnalyticsRawData): AnalyticsSnapshot['metrics'] {
  const volume = computeVolumeMetrics(raw.workouts);
  const strength = computeStrengthMetrics(raw.workouts);
  const bodyweight = computeBodyweightMetrics(raw);
  const consistency = computeConsistencyMetrics(raw);
  const recovery = computeRecoveryMetrics(raw.workouts);
  const personalRecords = computePersonalRecordMetrics(strength);

  return { volume, strength, bodyweight, consistency, recovery, personalRecords };
}
