import { currentMondayISO } from './utils';
import type { AnalyticsInsight, AnalyticsSnapshot, WeeklyAnalyticsSummary } from '@/types/analytics';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function getTopCoachInsights(
  snapshot: AnalyticsSnapshot,
  limit = 3
): AnalyticsInsight[] {
  return [...snapshot.insights]
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99))
    .slice(0, limit);
}

export function getWeeklyAnalyticsSummary(snapshot: AnalyticsSnapshot): WeeklyAnalyticsSummary {
  const { volume, consistency } = snapshot.metrics;

  const volumeChangePercent =
    volume.previousWeekVolume > 0
      ? ((volume.currentWeekVolume - volume.previousWeekVolume) / volume.previousWeekVolume) * 100
      : null;

  const topMuscleGroups = volume.volumeByMuscleGroup
    .slice(0, 3)
    .map(mg => mg.muscleGroup);

  return {
    weekOf: currentMondayISO(),
    workoutsCompleted: consistency.actualWorkoutsThisWeek,
    workoutsPlanned: consistency.plannedWorkoutsPerWeek,
    volumeKg: volume.currentWeekVolume,
    volumeChangePercent: volumeChangePercent !== null ? Math.round(volumeChangePercent) : null,
    topMuscleGroups,
    topInsight: getTopCoachInsights(snapshot, 1)[0] ?? null,
  };
}
