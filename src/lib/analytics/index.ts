import { fetchAnalyticsRawData } from './raw-data';
import { computeAllMetrics } from './metrics';
import { generateInsights } from './insights';
import type { AnalyticsSnapshot } from '@/types/analytics';

export async function computeAnalyticsSnapshot(userId: string): Promise<AnalyticsSnapshot> {
  const rawData = await fetchAnalyticsRawData(userId);
  const metrics = computeAllMetrics(rawData);
  const insights = generateInsights(metrics);
  return {
    generatedAt: new Date().toISOString(),
    metrics,
    insights,
  };
}

export { formatVolume, pctChange } from './utils';
export { getTopCoachInsights, getWeeklyAnalyticsSummary } from './selectors';
export type { AnalyticsSnapshot } from '@/types/analytics';
