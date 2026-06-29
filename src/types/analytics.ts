import type { BodyweightEntry } from './bodyweight';

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
};

export type VolumeMetrics = {
  totalVolume: number;
  currentWeekVolume: number;
  previousWeekVolume: number;
  currentMonthVolume: number;
  previousMonthVolume: number;
  volumeByMuscleGroup: MuscleGroupVolume[];
};

export type StrengthMetrics = {
  exerciseBests: ExerciseBest[]; // all exercises, sorted by maxWeightKg desc
};

export type BodyweightMetrics = {
  currentEntry: BodyweightEntry | null;
  trend30DayDeltaKg: number | null;
  trend30DayLabel: string | null;
};

export type ConsistencyMetrics = {
  totalCompletedWorkouts: number;
  currentStreak: number;
  actualWorkoutsThisWeek: number;
  actualWorkoutsLastWeek: number;
  plannedWorkoutsPerWeek: number | null;
  latestWorkoutDate: string | null;
};

export type RecoveryMetrics = {
  daysSinceLastWorkout: number | null;
  muscleGroupRecovery: Array<{ muscleGroup: string; daysSinceLastTrained: number }>;
};

export type PersonalRecordMetrics = {
  topRecords: ExerciseBest[]; // top 5 by maxWeightKg
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

// ─── Analytics Snapshot ───────────────────────────────────────────────────────

export type AnalyticsSnapshot = {
  generatedAt: string;
  metrics: {
    volume: VolumeMetrics;
    strength: StrengthMetrics;
    bodyweight: BodyweightMetrics;
    consistency: ConsistencyMetrics;
    recovery: RecoveryMetrics;
    personalRecords: PersonalRecordMetrics;
  };
  insights: AnalyticsInsight[];
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
