import { useCallback, useEffect, useState } from 'react';
import { getOrCreateSession } from '@/lib/auth';
import {
  getCurrentWeight,
  getWeightHistory,
  createWeightEntry,
  updateWeightEntry,
  deleteWeightEntry,
} from '@/lib/bodyweight-service';
import type {
  BodyweightEntry,
  CreateBodyweightEntryInput,
  UpdateBodyweightEntryInput,
} from '@/types/bodyweight';

export function useBodyweight() {
  const [currentWeight, setCurrentWeight] = useState<BodyweightEntry | null>(null);
  const [history, setHistory] = useState<BodyweightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await getOrCreateSession();
      if (!userId) throw new Error('Not authenticated');
      const [current, hist] = await Promise.all([
        getCurrentWeight(userId),
        getWeightHistory(userId),
      ]);
      setCurrentWeight(current);
      setHistory(hist);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useBodyweight]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addEntry = useCallback(async (input: CreateBodyweightEntryInput): Promise<BodyweightEntry> => {
    const userId = await getOrCreateSession();
    if (!userId) throw new Error('Not authenticated');
    const entry = await createWeightEntry(userId, input);
    setHistory(prev => [entry, ...prev]);
    setCurrentWeight(prev => {
      if (!prev || entry.measuredAt >= prev.measuredAt) return entry;
      return prev;
    });
    return entry;
  }, []);

  const updateEntry = useCallback(async (
    entryId: string,
    input: UpdateBodyweightEntryInput
  ): Promise<void> => {
    await updateWeightEntry(entryId, input);
    await refresh();
  }, [refresh]);

  const deleteEntry = useCallback(async (entryId: string): Promise<void> => {
    await deleteWeightEntry(entryId);
    setHistory(prev => prev.filter(e => e.id !== entryId));
    await refresh();
  }, [refresh]);

  return { currentWeight, history, loading, error, refresh, addEntry, updateEntry, deleteEntry };
}
