import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import {
  addExerciseToSession,
  addSetToSession,
  discardSession,
  finishSession,
  loadSessionExercises,
  toggleSetComplete,
  updateSetField,
} from '@/lib/workout-session-service';
import type { WorkoutExercise, WorkoutSet } from '@/components/workout/types';
import type { Exercise } from '@/types/exercises';

export function useActiveWorkoutSession(sessionId: string) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Map of `setId+field` → timer handle for debounced Supabase writes
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadSessionExercises(sessionId);
      setExercises(data);
    } catch (e) {
      console.error('[useActiveWorkoutSession] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
    return () => {
      // Clear any pending debounce timers on unmount
      debounceTimers.current.forEach(t => clearTimeout(t));
    };
  }, [load]);

  const handleAddExercise = useCallback(
    async (exercise: Exercise) => {
      const sortOrder = exercises.length;
      try {
        const { workoutExerciseId, setId } = await addExerciseToSession(
          sessionId,
          exercise,
          sortOrder
        );
        const newExercise: WorkoutExercise = {
          id: workoutExerciseId,
          exerciseId: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.primaryMuscleGroup?.name ?? '',
          previousBest: '',
          sets: [
            {
              id: setId,
              type: 'working',
              weight: '',
              reps: '',
              completed: false,
            },
          ],
        };
        setExercises(prev => [...prev, newExercise]);
      } catch (e) {
        console.error('[useActiveWorkoutSession] addExercise error:', e);
        Alert.alert('Error', 'Could not add exercise. Please try again.');
      }
    },
    [sessionId, exercises.length]
  );

  const handleAddSet = useCallback(
    async (workoutExerciseId: string) => {
      const ex = exercises.find(e => e.id === workoutExerciseId);
      if (!ex) return;

      const workingSets = ex.sets.filter(s => s.type === 'working');
      const lastSet = workingSets[workingSets.length - 1];
      const setNumber = ex.sets.length + 1;

      try {
        const setId = await addSetToSession(workoutExerciseId, setNumber, lastSet);
        const newSet: WorkoutSet = {
          id: setId,
          type: 'working',
          weight: lastSet?.weight ?? '',
          reps: lastSet?.reps ?? '',
          completed: false,
        };
        setExercises(prev =>
          prev.map(e =>
            e.id === workoutExerciseId ? { ...e, sets: [...e.sets, newSet] } : e
          )
        );
      } catch (e) {
        console.error('[useActiveWorkoutSession] addSet error:', e);
        Alert.alert('Error', 'Could not add set. Please try again.');
      }
    },
    [exercises]
  );

  const handleUpdateSet = useCallback(
    (setId: string, field: 'weight' | 'reps', value: string) => {
      // Update local state immediately
      setExercises(prev =>
        prev.map(ex => ({
          ...ex,
          sets: ex.sets.map(s => (s.id === setId ? { ...s, [field]: value } : s)),
        }))
      );

      // Debounce Supabase write
      const key = setId + field;
      const existing = debounceTimers.current.get(key);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(async () => {
        debounceTimers.current.delete(key);
        const numValue =
          field === 'weight' ? parseFloat(value) || 0 : parseInt(value, 10) || 0;
        const dbField = field === 'weight' ? 'weight_kg' : 'reps';
        try {
          await updateSetField(setId, dbField as 'weight_kg' | 'reps', numValue);
        } catch (e) {
          console.error('[useActiveWorkoutSession] updateSet error:', e);
        }
      }, 600);

      debounceTimers.current.set(key, timer);
    },
    []
  );

  const handleToggleSet = useCallback(
    async (setId: string) => {
      // Find the set to get current values
      let targetSet: WorkoutSet | undefined;
      let exerciseName = '';
      for (const ex of exercises) {
        const found = ex.sets.find(s => s.id === setId);
        if (found) {
          targetSet = found;
          exerciseName = ex.name;
          break;
        }
      }
      if (!targetSet) return;

      const newCompleted = !targetSet.completed;

      // Optimistic update
      setExercises(prev =>
        prev.map(ex => ({
          ...ex,
          sets: ex.sets.map(s =>
            s.id === setId ? { ...s, completed: newCompleted } : s
          ),
        }))
      );

      try {
        const weightKg = parseFloat(targetSet.weight) || 0;
        const reps = parseInt(targetSet.reps, 10) || 0;
        await toggleSetComplete(setId, newCompleted, weightKg, reps);
      } catch (e) {
        // Revert on error
        console.error('[useActiveWorkoutSession] toggleSet error:', exerciseName, e);
        setExercises(prev =>
          prev.map(ex => ({
            ...ex,
            sets: ex.sets.map(s =>
              s.id === setId ? { ...s, completed: !newCompleted } : s
            ),
          }))
        );
      }
    },
    [exercises]
  );

  const handleFinish = useCallback(async () => {
    try {
      await finishSession(sessionId);
      router.replace(`/explore/summary?id=${sessionId}`);
    } catch (e) {
      console.error('[useActiveWorkoutSession] finish error:', e);
      Alert.alert('Error', 'Could not finish workout. Please try again.');
    }
  }, [sessionId]);

  const handleDiscard = useCallback(() => {
    Alert.alert(
      'Discard Workout?',
      'All exercises and sets will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              await discardSession(sessionId);
              router.replace('/explore');
            } catch (e) {
              console.error('[useActiveWorkoutSession] discard error:', e);
              Alert.alert('Error', 'Could not discard workout. Please try again.');
            }
          },
        },
      ]
    );
  }, [sessionId]);

  return {
    exercises,
    loading,
    addExercise: handleAddExercise,
    addSet: handleAddSet,
    updateSet: handleUpdateSet,
    toggleSet: handleToggleSet,
    finish: handleFinish,
    discard: handleDiscard,
  };
}
