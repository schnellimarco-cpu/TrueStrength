import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { IconButton, PrimaryButton, ScreenContainer } from '@/components/ui';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useExerciseCategories } from '@/hooks/use-exercise-categories';
import { useMuscleGroups } from '@/hooks/use-muscle-groups';
import { useTheme } from '@/hooks/use-theme';
import { createCustomExercise } from '@/lib/exercise-service';
import { getOrCreateSession } from '@/lib/auth';
import type { ExerciseCategory, MuscleGroup } from '@/types/exercises';

export default function NewExerciseScreen() {
  const theme = useTheme();
  const { categories } = useExerciseCategories();
  const { muscleGroups } = useMuscleGroups();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [primaryMuscleGroupId, setPrimaryMuscleGroupId] = useState<string | null>(null);
  const [secondaryMuscleGroupIds, setSecondaryMuscleGroupIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleSecondary(id: string) {
    setSecondaryMuscleGroupIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter an exercise name.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Category required', 'Please select a category.');
      return;
    }
    if (!primaryMuscleGroupId) {
      Alert.alert('Muscle group required', 'Please select a primary muscle group.');
      return;
    }

    setSaving(true);
    try {
      const userId = await getOrCreateSession();
      if (!userId) throw new Error('Not authenticated');
      await createCustomExercise(userId, {
        name,
        categoryId,
        primaryMuscleGroupId,
        secondaryMuscleGroupIds: secondaryMuscleGroupIds.length > 0 ? secondaryMuscleGroupIds : undefined,
      });
      router.back();
    } catch (e) {
      console.error('[NewExerciseScreen] save error:', e);
      Alert.alert('Error', 'Could not save exercise. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer scrollable contentStyle={{ gap: Spacing.four, paddingBottom: Spacing.five }}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton
          name="chevron.left"
          onPress={() => router.back()}
          accessibilityLabel="Back"
        />
      </View>

      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>New Exercise</Text>
        <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
          Add a custom exercise to your library.
        </Text>
      </View>

      {/* Name */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>NAME</Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder="e.g. Incline Dumbbell Press"
          placeholderTextColor={theme.textTertiary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      {/* Category */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CATEGORY</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {categories.map((cat: ExerciseCategory) => {
            const isSelected = categoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? theme.accentSubtle : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border,
                  },
                ]}>
                <Text style={[styles.chipLabel, { color: isSelected ? theme.accent : theme.textSecondary }]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Primary Muscle Group */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PRIMARY MUSCLE GROUP</Text>
        <View style={styles.chipWrap}>
          {muscleGroups.map((mg: MuscleGroup) => {
            const isSelected = primaryMuscleGroupId === mg.id;
            return (
              <Pressable
                key={mg.id}
                onPress={() => {
                  setPrimaryMuscleGroupId(mg.id);
                  // Remove from secondary if selected as primary
                  setSecondaryMuscleGroupIds(prev => prev.filter(id => id !== mg.id));
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? theme.accentSubtle : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border,
                  },
                ]}>
                <Text style={[styles.chipLabel, { color: isSelected ? theme.accent : theme.textSecondary }]}>
                  {mg.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Secondary Muscle Groups */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>SECONDARY MUSCLE GROUPS (OPTIONAL)</Text>
        <View style={styles.chipWrap}>
          {muscleGroups
            .filter((mg: MuscleGroup) => mg.id !== primaryMuscleGroupId)
            .map((mg: MuscleGroup) => {
              const isSelected = secondaryMuscleGroupIds.includes(mg.id);
              return (
                <Pressable
                  key={mg.id}
                  onPress={() => toggleSecondary(mg.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? theme.accentSubtle : theme.surface,
                      borderColor: isSelected ? theme.accent : theme.border,
                    },
                  ]}>
                  <Text style={[styles.chipLabel, { color: isSelected ? theme.accent : theme.textSecondary }]}>
                    {mg.name}
                  </Text>
                </Pressable>
              );
            })}
        </View>
      </View>

      <PrimaryButton
        label="Save Exercise"
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        fullWidth
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: Spacing.two,
  },
  pageHeader: {
    gap: Spacing.one,
  },
  pageTitle: {
    ...Typography.title1,
  },
  pageSubtitle: {
    ...Typography.body,
  },
  field: {
    gap: Spacing.two,
  },
  fieldLabel: {
    ...Typography.label,
    letterSpacing: 0.5,
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 17,
    lineHeight: 22,
  },
  chipRow: {
    gap: Spacing.one,
    flexDirection: 'row',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    height: 32,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
});
