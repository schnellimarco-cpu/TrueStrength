export type MuscleGroup = {
  id: string;
  name: string;
  slug: string;
};

export type ExerciseCategory = {
  id: string;
  name: string;
  slug: string;
};

export type Exercise = {
  id: string;
  name: string;
  isCustom: boolean;
  category: ExerciseCategory | null;
  primaryMuscleGroup: MuscleGroup | null;
  secondaryMuscleGroups: MuscleGroup[];
};

export type CreateCustomExerciseInput = {
  name: string;
  categoryId: string;
  primaryMuscleGroupId: string;
  secondaryMuscleGroupIds?: string[];
};

export type UpdateCustomExerciseInput = Partial<CreateCustomExerciseInput>;

export type ExerciseFilters = {
  query?: string;
  muscleGroupId?: string;
  categoryId?: string;
};
