import { useCallback, useEffect, useState } from 'react';
import { getExerciseCategories } from '@/lib/exercise-service';
import type { ExerciseCategory } from '@/types/exercises';

export function useExerciseCategories() {
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExerciseCategories();
      setCategories(data);
    } catch (e) {
      console.error('[useExerciseCategories]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { categories, loading };
}
