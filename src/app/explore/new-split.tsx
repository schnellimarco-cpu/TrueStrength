import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { IconButton, PrimaryButton, ScreenContainer } from '@/components/ui';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useSplits } from '@/hooks/use-splits';
import { setActiveSplit } from '@/lib/split-service';
import { getOrCreateSession } from '@/lib/auth';
import { useTheme } from '@/hooks/use-theme';
import type { SplitType } from '@/types/splits';

type Template = {
  type: SplitType;
  label: string;
  description: string;
  defaultName: string;
  defaultWorkoutsPerWeek: number;
};

const TEMPLATES: Template[] = [
  {
    type: 'push_pull_legs',
    label: 'Push / Pull / Legs',
    description: '3 days — Push, Pull, Leg Day',
    defaultName: 'Push / Pull / Legs',
    defaultWorkoutsPerWeek: 6,
  },
  {
    type: 'upper_lower',
    label: 'Upper / Lower',
    description: '2 days — Upper and Lower Body',
    defaultName: 'Upper / Lower',
    defaultWorkoutsPerWeek: 4,
  },
  {
    type: 'full_body',
    label: 'Full Body',
    description: '1 day — Full Body workout',
    defaultName: 'Full Body',
    defaultWorkoutsPerWeek: 3,
  },
  {
    type: 'custom',
    label: 'Custom',
    description: 'Build your own split from scratch',
    defaultName: 'My Split',
    defaultWorkoutsPerWeek: 3,
  },
];

export default function NewSplitScreen() {
  const theme = useTheme();
  const { createSplit } = useSplits();

  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [name, setName] = useState(TEMPLATES[0].defaultName);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(TEMPLATES[0].defaultWorkoutsPerWeek);
  const [setAsActive, setSetAsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function handleSelectTemplate(template: Template) {
    setSelectedTemplate(template);
    setName(template.defaultName);
    setWorkoutsPerWeek(template.defaultWorkoutsPerWeek);
  }

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for your split.');
      return;
    }

    setSaving(true);
    try {
      const split = await createSplit({
        name: name.trim(),
        type: selectedTemplate.type,
        workoutsPerWeek,
      });

      if (setAsActive) {
        const userId = await getOrCreateSession();
        if (userId) {
          await setActiveSplit(userId, split.id);
        }
      }

      router.push(`/explore/split-editor?id=${split.id}`);
    } catch (e) {
      console.error('[NewSplitScreen] create error:', e);
      Alert.alert('Error', 'Could not create split. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer scrollable contentStyle={{ gap: Spacing.four, paddingBottom: Spacing.five }}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton
          name="chevron.left"
          onPress={() => router.back()}
          accessibilityLabel="Back"
        />
      </View>

      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>New Training Split</Text>
        <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
          Choose a template to get started.
        </Text>
      </View>

      {/* Template selection */}
      <View style={styles.templateList}>
        {TEMPLATES.map(template => {
          const isSelected = selectedTemplate.type === template.type;
          return (
            <Pressable
              key={template.type}
              onPress={() => handleSelectTemplate(template)}
              style={[
                styles.templateCard,
                {
                  backgroundColor: isSelected ? theme.accentSubtle : theme.surface,
                  borderColor: isSelected ? theme.accent : theme.border,
                },
              ]}>
              <Text style={[styles.templateLabel, { color: isSelected ? theme.accent : theme.text }]}>
                {template.label}
              </Text>
              <Text style={[styles.templateDesc, { color: theme.textSecondary }]}>
                {template.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Name */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>SPLIT NAME</Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder="e.g. My Push Pull Legs"
          placeholderTextColor={theme.textTertiary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      {/* Frequency stepper */}
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>WORKOUTS / WEEK</Text>
        <View style={[styles.stepperRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            onPress={() => setWorkoutsPerWeek(prev => Math.max(1, prev - 1))}
            style={[styles.stepperBtn, { borderColor: theme.border }]}>
            <Text style={[styles.stepperBtnLabel, { color: theme.text }]}>−</Text>
          </Pressable>
          <Text style={[styles.stepperValue, { color: theme.text }]}>{workoutsPerWeek}</Text>
          <Pressable
            onPress={() => setWorkoutsPerWeek(prev => Math.min(7, prev + 1))}
            style={[styles.stepperBtn, { borderColor: theme.border }]}>
            <Text style={[styles.stepperBtnLabel, { color: theme.text }]}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Set as active toggle */}
      <Pressable
        onPress={() => setSetAsActive(prev => !prev)}
        style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>Set as active split</Text>
        <View
          style={[
            styles.toggleTrack,
            { backgroundColor: setAsActive ? theme.accent : theme.border },
          ]}>
          <View
            style={[
              styles.toggleThumb,
              { transform: [{ translateX: setAsActive ? 20 : 2 }] },
            ]}
          />
        </View>
      </Pressable>

      <PrimaryButton
        label="Create Split"
        onPress={handleCreate}
        loading={saving}
        disabled={saving}
        fullWidth
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: Spacing.two,
  },
  pageHeader: {
    gap: Spacing.one,
  },
  pageTitle: {
    ...Typography.title1,
  },
  pageSubtitle: {
    ...Typography.body,
  },
  templateList: {
    gap: Spacing.two,
  },
  templateCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  templateLabel: {
    ...Typography.headline,
  },
  templateDesc: {
    ...Typography.footnote,
  },
  field: {
    gap: Spacing.two,
  },
  fieldLabel: {
    ...Typography.label,
    letterSpacing: 0.5,
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 17,
    lineHeight: 22,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    height: 48,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderLeftWidth: 1,
  },
  stepperBtnLabel: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 28,
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  toggleLabel: {
    ...Typography.body,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
  },
});
