import { fetchAnalyticsRawData } from './raw-data';
import { computeAllMetrics } from './metrics';
import { generateInsights } from './insights';
import type { AnalyticsSnapshot, RawDataSummary } from '@/types/analytics';

export async function computeAnalyticsSnapshot(userId: string): Promise<AnalyticsSnapshot> {
  const rawData = await fetchAnalyticsRawData(userId);
  const metrics = computeAllMetrics(rawData);
  const insights = generateInsights(metrics);

  const uniqueExerciseNames = new Set(
    rawData.workouts.flatMap(w => w.exercises.map(e => e.exerciseName))
  );
  const totalSets = rawData.workouts
    .flatMap(w => w.exercises.flatMap(e => e.sets))
    .filter(s => s.completed).length;

  const rawSummary: RawDataSummary = {
    workoutCount: rawData.workouts.length,
    uniqueExerciseCount: uniqueExerciseNames.size,
    totalSets,
    bodyweightEntryCount: rawData.bodyweightHistory.length,
    hasActiveSplit: rawData.activeSplitWorkoutsPerWeek !== null,
  };

  return {
    generatedAt: new Date().toISOString(),
    rawSummary,
    metrics,
    insights,
  };
}

export { formatVolume, pctChange } from './utils';
export { getTopCoachInsights, getWeeklyAnalyticsSummary } from './selectors';
export type { AnalyticsSnapshot } from '@/types/analytics';
