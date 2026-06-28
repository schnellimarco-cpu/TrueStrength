import { StyleSheet, Text, View } from 'react-native';

import { SmallActionButton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type QuickActionsProps = {
  onStartWorkout: () => void;
  onLogWeight: () => void;
  onViewProgress: () => void;
};

export function QuickActions({ onStartWorkout, onLogWeight, onViewProgress }: QuickActionsProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>QUICK ACTIONS</Text>
      <View style={styles.buttonsRow}>
        <SmallActionButton
          label="Start Workout"
          onPress={onStartWorkout}
          variant="filled"
          style={styles.button}
        />
        <SmallActionButton
          label="Log Weight"
          onPress={onLogWeight}
          variant="filled"
          style={styles.button}
        />
        <SmallActionButton
          label="View Progress"
          onPress={onViewProgress}
          variant="filled"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
