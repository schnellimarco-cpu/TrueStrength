import { fetchAnalyticsRawData } from './raw-data';
import { computeAllMetrics } from './metrics';
import { generateInsights, generateStrengthScoreInsights } from './insights';
import { computeStrengthScoreSnapshot } from './strength-score';
import type { AnalyticsSnapshot, RawDataSummary } from '@/types/analytics';

export async function computeAnalyticsSnapshot(userId: string): Promise<AnalyticsSnapshot> {
  const rawData = await fetchAnalyticsRawData(userId);
  const metrics = computeAllMetrics(rawData);

  const generatedAt = new Date().toISOString();

  const strengthScore = computeStrengthScoreSnapshot(
    metrics.strength,
    metrics.bodyweight,
    generatedAt
  );

  const insights = [
    ...generateInsights(metrics),
    ...generateStrengthScoreInsights(strengthScore),
  ];

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
    generatedAt,
    rawSummary,
    metrics,
    insights,
    strengthScore,
  };
}

export { formatVolume, pctChange } from './utils';
export { getTopCoachInsights, getWeeklyAnalyticsSummary } from './selectors';
export type { AnalyticsSnapshot } from '@/types/analytics';
export type { StrengthScoreSnapshot } from '@/types/strength-score';
