export type CompletedWorkoutSummary = {
  id: string;
  title: string;
  completedAt: string;
  date: string;
  durationSeconds: number | null;
  exerciseCount: number;
  setCount: number;
  totalVolume: number;
  splitId: string | null;
  splitDayId: string | null;
  splitDayName: string | null;
};

export type CompletedWorkoutSet = {
  id: string;
  setNumber: number;
  setType: 'warmup' | 'working' | 'failed';
  weightKg: number;
  reps: number;
  completed: boolean;
  estimatedOneRM: number | null;
  volume: number;
};

export type CompletedWorkoutExercise = {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  sets: CompletedWorkoutSet[];
};

export type CompletedWorkoutDetail = CompletedWorkoutSummary & {
  exercises: CompletedWorkoutExercise[];
};
