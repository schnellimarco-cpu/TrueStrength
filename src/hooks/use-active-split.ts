import { useCallback, useEffect, useState } from 'react';
import { getOrCreateSession } from '@/lib/auth';
import { getActiveSplit } from '@/lib/split-service';
import type { TrainingSplit } from '@/types/splits';

export function useActiveSplit() {
  const [activeSplit, setActiveSplit] = useState<TrainingSplit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await getOrCreateSession();
      if (!userId) throw new Error('Not authenticated');
      const split = await getActiveSplit(userId);
      setActiveSplit(split);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useActiveSplit]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { activeSplit, loading, error, refresh };
}
