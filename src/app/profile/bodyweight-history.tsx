import { useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import {
  EmptyState,
  IconButton,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
} from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useBodyweight } from '@/hooks/use-bodyweight';
import { useTheme } from '@/hooks/use-theme';
import type { BodyweightEntry } from '@/types/bodyweight';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function weightDisplay(entry: BodyweightEntry): string {
  const w = entry.weightKg % 1 === 0
    ? entry.weightKg.toFixed(0)
    : entry.weightKg.toFixed(1);
  return `${w} ${entry.unit}`;
}

export default function BodyweightHistoryScreen() {
  const theme = useTheme();
  const { history, deleteEntry, refresh } = useBodyweight();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  function handleDelete(entry: BodyweightEntry) {
    Alert.alert(
      'Delete Entry',
      `Remove ${weightDisplay(entry)} from ${formatDate(entry.measuredAt)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entry.id);
            } catch {
              Alert.alert('Error', 'Could not delete entry. Please try again.');
            }
          },
        },
      ]
    );
  }

  const styles = StyleSheet.create({
    content: {
      gap: Spacing.two,
      paddingBottom: Spacing.five,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    rowLeft: {
      flex: 1,
    },
    weightText: {
      ...Typography.headline,
      color: theme.text,
    },
    dateText: {
      ...Typography.footnote,
      color: theme.textSecondary,
      marginTop: 2,
    },
  });

  return (
    <ScreenContainer scrollable contentStyle={styles.content}>
      <SectionHeader title="Weight History" size="large" />

      {history.length === 0 ? (
        <EmptyState
          title="No entries yet"
          description="Log your first bodyweight measurement to start tracking."
        />
      ) : (
        history.map(entry => (
          <View key={entry.id} style={styles.row}>
            <ThemedText
              style={styles.rowLeft}
              onPress={() =>
                router.push(
                  `/profile/update-weight?entryId=${entry.id}&weight=${entry.weightKg}&unit=${entry.unit}`
                )
              }
            >
              <ThemedText style={styles.weightText}>{weightDisplay(entry)}{'\n'}</ThemedText>
              <ThemedText style={styles.dateText}>{formatDate(entry.measuredAt)}</ThemedText>
            </ThemedText>
            <IconButton
              name="trash"
              onPress={() => handleDelete(entry)}
              color={theme.error}
              accessibilityLabel="Delete entry"
            />
          </View>
        ))
      )}

      <PrimaryButton
        label="Add Entry"
        onPress={() => router.push('/profile/update-weight')}
        fullWidth
      />
    </ScreenContainer>
  );
}
