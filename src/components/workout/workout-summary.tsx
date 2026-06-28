import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Card, Divider, PrimaryButton, SecondaryButton } from '@/components/ui';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DebugInfo } from '@/lib/workout-service';
import type { WorkoutExercise } from './types';

export type SaveStatus = 'saving' | 'saved' | 'error';

type WorkoutSummaryProps = {
  visible: boolean;
  exercises: WorkoutExercise[];
  workoutName: string;
  saveStatus: SaveStatus;
  debugInfo?: DebugInfo;
  onDone: () => void;
  onRetry: () => void;
};

export function WorkoutSummary({
  visible,
  exercises,
  workoutName,
  saveStatus,
  debugInfo,
  onDone,
  onRetry,
}: WorkoutSummaryProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const completedWorkingSets = exercises.flatMap(ex =>
    ex.sets.filter(s => s.completed && s.type === 'working')
  );
  const completedExercises = exercises.filter(ex => ex.sets.some(s => s.completed));
  const totalVolume = completedWorkingSets.reduce(
    (sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps, 10) || 0),
    0
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.five },
          ]}
          showsVerticalScrollIndicator={false}>

          {/* Saving spinner */}
          {saveStatus === 'saving' && (
            <View style={[styles.savingRow, { backgroundColor: theme.surface }]}>
              <ActivityIndicator size="small" color={theme.accent} />
              <Text style={[styles.savingText, { color: theme.textSecondary }]}>
                Saving workout…
              </Text>
            </View>
          )}

          {/* Error card with full debug output */}
          {saveStatus === 'error' && (
            <Card style={styles.errorCard}>
              <Text style={[styles.errorTitle, { color: theme.error }]}>Save Failed</Text>
              {debugInfo && (
                <View style={[styles.debugBlock, { backgroundColor: theme.background }]}>
                  <Text style={[styles.debugLine, { color: theme.textSecondary }]}>
                    URL loaded: {debugInfo.urlLoaded ? '✓' : '✗'}{'  '}
                    Key loaded: {debugInfo.keyLoaded ? '✓' : '✗'}
                  </Text>
                  <Text style={[styles.debugLine, { color: theme.textSecondary }]}>
                    User: {debugInfo.userId ?? 'none'}
                  </Text>
                  {debugInfo.step && (
                    <Text style={[styles.debugLine, { color: theme.textSecondary }]}>
                      Step: {debugInfo.step}
                    </Text>
                  )}
                  {debugInfo.authError && (
                    <Text style={[styles.debugLine, { color: theme.error }]}>
                      Auth: {debugInfo.authError}
                    </Text>
                  )}
                  {debugInfo.dbError && (
                    <Text style={[styles.debugLine, { color: theme.error }]}>
                      Error: {debugInfo.dbError}
                    </Text>
                  )}
                  {debugInfo.dbCode && (
                    <Text style={[styles.debugLine, { color: theme.textTertiary }]}>
                      Code: {debugInfo.dbCode}
                    </Text>
                  )}
                  {debugInfo.dbDetails && (
                    <Text style={[styles.debugLine, { color: theme.textTertiary }]}>
                      Details: {debugInfo.dbDetails}
                    </Text>
                  )}
                  {debugInfo.dbHint && (
                    <Text style={[styles.debugLine, { color: theme.textTertiary }]}>
                      Hint: {debugInfo.dbHint}
                    </Text>
                  )}
                </View>
              )}
              <SecondaryButton label="Retry" onPress={onRetry} size="sm" />
            </Card>
          )}

          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>Workout Complete</Text>
            {saveStatus === 'saved' && (
              <Badge label="Saved" variant="success" size="sm" />
            )}
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{workoutName}</Text>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: theme.surface }]}>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: theme.accent }]}>
                {completedExercises.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Exercises</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: theme.accent }]}>
                {completedWorkingSets.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sets</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: theme.accent }]}>
                {Math.round(totalVolume)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>kg Volume</Text>
            </View>
          </View>

          <Divider style={{ marginVertical: Spacing.three }} />

          {completedExercises.length > 0 ? (
            <View style={styles.exerciseList}>
              {completedExercises.map(ex => {
                const doneSets = ex.sets.filter(s => s.completed && s.type === 'working').length;
                return (
                  <View key={ex.id} style={styles.exerciseRow}>
                    <Text style={[styles.checkIcon, { color: theme.success }]}>✓</Text>
                    <Text style={[styles.exerciseName, { color: theme.text }]}>{ex.name}</Text>
                    <Text style={[styles.exerciseSets, { color: theme.textSecondary }]}>
                      {doneSets} {doneSets === 1 ? 'set' : 'sets'}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.noSets, { color: theme.textTertiary }]}>
              No sets completed yet.
            </Text>
          )}

          <Card style={styles.scorePlaceholderCard}>
            <Text style={[styles.scorePlaceholder, { color: theme.textSecondary }]}>
              Strength Score calculation will be added later.
            </Text>
          </Card>

          <PrimaryButton
            label="Done"
            onPress={onDone}
            fullWidth
            disabled={saveStatus === 'saving'}
          />
        </ScrollView>
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
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
  },
  savingText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  errorCard: {
    gap: Spacing.two,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  debugBlock: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.two,
    gap: 2,
  },
  debugLine: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  statDivider: {
    width: 1,
    marginVertical: Spacing.one,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
    letterSpacing: 0.4,
  },
  exerciseList: {
    gap: Spacing.two,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  exerciseSets: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  noSets: {
    fontSize: 15,
    textAlign: 'center',
  },
  scorePlaceholderCard: {},
  scorePlaceholder: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    textAlign: 'center',
  },
});
