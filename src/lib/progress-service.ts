export { formatVolume, pctChange } from './analytics/utils';

import { computeAnalyticsSnapshot } from './analytics';
import type { ProgressOverview } from '@/types/progress';
import type { MuscleGroupProgress } from '@/types/progress';
import type { PersonalRecordPreview } from '@/types/progress';

export async function getProgressData(userId: string): Promise<{
  overview: ProgressOverview;
  muscleGroups: MuscleGroupProgress[];
  personalRecords: PersonalRecordPreview[];
}> {
  const snapshot = await computeAnalyticsSnapshot(userId);
  const { volume, consistency, personalRecords: pr } = snapshot.metrics;

  return {
    overview: {
      totalWorkouts: consistency.totalCompletedWorkouts,
      totalVolume: volume.totalVolume,
      currentWeekVolume: volume.currentWeekVolume,
      previousWeekVolume: volume.previousWeekVolume,
      currentMonthVolume: volume.currentMonthVolume,
      previousMonthVolume: volume.previousMonthVolume,
      latestWorkoutDate: consistency.latestWorkoutDate,
    },
    muscleGroups: volume.volumeByMuscleGroup.map(mg => ({
      muscleGroup: mg.muscleGroup,
      setCount: mg.setCount,
      totalVolume: mg.totalVolume,
      fraction: mg.fraction,
    })),
    personalRecords: pr.topRecords.map(r => ({
      exerciseName: r.exerciseName,
      maxWeightKg: r.maxWeightKg,
      bestEstimated1RM: r.bestEstimated1RM,
    })),
  };
}
