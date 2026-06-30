import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Card, Divider, PrimaryButton } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CoachRecommendation } from '@/types/coach';

type CoachCardProps = {
  recommendations: CoachRecommendation[];
  loading: boolean;
};

export function CoachCard({ recommendations, loading }: CoachCardProps) {
  const theme = useTheme();

  const primary = recommendations[0];
  const secondary = recommendations.slice(1, 3);

  return (
    <Card>
      <Text style={[styles.header, { color: theme.textSecondary }]}>COACH</Text>

      {loading && recommendations.length === 0 ? (
        <Text style={[styles.loading, { color: theme.textSecondary }]}>
          Analyzing your training…
        </Text>
      ) : primary ? (
        <>
          <Text style={[styles.primaryTitle, { color: theme.text }]}>{primary.title}</Text>
          <Text style={[styles.primaryMessage, { color: theme.textSecondary }]}>
            {primary.message}
          </Text>
          {primary.actionLabel && primary.actionRoute && (
            <View style={styles.actionRow}>
              <PrimaryButton
                label={primary.actionLabel}
                onPress={() => router.push(primary.actionRoute as never)}
                size="sm"
              />
            </View>
          )}

          {secondary.map(rec => (
            <View key={rec.id}>
              <Divider style={styles.divider} />
              <Text style={[styles.secondaryTitle, { color: theme.text }]}>{rec.title}</Text>
            </View>
          ))}
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.8,
    marginBottom: Spacing.three,
  },
  loading: {
    ...Typography.footnote,
    paddingBottom: Spacing.one,
  },
  primaryTitle: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  primaryMessage: {
    ...Typography.footnote,
    marginTop: Spacing.one,
  },
  actionRow: {
    marginTop: Spacing.two,
  },
  divider: {
    marginVertical: Spacing.two,
  },
  secondaryTitle: {
    ...Typography.footnote,
    fontWeight: '600',
  },
});
