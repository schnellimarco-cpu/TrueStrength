import { supabase } from './supabase';
import type {
  MuscleGroupProgress,
  PersonalRecordPreview,
  ProgressOverview,
} from '@/types/progress';

// --- Date utilities ---

function weekBounds(weeksAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 6=Sat
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function monthBounds(monthsAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// --- Formatting helpers (exported for screen) ---

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return kg.toFixed(0);
}

export function pctChange(
  current: number,
  prev: number
): { delta: string; positive: boolean } | null {
  if (prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? '+' : '';
  return { delta: `${sign}${pct.toFixed(0)}%`, positive: pct >= 0 };
}

// --- Raw DB row types ---

type RawSetEntry = {
  weight_kg: number;
  reps: number;
  completed: boolean;
  estimated_1rm: number | null;
};

type RawWorkoutExercise = {
  exercise_name: string;
  muscle_group: string | null;
  set_entries: RawSetEntry[];
};

type RawWorkout = {
  id: string;
  date: string | null;
  completed_at: string | null;
  workout_exercises: RawWorkoutExercise[];
};

// --- Internal query (one round-trip for all metrics) ---

async function fetchWorkoutData(userId: string): Promise<RawWorkout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id, date, completed_at,
      workout_exercises(
        exercise_name, muscle_group,
        set_entries(weight_kg, reps, completed, estimated_1rm)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .is('deleted_at', null)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as RawWorkout[];
}

// --- Computation helpers ---

function computeOverview(rows: RawWorkout[]): ProgressOverview {
  const currWeek = weekBounds(0);
  const prevWeek = weekBounds(1);
  const currMonth = monthBounds(0);
  const prevMonth = monthBounds(1);

  let totalVolume = 0;
  let currentWeekVolume = 0;
  let previousWeekVolume = 0;
  let currentMonthVolume = 0;
  let previousMonthVolume = 0;
  const latestWorkoutDate = rows[0]?.completed_at ?? null;

  for (const workout of rows) {
    const completedAt = workout.completed_at ? new Date(workout.completed_at) : null;

    let workoutVolume = 0;
    for (const ex of workout.workout_exercises ?? []) {
      for (const s of ex.set_entries ?? []) {
        if (s.completed) {
          workoutVolume += (s.weight_kg ?? 0) * (s.reps ?? 0);
        }
      }
    }

    totalVolume += workoutVolume;

    if (completedAt) {
      if (completedAt >= currWeek.start && completedAt <= currWeek.end) {
        currentWeekVolume += workoutVolume;
      }
      if (completedAt >= prevWeek.start && completedAt <= prevWeek.end) {
        previousWeekVolume += workoutVolume;
      }
      if (completedAt >= currMonth.start && completedAt <= currMonth.end) {
        currentMonthVolume += workoutVolume;
      }
      if (completedAt >= prevMonth.start && completedAt <= prevMonth.end) {
        previousMonthVolume += workoutVolume;
      }
    }
  }

  return {
    totalWorkouts: rows.length,
    totalVolume,
    currentWeekVolume,
    previousWeekVolume,
    currentMonthVolume,
    previousMonthVolume,
    latestWorkoutDate,
  };
}

function computeMuscleGroups(rows: RawWorkout[]): MuscleGroupProgress[] {
  const map = new Map<string, { setCount: number; totalVolume: number }>();

  for (const workout of rows) {
    for (const ex of workout.workout_exercises ?? []) {
      const mg = ex.muscle_group?.trim();
      if (!mg) continue;

      const existing = map.get(mg) ?? { setCount: 0, totalVolume: 0 };
      let exVolume = 0;
      let exSets = 0;

      for (const s of ex.set_entries ?? []) {
        if (s.completed) {
          exSets++;
          exVolume += (s.weight_kg ?? 0) * (s.reps ?? 0);
        }
      }

      map.set(mg, {
        setCount: existing.setCount + exSets,
        totalVolume: existing.totalVolume + exVolume,
      });
    }
  }

  const entries = Array.from(map.entries())
    .map(([muscleGroup, stats]) => ({ muscleGroup, ...stats }))
    .sort((a, b) => b.setCount - a.setCount)
    .slice(0, 8);

  const maxSets = entries[0]?.setCount ?? 1;

  return entries.map(e => ({
    ...e,
    fraction: e.setCount / maxSets,
  }));
}

function computePersonalRecords(rows: RawWorkout[], limit: number): PersonalRecordPreview[] {
  const map = new Map<string, { maxWeightKg: number; bestEstimated1RM: number | null }>();

  for (const workout of rows) {
    for (const ex of workout.workout_exercises ?? []) {
      const name = ex.exercise_name?.trim();
      if (!name) continue;

      const existing = map.get(name) ?? { maxWeightKg: 0, bestEstimated1RM: null };

      for (const s of ex.set_entries ?? []) {
        if (!s.completed) continue;

        const weight = s.weight_kg ?? 0;
        if (weight > existing.maxWeightKg) {
          existing.maxWeightKg = weight;
        }

        if (s.estimated_1rm != null) {
          if (existing.bestEstimated1RM == null || s.estimated_1rm > existing.bestEstimated1RM) {
            existing.bestEstimated1RM = s.estimated_1rm;
          }
        }
      }

      map.set(name, existing);
    }
  }

  return Array.from(map.entries())
    .map(([exerciseName, stats]) => ({ exerciseName, ...stats }))
    .filter(pr => pr.maxWeightKg > 0)
    .sort((a, b) => b.maxWeightKg - a.maxWeightKg)
    .slice(0, limit);
}

// --- Public API ---

export async function getProgressData(userId: string): Promise<{
  overview: ProgressOverview;
  muscleGroups: MuscleGroupProgress[];
  personalRecords: PersonalRecordPreview[];
}> {
  const rows = await fetchWorkoutData(userId);
  return {
    overview: computeOverview(rows),
    muscleGroups: computeMuscleGroups(rows),
    personalRecords: computePersonalRecords(rows, 5),
  };
}
