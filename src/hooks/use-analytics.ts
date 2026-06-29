import { useCallback, useEffect, useState } from 'react';
import { getOrCreateSession } from '@/lib/auth';
import { computeAnalyticsSnapshot } from '@/lib/analytics';
import type { AnalyticsSnapshot } from '@/types/analytics';

export function useAnalytics() {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await getOrCreateSession();
      if (!userId) throw new Error('Not authenticated');
      setSnapshot(await computeAnalyticsSnapshot(userId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useAnalytics]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { snapshot, loading, error, refresh };
}
