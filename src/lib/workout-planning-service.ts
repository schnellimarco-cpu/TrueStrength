import type { TrainingSplit } from '@/types/splits';
import type { CompletedWorkoutSummary } from '@/types/workout-history';
import type { CalendarDay, CalendarDayState, UpcomingWorkout } from '@/types/calendar';

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getMondayOfWeek(weekOffset: number): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon…
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mon = addDays(now, diffToMon + weekOffset * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

// Compute which weekday indices (0–6, Mon=0) are workout days for a given frequency.
// Distributes workouts as evenly as possible across the 7 days.
function workoutDayIndices(workoutsPerWeek: number): number[] {
  const indices: number[] = [];
  const step = 7 / workoutsPerWeek;
  for (let i = 0; i < workoutsPerWeek; i++) {
    indices.push(Math.round(i * step) % 7);
  }
  return [...new Set(indices)].sort((a, b) => a - b);
}

/**
 * Derive the next `count` upcoming workouts from an active split.
 * Uses `lastCompletedSplitDayId` to determine where in the split cycle we are.
 */
export function deriveUpcomingWorkouts(
  split: TrainingSplit,
  lastCompletedSplitDayId: string | null,
  count: number
): UpcomingWorkout[] {
  if (!split.days.length) return [];

  const today = isoDate(new Date());
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const lastIndex = lastCompletedSplitDayId
    ? split.days.findIndex(d => d.id === lastCompletedSplitDayId)
    : -1;
  let nextDayIndex = (lastIndex + 1) % split.days.length;

  const workoutIndices = workoutDayIndices(split.workoutsPerWeek);

  const results: UpcomingWorkout[] = [];
  let cursor = new Date(todayDate);
  let safetyLimit = 0;

  while (results.length < count && safetyLimit < 90) {
    safetyLimit++;
    const cursorDate = isoDate(cursor);

    // Mon=0 … Sun=6 mapping from JS (0=Sun)
    const jsDow = cursor.getDay(); // 0=Sun
    const monBasedDow = jsDow === 0 ? 6 : jsDow - 1; // Mon=0 … Sun=6

    if (workoutIndices.includes(monBasedDow)) {
      const day = split.days[nextDayIndex % split.days.length];
      results.push({
        date: cursorDate,
        splitDayId: day.id,
        splitDayName: day.name,
        muscleGroups: day.muscleGroups.map(mg => mg.name),
        isToday: cursorDate === today,
      });
      nextDayIndex = (nextDayIndex + 1) % split.days.length;
    }

    cursor = addDays(cursor, 1);
  }

  return results;
}

/**
 * Generate 7 CalendarDay entries for the week at `weekOffset` from current week.
 * weekOffset 0 = current Mon–Sun.
 */
export function generateCalendarDays(
  split: TrainingSplit | null,
  completedWorkouts: CompletedWorkoutSummary[],
  activeWorkoutDate: string | null,
  upcomingWorkouts: UpcomingWorkout[],
  weekOffset: number
): CalendarDay[] {
  const monday = getMondayOfWeek(weekOffset);
  const today = isoDate(new Date());

  const completedByDate = new Map<string, CompletedWorkoutSummary>();
  for (const w of completedWorkouts) {
    if (w.date && !completedByDate.has(w.date)) {
      completedByDate.set(w.date, w);
    }
  }

  const upcomingByDate = new Map<string, UpcomingWorkout>();
  for (const u of upcomingWorkouts) {
    upcomingByDate.set(u.date, u);
  }

  const days: CalendarDay[] = [];

  for (let i = 0; i < 7; i++) {
    const date = isoDate(addDays(monday, i));
    const completed = completedByDate.get(date);
    const upcoming = upcomingByDate.get(date);
    const isActive = date === activeWorkoutDate;
    const isToday = date === today;

    let state: CalendarDayState = 'rest';

    if (completed) {
      state = 'completed';
    } else if (isActive) {
      state = 'active';
    } else if (upcoming && isToday) {
      state = 'today';
    } else if (isToday && !upcoming) {
      state = 'today';
    } else if (upcoming) {
      state = 'planned';
    }

    days.push({
      date,
      state,
      splitDayId: upcoming?.splitDayId ?? completed?.splitDayId ?? undefined,
      splitDayName: upcoming?.splitDayName ?? undefined,
      muscleGroups: upcoming?.muscleGroups ?? [],
      workoutId: completed?.id ?? undefined,
      workoutTitle: completed?.title ?? undefined,
    });
  }

  return days;
}
