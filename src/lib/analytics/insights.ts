import type { AnalyticsInsight, AnalyticsSnapshot } from '@/types/analytics';

export function generateInsights(metrics: AnalyticsSnapshot['metrics']): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  const { volume, consistency, recovery, bodyweight, personalRecords } = metrics;

  // Personal records: recent PRs (high priority — most actionable)
  if (personalRecords.recentPRCandidates.length > 0) {
    const top = personalRecords.recentPRCandidates[0];
    insights.push({
      id: 'pr-recent',
      category: 'personal_record',
      priority: 'high',
      title: personalRecords.recentPRCandidates.length === 1
        ? 'New personal record'
        : `${personalRecords.recentPRCandidates.length} new personal records`,
      description: `${top.exerciseName}: ${top.maxWeightKg} kg${top.bestEstimated1RM != null ? ` (est. 1RM ~${Math.round(top.bestEstimated1RM)} kg)` : ''}.`,
      metricReference: 'personalRecords.recentPRCandidates',
    });
  }

  // Recovery: days since last workout (high priority)
  if (recovery.daysSinceLastWorkout !== null && recovery.daysSinceLastWorkout > 5) {
    insights.push({
      id: 'recovery-long-break',
      category: 'recovery',
      priority: 'high',
      title: 'Extended rest period',
      description: `It has been ${recovery.daysSinceLastWorkout} days since your last workout.`,
      metricReference: 'recovery.daysSinceLastWorkout',
    });
  }

  // Volume: week-over-week
  if (volume.previousWeekVolume > 0) {
    const pct = ((volume.currentWeekVolume - volume.previousWeekVolume) / volume.previousWeekVolume) * 100;
    if (pct > 10) {
      insights.push({
        id: 'volume-week-up',
        category: 'volume',
        priority: 'medium',
        title: 'Volume increased this week',
        description: `Your weekly training volume is up ${pct.toFixed(0)}% vs last week.`,
        metricReference: 'volume.currentWeekVolume',
      });
    } else if (pct < -20) {
      insights.push({
        id: 'volume-week-down',
        category: 'volume',
        priority: 'medium',
        title: 'Volume dropped this week',
        description: `Your weekly training volume is down ${Math.abs(pct).toFixed(0)}% vs last week.`,
        metricReference: 'volume.currentWeekVolume',
      });
    }
  }

  // Consistency: streak
  if (consistency.currentStreak >= 5) {
    insights.push({
      id: 'consistency-streak',
      category: 'consistency',
      priority: 'medium',
      title: `${consistency.currentStreak}-day training streak`,
      description: `You have trained ${consistency.currentStreak} days in a row. Keep it up.`,
      metricReference: 'consistency.currentStreak',
    });
  }

  // Consistency: improving week-over-week
  if (
    consistency.actualWorkoutsThisWeek > consistency.actualWorkoutsLastWeek &&
    consistency.actualWorkoutsLastWeek > 0
  ) {
    insights.push({
      id: 'consistency-improving',
      category: 'consistency',
      priority: 'medium',
      title: 'Consistency improving',
      description: `${consistency.actualWorkoutsThisWeek} workouts this week vs ${consistency.actualWorkoutsLastWeek} last week.`,
      metricReference: 'consistency.actualWorkoutsThisWeek',
    });
  }

  // Recovery: muscle groups overdue
  const overdueGroups = recovery.muscleGroupRecovery.filter(r => r.daysSinceLastTrained > 7);
  if (overdueGroups.length > 0) {
    const names = overdueGroups.slice(0, 2).map(r => r.muscleGroup).join(', ');
    insights.push({
      id: 'recovery-muscle-overdue',
      category: 'recovery',
      priority: 'low',
      title: 'Muscle groups overdue for training',
      description: `${names} ${overdueGroups.length > 1 ? 'have' : 'has'} not been trained in over 7 days.`,
      metricReference: 'recovery.muscleGroupRecovery',
    });
  }

  // Bodyweight: trending (only when change >= 0.5 kg)
  if (
    bodyweight.trend30DayLabel !== null &&
    bodyweight.trend30DayDeltaKg !== null &&
    Math.abs(bodyweight.trend30DayDeltaKg) >= 0.5
  ) {
    const gaining = bodyweight.trend30DayDeltaKg > 0;
    insights.push({
      id: 'bodyweight-trend',
      category: 'bodyweight',
      priority: 'low',
      title: gaining ? 'Bodyweight trending up' : 'Bodyweight trending down',
      description: `${bodyweight.trend30DayLabel}.`,
      metricReference: 'bodyweight.trend30DayLabel',
    });
  }

  // Bodyweight: stable (when change < 0.5 kg)
  if (
    bodyweight.trend30DayDeltaKg !== null &&
    Math.abs(bodyweight.trend30DayDeltaKg) < 0.5
  ) {
    insights.push({
      id: 'bodyweight-stable',
      category: 'bodyweight',
      priority: 'low',
      title: 'Bodyweight stable',
      description: 'Your bodyweight has remained stable over the past 30 days.',
      metricReference: 'bodyweight.trend30DayDeltaKg',
    });
  }

  return insights;
}
