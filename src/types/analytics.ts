import type { BodyweightEntry } from './bodyweight';
import type { StrengthScoreSnapshot } from './strength-score';

// ─── Layer 1: Raw Data ────────────────────────────────────────────────────────

export type AnalyticsRawSet = {
  weightKg: number;
  reps: number;
  completed: boolean;
  estimated1RM: number | null;
  setType: 'warmup' | 'working' | 'failed';
};

export type AnalyticsRawExercise = {
  exerciseName: string;
  muscleGroup: string | null;
  sets: AnalyticsRawSet[];
};

export type AnalyticsRawWorkout = {
  id: string;
  date: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
  splitId: string | null;
  splitDayId: string | null;
  exercises: AnalyticsRawExercise[];
};

export type AnalyticsRawData = {
  workouts: AnalyticsRawWorkout[];
  bodyweightHistory: BodyweightEntry[];
  activeSplitWorkoutsPerWeek: number | null;
};

// ─── Layer 2: Metrics ─────────────────────────────────────────────────────────

export type MuscleGroupVolume = {
  muscleGroup: string;
  setCount: number;
  totalVolume: number;
  fraction: number; // 0–1, relative to most-trained group
};

export type ExerciseBest = {
  exerciseName: string;
  maxWeightKg: number;
  bestEstimated1RM: number | null;
  bestSetDate: string | null; // YYYY-MM-DD when maxWeightKg was set
};

export type VolumeMetrics = {
  totalVolume: number;
  currentWeekVolume: number;
  previousWeekVolume: number;
  currentMonthVolume: number;
  previousMonthVolume: number;
  volumeByMuscleGroup: MuscleGroupVolume[];
  averageWorkoutVolume: number;
  averageSetsPerWorkout: number;
  averageRepsPerWorkout: number;
  volumeByExercise: Array<{ exerciseName: string; totalVolume: number; setCount: number }>;
};

export type StrengthMetrics = {
  exerciseBests: ExerciseBest[]; // all exercises, sorted by maxWeightKg desc
  averageIntensityKg: number | null; // mean weight across all completed sets; null if none
};

export type BodyweightMetrics = {
  currentEntry: BodyweightEntry | null;
  trend30DayDeltaKg: number | null;
  trend30DayLabel: string | null;
  averageBodyweightKg: number | null;
  allTimeChangeKg: number | null; // most recent minus oldest; null if < 2 entries
  workoutDateWeightMap: Record<string, number>; // YYYY-MM-DD → closest bodyweight kg
};

export type ConsistencyMetrics = {
  totalCompletedWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  actualWorkoutsThisWeek: number;
  actualWorkoutsLastWeek: number;
  plannedWorkoutsPerWeek: number | null;
  latestWorkoutDate: string | null;
  averageWorkoutsPerWeek: number | null; // totalWorkouts / weeks since first; null if no workouts
  completionRate: number | null; // actualWorkoutsThisWeek / plannedWorkoutsPerWeek; null if no split
};

export type RecoveryMetrics = {
  daysSinceLastWorkout: number | null;
  muscleGroupRecovery: Array<{ muscleGroup: string; daysSinceLastTrained: number }>;
};

export type PersonalRecordMetrics = {
  topRecords: ExerciseBest[]; // top 5 by maxWeightKg
  recentPRCandidates: ExerciseBest[]; // bestSetDate within last 30 days
};

// ─── Layer 3: Insights ────────────────────────────────────────────────────────

export type InsightPriority = 'high' | 'medium' | 'low';

export type InsightCategory =
  | 'strength'
  | 'volume'
  | 'recovery'
  | 'consistency'
  | 'bodyweight'
  | 'personal_record';

export type AnalyticsInsight = {
  id: string;
  category: InsightCategory;
  priority: InsightPriority;
  title: string;
  description: string;
  metricReference?: string;
};

// ─── Raw Data Summary ─────────────────────────────────────────────────────────

export type RawDataSummary = {
  workoutCount: number;
  uniqueExerciseCount: number;
  totalSets: number;
  bodyweightEntryCount: number;
  hasActiveSplit: boolean;
};

// ─── Analytics Snapshot ───────────────────────────────────────────────────────

export type AnalyticsSnapshot = {
  generatedAt: string;
  rawSummary: RawDataSummary;
  metrics: {
    volume: VolumeMetrics;
    strength: StrengthMetrics;
    bodyweight: BodyweightMetrics;
    consistency: ConsistencyMetrics;
    recovery: RecoveryMetrics;
    personalRecords: PersonalRecordMetrics;
  };
  insights: AnalyticsInsight[];
  strengthScore: StrengthScoreSnapshot;
};

// ─── Selectors ────────────────────────────────────────────────────────────────

export type WeeklyAnalyticsSummary = {
  weekOf: string; // ISO date of current Monday
  workoutsCompleted: number;
  workoutsPlanned: number | null;
  volumeKg: number;
  volumeChangePercent: number | null;
  topMuscleGroups: string[];
  topInsight: AnalyticsInsight | null;
};
