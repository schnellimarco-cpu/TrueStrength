export type ProgressOverview = {
  totalWorkouts: number;
  totalVolume: number;
  currentWeekVolume: number;
  previousWeekVolume: number;
  currentMonthVolume: number;
  previousMonthVolume: number;
  latestWorkoutDate: string | null;
};

export type MuscleGroupProgress = {
  muscleGroup: string;
  setCount: number;
  totalVolume: number;
  fraction: number;
};

export type PersonalRecordPreview = {
  exerciseName: string;
  maxWeightKg: number;
  bestEstimated1RM: number | null;
};
