import { supabase } from './supabase';
import type {
  Exercise,
  ExerciseCategory,
  ExerciseFilters,
  MuscleGroup,
  CreateCustomExerciseInput,
  UpdateCustomExerciseInput,
} from '@/types/exercises';

// ─── Raw DB shapes returned by PostgREST join queries ──────────

type RawMGRow = {
  role: 'primary' | 'secondary';
  muscle_group: MuscleGroup | null;
};

type RawExercise = {
  id: string;
  name: string;
  is_custom: boolean;
  user_id: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category: ExerciseCategory | null;
  exercise_muscle_groups: RawMGRow[];
};

// ─── Transform raw DB row → UI Exercise ────────────────────────

function toExercise(raw: RawExercise): Exercise {
  return {
    id: raw.id,
    name: raw.name,
    isCustom: raw.is_custom,
    category: raw.category ?? null,
    primaryMuscleGroup:
      raw.exercise_muscle_groups.find(r => r.role === 'primary')?.muscle_group ?? null,
    secondaryMuscleGroups: raw.exercise_muscle_groups
      .filter(r => r.role === 'secondary')
      .map(r => r.muscle_group)
      .filter((mg): mg is MuscleGroup => mg !== null),
  };
}

// ─── Select strings ────────────────────────────────────────────

const BASE_SELECT =
  '*, category:exercise_categories(id,name,slug), exercise_muscle_groups(role, muscle_group:muscle_groups(id,name,slug))';

// !inner forces an INNER JOIN so only exercises with the matching
// muscle group row are returned when filtering by muscleGroupId.
const INNER_SELECT =
  '*, category:exercise_categories(id,name,slug), exercise_muscle_groups!inner(role, muscle_group:muscle_groups(id,name,slug))';

// ─── Public API ────────────────────────────────────────────────

export async function getExercises(
  userId: string,
  filters?: ExerciseFilters
): Promise<Exercise[]> {
  const sel = filters?.muscleGroupId ? INNER_SELECT : BASE_SELECT;

  let q = supabase
    .from('exercises')
    .select(sel)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('name');

  if (filters?.query) {
    q = q.ilike('name', `%${filters.query}%`);
  }
  if (filters?.muscleGroupId) {
    q = q.eq('exercise_muscle_groups.muscle_group_id', filters.muscleGroupId);
  }
  if (filters?.categoryId) {
    q = q.eq('category_id', filters.categoryId);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data as RawExercise[]).map(toExercise);
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select(BASE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? toExercise(data as RawExercise) : null;
}

export async function getMuscleGroups(): Promise<MuscleGroup[]> {
  const { data, error } = await supabase
    .from('muscle_groups')
    .select('id,name,slug')
    .order('name');

  if (error) throw error;
  return data as MuscleGroup[];
}

export async function getExerciseCategories(): Promise<ExerciseCategory[]> {
  const { data, error } = await supabase
    .from('exercise_categories')
    .select('id,name,slug')
    .order('name');

  if (error) throw error;
  return data as ExerciseCategory[];
}

export async function createCustomExercise(
  userId: string,
  input: CreateCustomExerciseInput
): Promise<Exercise> {
  const { data: raw, error: e1 } = await supabase
    .from('exercises')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      category_id: input.categoryId,
      is_custom: true,
    })
    .select(BASE_SELECT)
    .single();

  if (e1) throw e1;
  const exerciseId = (raw as RawExercise).id;

  const rows = [
    { exercise_id: exerciseId, muscle_group_id: input.primaryMuscleGroupId, role: 'primary' as const },
    ...(input.secondaryMuscleGroupIds ?? []).map(mgId => ({
      exercise_id: exerciseId,
      muscle_group_id: mgId,
      role: 'secondary' as const,
    })),
  ];

  const { error: e2 } = await supabase.from('exercise_muscle_groups').insert(rows);
  if (e2) throw e2;

  const result = await getExerciseById(exerciseId);
  if (!result) throw new Error('Exercise not found after creation');
  return result;
}

export async function updateCustomExercise(
  userId: string,
  exerciseId: string,
  input: UpdateCustomExerciseInput
): Promise<Exercise> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;

  const { error: e1 } = await supabase
    .from('exercises')
    .update(patch)
    .eq('id', exerciseId)
    .eq('user_id', userId);
  if (e1) throw e1;

  if (input.primaryMuscleGroupId !== undefined || input.secondaryMuscleGroupIds !== undefined) {
    const { error: eDel } = await supabase
      .from('exercise_muscle_groups')
      .delete()
      .eq('exercise_id', exerciseId);
    if (eDel) throw eDel;

    const existing = await getExerciseById(exerciseId);
    if (!existing) throw new Error('Exercise not found during update');

    const primaryId = input.primaryMuscleGroupId ?? existing.primaryMuscleGroup?.id;
    const secondaryIds =
      input.secondaryMuscleGroupIds ?? existing.secondaryMuscleGroups.map(mg => mg.id);

    const rows = [
      ...(primaryId
        ? [{ exercise_id: exerciseId, muscle_group_id: primaryId, role: 'primary' as const }]
        : []),
      ...secondaryIds.map(mgId => ({
        exercise_id: exerciseId,
        muscle_group_id: mgId,
        role: 'secondary' as const,
      })),
    ];

    if (rows.length > 0) {
      const { error: eIns } = await supabase.from('exercise_muscle_groups').insert(rows);
      if (eIns) throw eIns;
    }
  }

  const result = await getExerciseById(exerciseId);
  if (!result) throw new Error('Exercise not found after update');
  return result;
}

export async function deleteCustomExercise(exerciseId: string): Promise<void> {
  // ON DELETE CASCADE removes exercise_muscle_groups rows automatically
  const { error } = await supabase.from('exercises').delete().eq('id', exerciseId);
  if (error) throw error;
}
