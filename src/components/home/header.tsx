import { StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HomeHeaderProps = {
  name: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function HomeHeader({ name }: HomeHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.textStack}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</Text>
        <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>{getFormattedDate()}</Text>
      </View>
      <View style={[styles.avatar, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
        <Text style={[styles.avatarText, { color: theme.accent }]}>{name[0]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  textStack: {
    gap: Spacing.half,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  date: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
});
