import { useCallback, useEffect, useState } from 'react';
import { getOrCreateSession } from '@/lib/auth';
import {
  getUserSplits,
  createSplit as createSplitService,
  deleteSplit as deleteSplitService,
  setActiveSplit as setActiveSplitService,
} from '@/lib/split-service';
import type { TrainingSplit, CreateSplitInput } from '@/types/splits';

export function useSplits() {
  const [splits, setSplits] = useState<TrainingSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = await getOrCreateSession();
      if (!uid) throw new Error('Not authenticated');
      setUserId(uid);
      const data = await getUserSplits(uid);
      setSplits(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useSplits]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createSplit = useCallback(
    async (input: CreateSplitInput): Promise<TrainingSplit> => {
      if (!userId) throw new Error('Not authenticated');
      const split = await createSplitService(userId, input);
      setSplits(prev => [split, ...prev]);
      return split;
    },
    [userId]
  );

  const deleteSplit = useCallback(async (splitId: string) => {
    await deleteSplitService(splitId);
    setSplits(prev => prev.filter(s => s.id !== splitId));
  }, []);

  const setActive = useCallback(
    async (splitId: string) => {
      if (!userId) throw new Error('Not authenticated');
      await setActiveSplitService(userId, splitId);
      setSplits(prev =>
        prev.map(s => ({ ...s, isActive: s.id === splitId }))
      );
    },
    [userId]
  );

  return { splits, loading, error, refresh, createSplit, deleteSplit, setActive };
}
