import { useCallback, useEffect, useState } from 'react';
import { getOrCreateSession } from '@/lib/auth';
import { getCompletedWorkouts } from '@/lib/workout-history-service';
import type { CompletedWorkoutSummary } from '@/types/workout-history';

export function useWorkoutHistory() {
  const [recentWorkouts, setRecentWorkouts] = useState<CompletedWorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = await getOrCreateSession();
      if (!uid) throw new Error('Not authenticated');
      const data = await getCompletedWorkouts(uid, 20);
      setRecentWorkouts(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useWorkoutHistory]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { recentWorkouts, loading, error, refresh };
}
