import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import {
  Card,
  EmptyState,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  SectionHeader,
} from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useBodyweight } from '@/hooks/use-bodyweight';
import { useTheme } from '@/hooks/use-theme';

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { currentWeight, history, refresh } = useBodyweight();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const trend = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    const recent = history.filter(e => new Date(e.measuredAt).getTime() >= cutoff);
    if (recent.length < 2) return null;
    const delta = recent[0].weightKg - recent[recent.length - 1].weightKg;
    const sign = delta >= 0 ? '▲ +' : '▼ ';
    return `${sign}${Math.abs(delta).toFixed(1)} kg this month`;
  }, [history]);

  const styles = StyleSheet.create({
    content: {
      gap: Spacing.three,
      paddingBottom: Spacing.five,
    },
    weightValue: {
      ...Typography.title1,
      color: theme.text,
    },
    weightUnit: {
      ...Typography.title3,
      color: theme.textSecondary,
    },
    weightRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.one,
    },
    trendText: {
      ...Typography.subhead,
      color: theme.accent,
      marginTop: Spacing.one,
    },
    lastUpdated: {
      ...Typography.footnote,
      color: theme.textSecondary,
      marginTop: Spacing.one,
    },
    buttonRow: {
      gap: Spacing.two,
    },
  });

  return (
    <ScreenContainer scrollable contentStyle={styles.content}>
      <SectionHeader title="Profile" size="large" />

      <SectionHeader title="Body" />

      {currentWeight ? (
        <Card>
          <View style={styles.weightRow}>
            <ThemedText style={styles.weightValue}>
              {currentWeight.weightKg % 1 === 0
                ? currentWeight.weightKg.toFixed(0)
                : currentWeight.weightKg.toFixed(1)}
            </ThemedText>
            <ThemedText style={styles.weightUnit}>{currentWeight.unit}</ThemedText>
          </View>
          <ThemedText style={styles.lastUpdated}>
            Last updated: {relativeDate(currentWeight.measuredAt)}
          </ThemedText>
          {trend ? (
            <ThemedText style={styles.trendText}>{trend}</ThemedText>
          ) : null}
        </Card>
      ) : (
        <EmptyState
          title="No weight data"
          description="Log your bodyweight to track progress over time."
        />
      )}

      <View style={styles.buttonRow}>
        <PrimaryButton
          label="Update Weight"
          onPress={() => router.push('/profile/update-weight')}
          fullWidth
        />
        {history.length > 0 ? (
          <SecondaryButton
            label="View History"
            onPress={() => router.push('/profile/bodyweight-history')}
            fullWidth
          />
        ) : null}
      </View>
    </ScreenContainer>
  );
}
