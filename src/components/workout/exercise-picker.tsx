import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, IconButton } from '@/components/ui';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useExercises } from '@/hooks/use-exercises';
import { useMuscleGroups } from '@/hooks/use-muscle-groups';
import { useTheme } from '@/hooks/use-theme';
import type { Exercise, MuscleGroup } from '@/types/exercises';

type ExercisePickerProps = {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
};

export function ExercisePicker({ visible, onSelect, onClose }: ExercisePickerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);

  const { muscleGroups } = useMuscleGroups();
  const { exercises, loading } = useExercises({
    query: searchQuery || undefined,
    muscleGroupId: selectedMuscleGroupId ?? undefined,
  });

  function handleSelect(exercise: Exercise) {
    onSelect(exercise);
    onClose();
  }

  function toggleMuscleGroup(id: string) {
    setSelectedMuscleGroupId(prev => (prev === id ? null : id));
  }

  const renderExercise: ListRenderItem<Exercise> = ({ item, index }) => {
    const isLast = index === exercises.length - 1;
    return (
      <>
        <Pressable
          onPress={() => handleSelect(item)}
          style={({ pressed }) => [
            styles.exerciseRow,
            { backgroundColor: pressed ? theme.backgroundSelected : 'transparent' },
          ]}>
          <View style={styles.exerciseRowInner}>
            <Text style={[styles.exerciseName, { color: theme.text }]}>{item.name}</Text>
            <View style={styles.exerciseMeta}>
              {item.primaryMuscleGroup && (
                <Text style={[styles.exerciseSubtext, { color: theme.accent }]}>
                  {item.primaryMuscleGroup.name}
                </Text>
              )}
              {item.category && (
                <Text style={[styles.exerciseSubtext, { color: theme.textSecondary }]}>
                  {item.primaryMuscleGroup ? ' · ' : ''}{item.category.name}
                </Text>
              )}
            </View>
          </View>
          <Text style={[styles.chevron, { color: theme.textTertiary }]}>{'›'}</Text>
        </Pressable>
        {!isLast && (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
      </>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Select Exercise</Text>
          <IconButton
            name="xmark"
            onPress={onClose}
            accessibilityLabel="Close exercise picker"
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
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.three }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  headerTitle: {
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
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    minHeight: 52,
  },
  exerciseRowInner: {
    flex: 1,
    paddingVertical: Spacing.two,
    gap: 2,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 22,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseSubtext: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
    marginLeft: Spacing.two,
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
});
