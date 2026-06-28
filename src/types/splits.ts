import type { MuscleGroup, Exercise } from './exercises';

export type SplitType = 'push_pull_legs' | 'upper_lower' | 'full_body' | 'custom';

export type SplitDayExercise = {
  id: string;
  splitDayId: string;
  exerciseId: string;
  exercise: Exercise | null;
  exerciseOrder: number;
  defaultSets: number;
  defaultReps: number;
};

export type SplitDay = {
  id: string;
  splitId: string;
  name: string;
  dayOrder: number;
  estimatedDurationMinutes: number | null;
  muscleGroups: MuscleGroup[];
  exercises: SplitDayExercise[];
};

export type TrainingSplit = {
  id: string;
  userId: string;
  name: string;
  type: SplitType;
  workoutsPerWeek: number;
  isActive: boolean;
  days: SplitDay[];
  createdAt: string;
  updatedAt: string;
};

export type CreateSplitInput = {
  name: string;
  type: SplitType;
  workoutsPerWeek: number;
};
