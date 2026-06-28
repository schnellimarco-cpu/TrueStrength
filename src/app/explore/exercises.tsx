import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Badge, EmptyState, IconButton, ScreenContainer } from '@/components/ui';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useExercises } from '@/hooks/use-exercises';
import { useMuscleGroups } from '@/hooks/use-muscle-groups';
import { useTheme } from '@/hooks/use-theme';
import type { Exercise, MuscleGroup } from '@/types/exercises';

export default function ExerciseLibraryScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);

  const { muscleGroups } = useMuscleGroups();
  const { exercises, loading, error } = useExercises({
    query: searchQuery || undefined,
    muscleGroupId: selectedMuscleGroupId ?? undefined,
  });

  function toggleMuscleGroup(id: string) {
    setSelectedMuscleGroupId(prev => (prev === id ? null : id));
  }

  const renderExercise: ListRenderItem<Exercise> = ({ item, index }) => {
    const isLast = index === exercises.length - 1;
    return (
      <>
        <View style={styles.exerciseRow}>
          <View style={styles.exerciseRowInner}>
            <Text style={[styles.exerciseName, { color: theme.text }]}>{item.name}</Text>
            <View style={styles.badgeRow}>
              {item.primaryMuscleGroup && (
                <Badge label={item.primaryMuscleGroup.name} variant="accent" size="sm" />
              )}
              {item.isCustom && (
                <Badge label="Custom" variant="neutral" size="sm" />
              )}
              {item.category && (
                <Badge label={item.category.name} variant="neutral" size="sm" />
              )}
            </View>
          </View>
        </View>
        {!isLast && (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
      </>
    );
  };

  return (
    <ScreenContainer>
      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton
          name="chevron.left"
          onPress={() => router.back()}
          accessibilityLabel="Back"
        />
        <Text style={[styles.pageTitle, { color: theme.text }]}>Exercise Library</Text>
        <IconButton
          name="plus"
          onPress={() => router.push('/explore/new-exercise')}
          accessibilityLabel="Add custom exercise"
        />
      </View>

      {/* Search bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}>
        <Text style={[styles.searchIcon, { color: theme.textTertiary }]}>{'⌕'}</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search exercises…"
          placeholderTextColor={theme.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Muscle group filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}>
        {muscleGroups.map((mg: MuscleGroup) => {
          const isSelected = selectedMuscleGroupId === mg.id;
          return (
            <Pressable
              key={mg.id}
              onPress={() => toggleMuscleGroup(mg.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.accentSubtle : theme.surface,
                  borderColor: isSelected ? theme.accent : theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.chipLabel,
                  { color: isSelected ? theme.accent : theme.textSecondary },
                ]}>
                {mg.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Exercise list */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      ) : exercises.length === 0 ? (
        <EmptyState
          title="No exercises found"
          description="Try a different search or muscle group filter."
          symbol="dumbbell"
        />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={item => item.id}
          renderItem={renderExercise}
          style={[styles.list, { backgroundColor: theme.surface }]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  pageTitle: {
    ...Typography.title3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    height: 44,
    gap: Spacing.two,
  },
  searchIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
  },
  chipRow: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
    flexDirection: 'row',
  },
  chip: {
    height: 30,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  list: {
    flex: 1,
    marginHorizontal: Spacing.three,
    borderRadius: BorderRadius.lg,
  },
  listContent: {
    paddingBottom: Spacing.three,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 52,
  },
  exerciseRowInner: {
    flex: 1,
    gap: Spacing.one,
  },
  exerciseName: {
    ...Typography.headline,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
});
