import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WorkoutSet } from './types';

type SetRowProps = {
  set: WorkoutSet;
  displayIndex: string;
  onUpdate: (field: 'weight' | 'reps', value: string) => void;
  onToggle: () => void;
};

export function SetRow({ set, displayIndex, onUpdate, onToggle }: SetRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        set.completed && { backgroundColor: theme.accentSubtle },
      ]}>
      <Text
        style={[
          styles.label,
          { color: set.type === 'warmup' ? theme.textTertiary : theme.textSecondary },
        ]}>
        {displayIndex}
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            flex: 2,
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: set.completed ? theme.accent : theme.border,
          },
        ]}
        value={set.weight}
        onChangeText={v => onUpdate('weight', v)}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={theme.textTertiary}
        selectTextOnFocus
      />

      <Text style={[styles.dividerChar, { color: theme.textTertiary }]}>×</Text>

      <TextInput
        style={[
          styles.input,
          {
            flex: 1,
            color: theme.text,
            backgroundColor: theme.background,
            borderColor: set.completed ? theme.accent : theme.border,
          },
        ]}
        value={set.reps}
        onChangeText={v => onUpdate('reps', v)}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={theme.textTertiary}
        selectTextOnFocus
      />

      <View style={styles.doneHitArea}>
        <Pressable
          onPress={onToggle}
          hitSlop={4}
          style={[
            styles.doneButton,
            set.completed
              ? { backgroundColor: theme.accent }
              : { borderWidth: 2, borderColor: theme.border },
          ]}>
          {set.completed && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: BorderRadius.sm,
  },
  label: {
    width: 28,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  input: {
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
  },
  dividerChar: {
    width: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
  },
  doneHitArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
