import { useCallback, useEffect, useRef, useState } from 'react';
import { getOrCreateSession } from '@/lib/auth';
import {
  getSplitById,
  updateSplit,
  setActiveSplit,
  addSplitDay,
  removeSplitDay,
  updateSplitDay,
  addMuscleGroupToDay,
  removeMuscleGroupFromDay,
  addExerciseToDay,
  removeExerciseFromDay,
} from '@/lib/split-service';
import type { TrainingSplit, SplitDay } from '@/types/splits';
import type { Exercise } from '@/types/exercises';

export function useSplitEditor(splitId: string) {
  const [split, setSplit] = useState<TrainingSplit | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Debounce for name fields
  const nameTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!splitId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const uid = await getOrCreateSession();
        if (!uid || cancelled) return;
        setUserId(uid);
        const data = await getSplitById(splitId);
        if (!cancelled) setSplit(data);
      } catch (e) {
        console.error('[useSplitEditor] load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      nameTimers.current.forEach(t => clearTimeout(t));
    };
  }, [splitId]);

  const handleUpdateName = useCallback(
    (name: string) => {
      setSplit(prev => (prev ? { ...prev, name } : prev));
      const key = 'split-name';
      const existing = nameTimers.current.get(key);
      if (existing) clearTimeout(existing);
      const t = setTimeout(async () => {
        nameTimers.current.delete(key);
        try {
          await updateSplit(splitId, { name });
        } catch (e) {
          console.error('[useSplitEditor] updateName error:', e);
        }
      }, 600);
      nameTimers.current.set(key, t);
    },
    [splitId]
  );

  const handleSetAsActive = useCallback(async () => {
    if (!userId) return;
    try {
      await setActiveSplit(userId, splitId);
      setSplit(prev => (prev ? { ...prev, isActive: true } : prev));
    } catch (e) {
      console.error('[useSplitEditor] setAsActive error:', e);
      throw e;
    }
  }, [userId, splitId]);

  const handleAddDay = useCallback(
    async (name: string) => {
      if (!split) return;
      const dayOrder = split.days.length;
      try {
        const newDay = await addSplitDay(splitId, name, dayOrder);
        setSplit(prev =>
          prev ? { ...prev, days: [...prev.days, newDay] } : prev
        );
      } catch (e) {
        console.error('[useSplitEditor] addDay error:', e);
        throw e;
      }
    },
    [split, splitId]
  );

  const handleRemoveDay = useCallback(async (dayId: string) => {
    try {
      await removeSplitDay(dayId);
      setSplit(prev =>
        prev
          ? { ...prev, days: prev.days.filter(d => d.id !== dayId) }
          : prev
      );
    } catch (e) {
      console.error('[useSplitEditor] removeDay error:', e);
      throw e;
    }
  }, []);

  const handleUpdateDayName = useCallback(
    (dayId: string, name: string) => {
      setSplit(prev =>
        prev
          ? {
              ...prev,
              days: prev.days.map(d => (d.id === dayId ? { ...d, name } : d)),
            }
          : prev
      );
      const key = 'day-' + dayId;
      const existing = nameTimers.current.get(key);
      if (existing) clearTimeout(existing);
      const t = setTimeout(async () => {
        nameTimers.current.delete(key);
        try {
          await updateSplitDay(dayId, { name });
        } catch (e) {
          console.error('[useSplitEditor] updateDayName error:', e);
        }
      }, 600);
      nameTimers.current.set(key, t);
    },
    []
  );

  const handleAddMuscleGroup = useCallback(
    async (dayId: string, muscleGroupId: string, muscleGroup: { id: string; name: string; slug: string }) => {
      try {
        await addMuscleGroupToDay(dayId, muscleGroupId);
        setSplit(prev =>
          prev
            ? {
                ...prev,
                days: prev.days.map(d =>
                  d.id === dayId
                    ? { ...d, muscleGroups: [...d.muscleGroups, muscleGroup] }
                    : d
                ),
              }
            : prev
        );
      } catch (e) {
        console.error('[useSplitEditor] addMuscleGroup error:', e);
        throw e;
      }
    },
    []
  );

  const handleRemoveMuscleGroup = useCallback(
    async (dayId: string, muscleGroupId: string) => {
      try {
        await removeMuscleGroupFromDay(dayId, muscleGroupId);
        setSplit(prev =>
          prev
            ? {
                ...prev,
                days: prev.days.map(d =>
                  d.id === dayId
                    ? { ...d, muscleGroups: d.muscleGroups.filter(mg => mg.id !== muscleGroupId) }
                    : d
                ),
              }
            : prev
        );
      } catch (e) {
        console.error('[useSplitEditor] removeMuscleGroup error:', e);
        throw e;
      }
    },
    []
  );

  const handleAddExercise = useCallback(
    async (dayId: string, exercise: Exercise) => {
      const day = split?.days.find(d => d.id === dayId);
      if (!day) return;
      const order = day.exercises.length;
      try {
        const newEntry = await addExerciseToDay(dayId, exercise.id, order);
        setSplit(prev =>
          prev
            ? {
                ...prev,
                days: prev.days.map(d =>
                  d.id === dayId
                    ? { ...d, exercises: [...d.exercises, newEntry] }
                    : d
                ),
              }
            : prev
        );
      } catch (e) {
        console.error('[useSplitEditor] addExercise error:', e);
        throw e;
      }
    },
    [split]
  );

  const handleRemoveExercise = useCallback(
    async (splitDayExerciseId: string) => {
      try {
        await removeExerciseFromDay(splitDayExerciseId);
        setSplit(prev =>
          prev
            ? {
                ...prev,
                days: prev.days.map(d => ({
                  ...d,
                  exercises: d.exercises.filter(e => e.id !== splitDayExerciseId),
                })),
              }
            : prev
        );
      } catch (e) {
        console.error('[useSplitEditor] removeExercise error:', e);
        throw e;
      }
    },
    []
  );

  return {
    split,
    loading,
    updateName: handleUpdateName,
    setAsActive: handleSetAsActive,
    addDay: handleAddDay,
    removeDay: handleRemoveDay,
    updateDayName: handleUpdateDayName,
    addMuscleGroup: handleAddMuscleGroup,
    removeMuscleGroup: handleRemoveMuscleGroup,
    addExercise: handleAddExercise,
    removeExercise: handleRemoveExercise,
  };
}
