import { useCallback, useEffect, useState } from 'react';
import { getOrCreateSession } from '@/lib/auth';
import { getProgressData } from '@/lib/progress-service';
import type { MuscleGroupProgress, PersonalRecordPreview, ProgressOverview } from '@/types/progress';

export function useProgress() {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupProgress[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecordPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await getOrCreateSession();
      if (!userId) throw new Error('Not authenticated');
      const data = await getProgressData(userId);
      setOverview(data.overview);
      setMuscleGroups(data.muscleGroups);
      setPersonalRecords(data.personalRecords);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useProgress]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { overview, muscleGroups, personalRecords, loading, error, refresh };
}
