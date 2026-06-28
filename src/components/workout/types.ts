export type SetType = 'warmup' | 'working';

export type WorkoutSet = {
  id: string;
  type: SetType;
  weight: string;
  reps: string;
  completed: boolean;
};

export type WorkoutExercise = {
  id: string;
  exerciseId?: string | null;
  name: string;
  muscleGroup: string;
  previousBest: string;
  sets: WorkoutSet[];
};
