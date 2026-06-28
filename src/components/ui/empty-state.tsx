import { StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { SmallActionButton } from './button';

type EmptyStateProps = {
  title: string;
  description?: string;
  symbol?: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ title, description, symbol, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {symbol && (
        <SymbolView
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={symbol as any}
          size={48}
          tintColor={theme.textTertiary}
          style={styles.icon}
        />
      )}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {description}
        </Text>
      )}
      {action && (
        <View style={styles.actionContainer}>
          <SmallActionButton
            label={action.label}
            onPress={action.onPress}
            variant="filled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  icon: {
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: Spacing.one,
  },
});
