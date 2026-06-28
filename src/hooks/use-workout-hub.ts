import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { getOrCreateSession } from '@/lib/auth';
import {
  discardSession,
  getActiveSession,
  prefillExercisesFromSplitDay,
  startSession,
} from '@/lib/workout-session-service';
import type { ActiveSession } from '@/types/session';
import type { SplitDayExercise } from '@/types/splits';

type StartWorkoutOptions = {
  splitId?: string;
  splitDayId?: string;
  splitDayExercises?: SplitDayExercise[];
};

export function useWorkoutHub() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = await getOrCreateSession();
      if (!uid) throw new Error('Not authenticated');
      setUserId(uid);
      const session = await getActiveSession(uid);
      setActiveSession(session);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useWorkoutHub]', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const startWorkout = useCallback(
    async (title: string, options?: StartWorkoutOptions) => {
      const uid = userId ?? (await getOrCreateSession());
      if (!uid) return;
      if (!userId) setUserId(uid);
      try {
        const sessionId = await startSession(uid, title, options?.splitId, options?.splitDayId);
        if (options?.splitDayExercises?.length) {
          await prefillExercisesFromSplitDay(sessionId, options.splitDayExercises);
        }
        setActiveSession({ id: sessionId, title, startedAt: new Date().toISOString() });
        router.push(`/explore/active?id=${sessionId}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[useWorkoutHub] startWorkout error:', msg);
        Alert.alert('Error', 'Could not start workout. Please try again.');
      }
    },
    [userId]
  );

  const resumeWorkout = useCallback(() => {
    if (!activeSession) return;
    router.push(`/explore/active?id=${activeSession.id}`);
  }, [activeSession]);

  const discardActive = useCallback(() => {
    if (!activeSession) return;
    Alert.alert(
      'Discard Workout?',
      'This workout will be discarded and cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              await discardSession(activeSession.id);
              setActiveSession(null);
            } catch (e) {
              console.error('[useWorkoutHub] discardActive error:', e);
              Alert.alert('Error', 'Could not discard workout. Please try again.');
            }
          },
        },
      ]
    );
  }, [activeSession]);

  return {
    userId,
    activeSession,
    loading,
    error,
    refresh,
    startWorkout,
    resumeWorkout,
    discardActive,
  };
}
