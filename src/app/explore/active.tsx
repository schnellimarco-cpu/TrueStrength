import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ExerciseCard } from '@/components/workout/exercise-card';
import { ExercisePicker } from '@/components/workout/exercise-picker';
import { WorkoutHeader } from '@/components/workout/workout-header';
import { Badge, IconButton, PrimaryButton, ScreenContainer, SecondaryButton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useActiveWorkoutSession } from '@/hooks/use-active-workout-session';
import { useTheme } from '@/hooks/use-theme';
import type { Exercise } from '@/types/exercises';

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const { exercises, loading, addExercise, addSet, updateSet, toggleSet, finish, discard } =
    useActiveWorkoutSession(id ?? '');

  if (!id) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={{ color: theme.error }}>No active session found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  async function handleFinish() {
    Alert.alert(
      'Finish Workout?',
      'Mark this workout as complete and save it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finish', style: 'default', onPress: finish },
      ]
    );
  }

  async function handleAddExercise(exercise: Exercise) {
    await addExercise(exercise);
    setShowExercisePicker(false);
  }

  return (
    <>
      <ScreenContainer
        scrollable
        contentStyle={{ gap: Spacing.three, paddingBottom: Spacing.five }}>
        {/* Back button + in-progress badge */}
        <View style={styles.topBar}>
          <IconButton
            name="chevron.left"
            onPress={() => router.back()}
            accessibilityLabel="Back to Workout Hub"
          />
          <Badge label="In Progress" variant="accent" size="sm" />
          <IconButton
            name="xmark"
            onPress={discard}
            accessibilityLabel="Discard workout"
          />
        </View>

        <WorkoutHeader name="Push Day" focus="Chest, Shoulders, Triceps" duration="Active" />

        {exercises.map(ex => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onAddSet={() => addSet(ex.id)}
            onUpdateSet={(setId, field, value) => updateSet(setId, field, value)}
            onToggleSet={setId => toggleSet(setId)}
            onStartRestTimer={() =>
              Alert.alert('Rest Timer', 'Rest timer coming in the next update.')
            }
          />
        ))}

        <SecondaryButton
          label="+ Add Exercise"
          onPress={() => setShowExercisePicker(true)}
          fullWidth
        />
        <PrimaryButton label="Finish Workout" onPress={handleFinish} fullWidth />
      </ScreenContainer>

      <ExercisePicker
        visible={showExercisePicker}
        onSelect={handleAddExercise}
        onClose={() => setShowExercisePicker(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
