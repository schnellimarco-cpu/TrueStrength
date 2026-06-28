import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card } from '@/components/ui';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type WorkoutHeaderProps = {
  name: string;
  focus: string;
  duration: string;
};

export function WorkoutHeader({ name, focus, duration }: WorkoutHeaderProps) {
  const theme = useTheme();

  return (
    <Card padding={false}>
      <View style={[styles.strip, { backgroundColor: theme.accent }]} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
          <Badge label={duration} variant="accent" size="sm" />
        </View>
        <Text style={[styles.focus, { color: theme.textSecondary }]}>{focus}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  strip: {
    height: 4,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
  },
  focus: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});
