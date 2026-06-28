import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  Badge,
  Card,
  Divider,
  IconButton,
  ScreenContainer,
  SectionHeader,
  SmallActionButton,
} from '@/components/ui';
import { ExercisePicker } from '@/components/workout/exercise-picker';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useSplitEditor } from '@/hooks/use-split-editor';
import { useMuscleGroups } from '@/hooks/use-muscle-groups';
import { deleteSplit } from '@/lib/split-service';
import { useTheme } from '@/hooks/use-theme';
import type { Exercise, MuscleGroup } from '@/types/exercises';
import type { SplitDay } from '@/types/splits';

const SPLIT_TYPE_LABELS: Record<string, string> = {
  push_pull_legs: 'Push / Pull / Legs',
  upper_lower: 'Upper / Lower',
  full_body: 'Full Body',
  custom: 'Custom',
};

export default function SplitEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { muscleGroups } = useMuscleGroups();

  const {
    split,
    loading,
    updateName,
    updateWorkoutsPerWeek,
    setAsActive,
    addDay,
    removeDay,
    updateDayName,
    addMuscleGroup,
    removeMuscleGroup,
    addExercise,
    removeExercise,
  } = useSplitEditor(id ?? '');

  const [expandedMuscleGroupDayId, setExpandedMuscleGroupDayId] = useState<string | null>(null);
  const [exercisePickerDayId, setExercisePickerDayId] = useState<string | null>(null);
  const [newDayName, setNewDayName] = useState('');
  const [addingDay, setAddingDay] = useState(false);

  if (!id) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={{ color: theme.error }}>No split ID provided.</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={{ color: theme.textSecondary }}>Loading split…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!split) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={{ color: theme.error }}>Split not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  async function handleDelete() {
    Alert.alert(
      'Delete Split?',
      'This split and all its days will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSplit(id!);
              router.replace('/explore');
            } catch (e) {
              console.error('[SplitEditorScreen] delete error:', e);
              Alert.alert('Error', 'Could not delete split. Please try again.');
            }
          },
        },
      ]
    );
  }

  async function handleSetActive() {
    try {
      await setAsActive();
    } catch (e) {
      Alert.alert('Error', 'Could not set split as active. Please try again.');
    }
  }

  async function handleAddDay() {
    if (!newDayName.trim()) return;
    setAddingDay(true);
    try {
      await addDay(newDayName.trim());
      setNewDayName('');
    } catch (e) {
      Alert.alert('Error', 'Could not add day. Please try again.');
    } finally {
      setAddingDay(false);
    }
  }

  async function handleRemoveDay(dayId: string, dayName: string) {
    Alert.alert(
      `Remove ${dayName}?`,
      'All exercises in this day will also be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDay(dayId);
            } catch (e) {
              Alert.alert('Error', 'Could not remove day. Please try again.');
            }
          },
        },
      ]
    );
  }

  function handleToggleMuscleGroupEdit(dayId: string) {
    setExpandedMuscleGroupDayId(prev => (prev === dayId ? null : dayId));
  }

  async function handleMuscleGroupToggle(day: SplitDay, mg: MuscleGroup) {
    const isSelected = day.muscleGroups.some(m => m.id === mg.id);
    try {
      if (isSelected) {
        await removeMuscleGroup(day.id, mg.id);
      } else {
        await addMuscleGroup(day.id, mg.id, mg);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update muscle groups. Please try again.');
    }
  }

  async function handleExerciseSelected(exercise: Exercise) {
    if (!exercisePickerDayId) return;
    try {
      await addExercise(exercisePickerDayId, exercise);
    } catch (e) {
      Alert.alert('Error', 'Could not add exercise. Please try again.');
    }
    setExercisePickerDayId(null);
  }

  async function handleRemoveExercise(splitDayExerciseId: string) {
    try {
      await removeExercise(splitDayExerciseId);
    } catch (e) {
      Alert.alert('Error', 'Could not remove exercise. Please try again.');
    }
  }

  return (
    <>
      <ScreenContainer scrollable contentStyle={{ gap: Spacing.three, paddingBottom: Spacing.six }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <IconButton
            name="chevron.left"
            onPress={() => router.back()}
            accessibilityLabel="Back"
          />
          {!split.isActive && (
            <SmallActionButton label="Set as Active" onPress={handleSetActive} />
          )}
          {split.isActive && (
            <View style={[styles.activeBadge, { backgroundColor: theme.accentSubtle, borderColor: theme.accent }]}>
              <Text style={[styles.activeBadgeLabel, { color: theme.accent }]}>Active</Text>
            </View>
          )}
        </View>

        {/* Split name */}
        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>SPLIT NAME</Text>
          <TextInput
            style={[styles.nameInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            value={split.name}
            onChangeText={updateName}
            placeholder="Split name"
            placeholderTextColor={theme.textTertiary}
            returnKeyType="done"
          />
        </View>

        {/* Type + workouts/week */}
        <View style={[styles.metaRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>TYPE</Text>
            <Text style={[styles.metaValue, { color: theme.text }]}>
              {SPLIT_TYPE_LABELS[split.type] ?? split.type}
            </Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>FREQUENCY</Text>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={async () => {
                  try {
                    await updateWorkoutsPerWeek(split.workoutsPerWeek - 1);
                  } catch {
                    Alert.alert('Error', 'Could not update frequency.');
                  }
                }}
                style={[styles.stepperBtn, { borderColor: theme.border }]}>
                <Text style={[styles.stepperBtnLabel, { color: theme.text }]}>−</Text>
              </Pressable>
              <Text style={[styles.stepperValue, { color: theme.text }]}>
                {split.workoutsPerWeek}×
              </Text>
              <Pressable
                onPress={async () => {
                  try {
                    await updateWorkoutsPerWeek(split.workoutsPerWeek + 1);
                  } catch {
                    Alert.alert('Error', 'Could not update frequency.');
                  }
                }}
                style={[styles.stepperBtn, { borderColor: theme.border }]}>
                <Text style={[styles.stepperBtnLabel, { color: theme.text }]}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Training Days */}
        <SectionHeader title="Training Days" />

        {split.days.map(day => (
          <Card key={day.id}>
            {/* Day name row */}
            <View style={styles.dayHeader}>
              <TextInput
                style={[styles.dayNameInput, { color: theme.text, borderBottomColor: theme.border }]}
                value={day.name}
                onChangeText={name => updateDayName(day.id, name)}
                placeholder="Day name"
                placeholderTextColor={theme.textTertiary}
                returnKeyType="done"
              />
              <IconButton
                name="trash"
                onPress={() => handleRemoveDay(day.id, day.name)}
                accessibilityLabel={`Remove ${day.name}`}
              />
            </View>

            {/* Muscle groups */}
            <View style={styles.daySection}>
              <View style={styles.daySectionHeader}>
                <Text style={[styles.daySectionLabel, { color: theme.textSecondary }]}>
                  MUSCLE GROUPS
                </Text>
                <Pressable onPress={() => handleToggleMuscleGroupEdit(day.id)}>
                  <Text style={[styles.editLink, { color: theme.accent }]}>
                    {expandedMuscleGroupDayId === day.id ? 'Done' : 'Edit'}
                  </Text>
                </Pressable>
              </View>

              {/* Selected muscle group badges */}
              <View style={styles.badgeRow}>
                {day.muscleGroups.length === 0 ? (
                  <Text style={[styles.emptyHint, { color: theme.textTertiary }]}>
                    No muscle groups — tap Edit
                  </Text>
                ) : (
                  day.muscleGroups.map(mg => (
                    <Badge key={mg.id} label={mg.name} variant="neutral" size="sm" />
                  ))
                )}
              </View>

              {/* Muscle group picker (expanded) */}
              {expandedMuscleGroupDayId === day.id && (
                <View style={styles.mgPicker}>
                  {muscleGroups.map((mg: MuscleGroup) => {
                    const isSelected = day.muscleGroups.some(m => m.id === mg.id);
                    return (
                      <Pressable
                        key={mg.id}
                        onPress={() => handleMuscleGroupToggle(day, mg)}
                        style={[
                          styles.mgChip,
                          {
                            backgroundColor: isSelected ? theme.accentSubtle : theme.surface,
                            borderColor: isSelected ? theme.accent : theme.border,
                          },
                        ]}>
                        <Text style={[styles.mgChipLabel, { color: isSelected ? theme.accent : theme.textSecondary }]}>
                          {mg.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <Divider />

            {/* Exercises */}
            <View style={styles.daySection}>
              <Text style={[styles.daySectionLabel, { color: theme.textSecondary }]}>EXERCISES</Text>
              {day.exercises.length === 0 ? (
                <Text style={[styles.emptyHint, { color: theme.textTertiary }]}>
                  No exercises yet — add some below
                </Text>
              ) : (
                <View style={styles.exerciseList}>
                  {day.exercises.map(ex => (
                    <View
                      key={ex.id}
                      style={[styles.exerciseRow, { borderBottomColor: theme.border }]}>
                      <View style={styles.exerciseInfo}>
                        <Text style={[styles.exerciseName, { color: theme.text }]}>
                          {ex.exercise?.name ?? 'Exercise'}
                        </Text>
                        {ex.exercise?.primaryMuscleGroup && (
                          <Text style={[styles.exerciseMeta, { color: theme.textSecondary }]}>
                            {ex.exercise.primaryMuscleGroup.name}
                          </Text>
                        )}
                      </View>
                      <IconButton
                        name="xmark"
                        onPress={() => handleRemoveExercise(ex.id)}
                        accessibilityLabel={`Remove ${ex.exercise?.name ?? 'exercise'}`}
                      />
                    </View>
                  ))}
                </View>
              )}
              <Pressable
                onPress={() => setExercisePickerDayId(day.id)}
                style={[styles.addExerciseBtn, { borderColor: theme.accent }]}>
                <Text style={[styles.addExerciseBtnLabel, { color: theme.accent }]}>
                  + Add Exercise
                </Text>
              </Pressable>
            </View>
          </Card>
        ))}

        {/* Add Day (custom splits only) */}
        {split.type === 'custom' && (
          <Card>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>ADD DAY</Text>
            <View style={styles.addDayRow}>
              <TextInput
                style={[
                  styles.addDayInput,
                  { backgroundColor: theme.background, borderColor: theme.border, color: theme.text, flex: 1 },
                ]}
                placeholder="Day name (e.g. Push Day)"
                placeholderTextColor={theme.textTertiary}
                value={newDayName}
                onChangeText={setNewDayName}
                returnKeyType="done"
                onSubmitEditing={handleAddDay}
              />
              <Pressable
                onPress={handleAddDay}
                disabled={addingDay || !newDayName.trim()}
                style={[
                  styles.addDayButton,
                  { backgroundColor: theme.accent, opacity: newDayName.trim() ? 1 : 0.5 },
                ]}>
                <Text style={styles.addDayButtonLabel}>Add</Text>
              </Pressable>
            </View>
          </Card>
        )}

        <Divider />

        {/* Delete */}
        <SmallActionButton label="Delete Split" onPress={handleDelete} variant="ghost" />
      </ScreenContainer>

      <ExercisePicker
        visible={exercisePickerDayId !== null}
        onSelect={handleExerciseSelected}
        onClose={() => setExercisePickerDayId(null)}
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
  activeBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  activeBadgeLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  section: {
    gap: Spacing.two,
  },
  fieldLabel: {
    ...Typography.label,
    letterSpacing: 0.5,
  },
  nameInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metaItem: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  metaDivider: {
    width: StyleSheet.hairlineWidth,
  },
  metaLabel: {
    ...Typography.label,
    letterSpacing: 0.5,
  },
  metaValue: {
    ...Typography.headline,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnLabel: {
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 22,
  },
  stepperValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    paddingHorizontal: Spacing.two,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  dayNameInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    paddingVertical: Spacing.one,
    borderBottomWidth: 1,
  },
  daySection: {
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daySectionLabel: {
    ...Typography.label,
    letterSpacing: 0.5,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    minHeight: 20,
  },
  emptyHint: {
    ...Typography.footnote,
    fontStyle: 'italic',
  },
  mgPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    paddingTop: Spacing.one,
  },
  mgChip: {
    height: 30,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mgChipLabel: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  exerciseList: {
    gap: 0,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    ...Typography.subhead,
    fontWeight: '500',
  },
  exerciseMeta: {
    ...Typography.caption,
  },
  addExerciseBtn: {
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  addExerciseBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  addDayRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  addDayInput: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    fontSize: 15,
  },
  addDayButton: {
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDayButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
