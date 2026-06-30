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
import type { BodyweightEntry } from '@/types/bodyweight';

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
  let totalSets = 0;
  let totalReps = 0;

  const muscleMap = new Map<string, { setCount: number; totalVolume: number }>();
  const exerciseMap = new Map<string, { totalVolume: number; setCount: number }>();

  for (const workout of workouts) {
    const completedAt = workout.completedAt ? new Date(workout.completedAt) : null;
    let workoutVolume = 0;

    for (const ex of workout.exercises) {
      const mg = ex.muscleGroup?.trim();
      const exName = ex.exerciseName?.trim();
      let exSets = 0;
      let exVolume = 0;

      for (const s of ex.sets) {
        if (!s.completed) continue;
        const v = s.weightKg * s.reps;
        workoutVolume += v;
        exSets++;
        exVolume += v;
        totalSets++;
        totalReps += s.reps;
      }

      if (mg && exSets > 0) {
        const existing = muscleMap.get(mg) ?? { setCount: 0, totalVolume: 0 };
        muscleMap.set(mg, {
          setCount: existing.setCount + exSets,
          totalVolume: existing.totalVolume + exVolume,
        });
      }

      if (exName && exSets > 0) {
        const existing = exerciseMap.get(exName) ?? { totalVolume: 0, setCount: 0 };
        exerciseMap.set(exName, {
          totalVolume: existing.totalVolume + exVolume,
          setCount: existing.setCount + exSets,
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

  const volumeByExercise = Array.from(exerciseMap.entries())
    .map(([exerciseName, s]) => ({ exerciseName, ...s }))
    .sort((a, b) => b.totalVolume - a.totalVolume);

  const n = workouts.length;

  return {
    totalVolume,
    currentWeekVolume,
    previousWeekVolume,
    currentMonthVolume,
    previousMonthVolume,
    volumeByMuscleGroup: entries,
    averageWorkoutVolume: n > 0 ? totalVolume / n : 0,
    averageSetsPerWorkout: n > 0 ? totalSets / n : 0,
    averageRepsPerWorkout: n > 0 ? totalReps / n : 0,
    volumeByExercise,
  };
}

// ─── Strength ─────────────────────────────────────────────────────────────────

function computeStrengthMetrics(workouts: AnalyticsRawWorkout[]): StrengthMetrics {
  const map = new Map<string, ExerciseBest>();
  let totalIntensity = 0;
  let intensitySets = 0;

  for (const workout of workouts) {
    const workoutDate = workout.completedAt?.slice(0, 10) ?? workout.date ?? null;

    for (const ex of workout.exercises) {
      const name = ex.exerciseName?.trim();
      if (!name) continue;

      const existing = map.get(name) ?? {
        exerciseName: name,
        maxWeightKg: 0,
        bestEstimated1RM: null,
        bestSetDate: null,
      };

      for (const s of ex.sets) {
        if (!s.completed) continue;
        totalIntensity += s.weightKg;
        intensitySets++;

        if (s.weightKg > existing.maxWeightKg) {
          existing.maxWeightKg = s.weightKg;
          existing.bestSetDate = workoutDate;
        }
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

  return {
    exerciseBests,
    averageIntensityKg: intensitySets > 0 ? totalIntensity / intensitySets : null,
  };
}

// ─── Bodyweight ───────────────────────────────────────────────────────────────

function buildWorkoutDateWeightMap(
  workouts: AnalyticsRawWorkout[],
  history: BodyweightEntry[]
): Record<string, number> {
  if (history.length === 0) return {};
  const dates = [
    ...new Set(
      workouts
        .map(w => w.completedAt?.slice(0, 10) ?? w.date)
        .filter((d): d is string => !!d)
    ),
  ];
  const result: Record<string, number> = {};
  for (const date of dates) {
    const t = new Date(date).getTime();
    let closest = history[0];
    let minDiff = Math.abs(new Date(closest.measuredAt).getTime() - t);
    for (const e of history) {
      const d = Math.abs(new Date(e.measuredAt).getTime() - t);
      if (d < minDiff) { minDiff = d; closest = e; }
    }
    result[date] = closest.weightKg;
  }
  return result;
}

function computeBodyweightMetrics(raw: AnalyticsRawData): BodyweightMetrics {
  const history = raw.bodyweightHistory;
  const currentEntry = history[0] ?? null;

  const averageBodyweightKg =
    history.length > 0
      ? history.reduce((sum, e) => sum + e.weightKg, 0) / history.length
      : null;

  const allTimeChangeKg =
    history.length >= 2 ? history[0].weightKg - history[history.length - 1].weightKg : null;

  if (history.length < 2) {
    return {
      currentEntry,
      trend30DayDeltaKg: null,
      trend30DayLabel: null,
      averageBodyweightKg,
      allTimeChangeKg,
      workoutDateWeightMap: buildWorkoutDateWeightMap(raw.workouts, history),
    };
  }

  const cutoff = Date.now() - 30 * 86400000;
  const recent = history.filter(e => new Date(e.measuredAt).getTime() >= cutoff);

  if (recent.length < 2) {
    return {
      currentEntry,
      trend30DayDeltaKg: null,
      trend30DayLabel: null,
      averageBodyweightKg,
      allTimeChangeKg,
      workoutDateWeightMap: buildWorkoutDateWeightMap(raw.workouts, history),
    };
  }

  const delta = recent[0].weightKg - recent[recent.length - 1].weightKg;
  const sign = delta >= 0 ? '▲ +' : '▼ ';
  return {
    currentEntry,
    trend30DayDeltaKg: delta,
    trend30DayLabel: `${sign}${Math.abs(delta).toFixed(1)} kg this month`,
    averageBodyweightKg,
    allTimeChangeKg,
    workoutDateWeightMap: buildWorkoutDateWeightMap(raw.workouts, history),
  };
}

// ─── Consistency ──────────────────────────────────────────────────────────────

function buildUniqueDatesDesc(workouts: AnalyticsRawWorkout[]): string[] {
  return [...new Set(
    workouts
      .map(w => w.date ?? w.completedAt?.slice(0, 10))
      .filter((d): d is string => !!d)
  )].sort().reverse();
}

function computeCurrentStreak(uniqueDatesDesc: string[]): number {
  if (uniqueDatesDesc.length === 0) return 0;

  const todayISO = new Date().toISOString().slice(0, 10);
  const yesterdayISO = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (uniqueDatesDesc[0] !== todayISO && uniqueDatesDesc[0] !== yesterdayISO) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDatesDesc.length; i++) {
    const curr = new Date(uniqueDatesDesc[i - 1]).getTime();
    const prev = new Date(uniqueDatesDesc[i]).getTime();
    if (Math.round((curr - prev) / 86400000) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function computeLongestStreak(uniqueDatesDesc: string[]): number {
  if (uniqueDatesDesc.length === 0) return 0;
  const asc = [...uniqueDatesDesc].reverse();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < asc.length; i++) {
    const gap = Math.round(
      (new Date(asc[i]).getTime() - new Date(asc[i - 1]).getTime()) / 86400000
    );
    if (gap === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
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

  const uniqueDatesDesc = buildUniqueDatesDesc(workouts);
  const totalCompletedWorkouts = workouts.length;

  const firstDate =
    uniqueDatesDesc.length > 0
      ? new Date(uniqueDatesDesc[uniqueDatesDesc.length - 1])
      : null;
  const weeksSpanned = firstDate
    ? Math.max(1, (Date.now() - firstDate.getTime()) / (7 * 86400000))
    : null;

  return {
    totalCompletedWorkouts,
    currentStreak: computeCurrentStreak(uniqueDatesDesc),
    longestStreak: computeLongestStreak(uniqueDatesDesc),
    actualWorkoutsThisWeek,
    actualWorkoutsLastWeek,
    plannedWorkoutsPerWeek: activeSplitWorkoutsPerWeek,
    latestWorkoutDate,
    averageWorkoutsPerWeek: weeksSpanned !== null ? totalCompletedWorkouts / weeksSpanned : null,
    completionRate:
      activeSplitWorkoutsPerWeek != null && activeSplitWorkoutsPerWeek > 0
        ? actualWorkoutsThisWeek / activeSplitWorkoutsPerWeek
        : null,
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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const recentPRCandidates = strength.exerciseBests.filter(
    ex => ex.bestSetDate !== null && ex.bestSetDate >= thirtyDaysAgo
  );
  return {
    topRecords: strength.exerciseBests.slice(0, 5),
    recentPRCandidates,
  };
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
