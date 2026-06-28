import { useCallback, useEffect, useState } from 'react';
import { getMuscleGroups } from '@/lib/exercise-service';
import type { MuscleGroup } from '@/types/exercises';

export function useMuscleGroups() {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMuscleGroups();
      setMuscleGroups(data);
    } catch (e) {
      console.error('[useMuscleGroups]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { muscleGroups, loading };
}
