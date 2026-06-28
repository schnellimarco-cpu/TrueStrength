import { useMemo, useState } from 'react';
import { useActiveSplit } from '@/hooks/use-active-split';
import { useWorkoutHistory } from '@/hooks/use-workout-history';
import {
  deriveUpcomingWorkouts,
  generateCalendarDays,
  isoDate,
} from '@/lib/workout-planning-service';
import type { CalendarDay, UpcomingWorkout } from '@/types/calendar';

export function useWorkoutPlanning(activeWorkoutDate: string | null) {
  const { activeSplit, refresh: refreshActiveSplit } = useActiveSplit();
  const { recentWorkouts } = useWorkoutHistory();
  const [weekOffset, setWeekOffset] = useState(0);

  const lastSplitDayId = useMemo(() => {
    if (!activeSplit) return null;
    const match = recentWorkouts.find(w => w.splitId === activeSplit.id && w.splitDayId);
    return match?.splitDayId ?? null;
  }, [recentWorkouts, activeSplit]);

  const upcomingWorkouts = useMemo((): UpcomingWorkout[] => {
    if (!activeSplit) return [];
    return deriveUpcomingWorkouts(activeSplit, lastSplitDayId, 7);
  }, [activeSplit, lastSplitDayId]);

  const calendarDays = useMemo((): CalendarDay[] => {
    return generateCalendarDays(
      activeSplit ?? null,
      recentWorkouts,
      activeWorkoutDate,
      upcomingWorkouts,
      weekOffset
    );
  }, [activeSplit, recentWorkouts, activeWorkoutDate, upcomingWorkouts, weekOffset]);

  const todayIso = isoDate(new Date());
  const todayWorkout = upcomingWorkouts.find(w => w.date === todayIso) ?? null;

  return {
    upcomingWorkouts,
    calendarDays,
    todayWorkout,
    weekOffset,
    setWeekOffset,
    activeSplit: activeSplit ?? null,
    refresh: refreshActiveSplit,
  };
}
