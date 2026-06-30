import { currentMondayISO } from './utils';
import type { AnalyticsInsight, AnalyticsSnapshot, WeeklyAnalyticsSummary } from '@/types/analytics';
import type { CoachRecommendation } from '@/types/coach';

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function getTopCoachInsights(
  snapshot: AnalyticsSnapshot,
  limit = 3
): AnalyticsInsight[] {
  return [...snapshot.insights]
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99))
    .slice(0, limit);
}

const INSIGHT_ACTIONS: Record<string, { actionLabel: string; actionRoute: string }> = {
  'strength-score-missing-bw': { actionLabel: 'Add Weight',    actionRoute: '/profile/update-weight' },
  'recovery-long-break':       { actionLabel: 'Start Workout', actionRoute: '/explore' },
  'pr-recent':                 { actionLabel: 'View Progress', actionRoute: '/progress' },
};

export function getCoachRecommendations(snapshot: AnalyticsSnapshot): CoachRecommendation[] {
  const { consistency, bodyweight } = snapshot.metrics;

  if (consistency.totalCompletedWorkouts === 0) {
    return [{
      id: 'fallback-no-workouts',
      priority: 'high',
      category: 'consistency',
      title: 'Start your first workout',
      message: 'Log your first session to get personalised coaching insights.',
      actionLabel: 'Start Workout',
      actionRoute: '/explore',
    }];
  }

  const top = getTopCoachInsights(snapshot, 3);
  const seen = new Set<string>();
  const recs: CoachRecommendation[] = [];

  for (const ins of top) {
    if (seen.has(ins.category)) continue;
    seen.add(ins.category);
    const action = INSIGHT_ACTIONS[ins.id];
    recs.push({
      id: ins.id,
      priority: ins.priority,
      category: ins.category as CoachRecommendation['category'],
      title: ins.title,
      message: ins.description,
      ...action,
    });
  }

  if (recs.length === 0) {
    if (!bodyweight.currentEntry) {
      return [{
        id: 'fallback-no-bw',
        priority: 'medium',
        category: 'bodyweight',
        title: 'Add your bodyweight',
        message: 'Unlock your Strength Score and relative-strength analysis.',
        actionLabel: 'Add Weight',
        actionRoute: '/profile/update-weight',
      }];
    }
    return [{
      id: 'fallback-keep-going',
      priority: 'low',
      category: 'consistency',
      title: 'Keep training consistently',
      message: "You're on the right track. More data will unlock deeper insights.",
    }];
  }

  return recs;
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
