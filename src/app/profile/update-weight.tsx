import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  SmallActionButton,
} from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useBodyweight } from '@/hooks/use-bodyweight';
import { useTheme } from '@/hooks/use-theme';
import type { WeightUnit } from '@/types/bodyweight';

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[month - 1]} ${day}, ${year}`;
}

export default function UpdateWeightScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ entryId?: string; weight?: string; unit?: string }>();

  const isEditing = Boolean(params.entryId);
  const initialWeight = params.weight ?? '';
  const initialUnit: WeightUnit = (params.unit === 'lbs' ? 'lbs' : 'kg');

  const [weightStr, setWeightStr] = useState(initialWeight);
  const [unit, setUnit] = useState<WeightUnit>(initialUnit);
  const [measuredAt] = useState(todayIso());
  const [saving, setSaving] = useState(false);

  const { addEntry, updateEntry } = useBodyweight();

  async function handleSave() {
    const parsed = parseFloat(weightStr);
    if (!weightStr.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight greater than zero.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing && params.entryId) {
        await updateEntry(params.entryId, { weightKg: parsed, unit, measuredAt });
      } else {
        await addEntry({ weightKg: parsed, unit, measuredAt });
      }
      router.back();
    } catch (e) {
      console.error('[UpdateWeightScreen] save error:', e);
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const styles = StyleSheet.create({
    content: {
      gap: Spacing.three,
      paddingBottom: Spacing.five,
    },
    inputLabel: {
      ...Typography.subhead,
      color: theme.textSecondary,
      marginBottom: Spacing.one,
    },
    input: {
      ...Typography.title1,
      color: theme.text,
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
      textAlign: 'center',
    },
    unitRow: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    unitBtn: {
      flex: 1,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    dateLabel: {
      ...Typography.subhead,
      color: theme.textSecondary,
    },
    dateValue: {
      ...Typography.subhead,
      color: theme.text,
    },
  });

  return (
    <ScreenContainer scrollable contentStyle={styles.content}>
      <SmallActionButton label="← Back" onPress={() => router.back()} variant="ghost" />
      <SectionHeader title={isEditing ? 'Edit Weight' : 'Update Weight'} size="large" />

      <View>
        <ThemedText style={styles.inputLabel}>Weight</ThemedText>
        <TextInput
          style={styles.input}
          value={weightStr}
          onChangeText={setWeightStr}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={theme.textTertiary}
          autoFocus={!isEditing}
          returnKeyType="done"
        />
      </View>

      <View>
        <ThemedText style={styles.inputLabel}>Unit</ThemedText>
        <View style={styles.unitRow}>
          <View style={styles.unitBtn}>
            <SmallActionButton
              label="kg"
              onPress={() => setUnit('kg')}
              variant={unit === 'kg' ? 'filled' : 'ghost'}
            />
          </View>
          <View style={styles.unitBtn}>
            <SmallActionButton
              label="lbs"
              onPress={() => setUnit('lbs')}
              variant={unit === 'lbs' ? 'filled' : 'ghost'}
            />
          </View>
        </View>
      </View>

      <View>
        <ThemedText style={styles.inputLabel}>Date</ThemedText>
        {/* TODO: add DateTimePicker when @react-native-community/datetimepicker is installed */}
        <View style={styles.dateRow}>
          <ThemedText style={styles.dateLabel}>Date</ThemedText>
          <ThemedText style={styles.dateValue}>{formatDateDisplay(measuredAt)}</ThemedText>
        </View>
      </View>

      <PrimaryButton
        label="Save"
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        fullWidth
      />
    </ScreenContainer>
  );
}
