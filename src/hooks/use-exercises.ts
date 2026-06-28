import { useCallback, useEffect, useState } from 'react';
import { getOrCreateSession } from '@/lib/auth';
import { getExercises } from '@/lib/exercise-service';
import type { Exercise, ExerciseFilters } from '@/types/exercises';

export function useExercises(filters?: ExerciseFilters) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable serialized dep so we re-fetch when filter contents change
  const filterKey = JSON.stringify(filters ?? {});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await getOrCreateSession();
      if (!userId) throw new Error('Not authenticated');
      const parsedFilters: ExerciseFilters = JSON.parse(filterKey);
      const data = await getExercises(userId, parsedFilters);
      setExercises(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useExercises]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  // filterKey is the stable serialized dep — re-run when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => { load(); }, [load]);

  return { exercises, loading, error, refresh: load };
}
