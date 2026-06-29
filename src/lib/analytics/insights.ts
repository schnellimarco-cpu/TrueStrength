import type { AnalyticsInsight, AnalyticsSnapshot } from '@/types/analytics';

export function generateInsights(metrics: AnalyticsSnapshot['metrics']): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  const { volume, consistency, recovery, bodyweight, personalRecords } = metrics;

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

  // Recovery: days since last workout
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

  // Bodyweight: trend
  if (bodyweight.trend30DayLabel !== null && bodyweight.trend30DayDeltaKg !== null) {
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

  // Personal records: has data
  if (personalRecords.topRecords.length > 0) {
    const top = personalRecords.topRecords[0];
    insights.push({
      id: 'pr-top-lift',
      category: 'personal_record',
      priority: 'low',
      title: 'Strongest lift on record',
      description: `Your top recorded lift is ${top.exerciseName} at ${top.maxWeightKg} kg.`,
      metricReference: 'personalRecords.topRecords',
    });
  }

  return insights;
}
