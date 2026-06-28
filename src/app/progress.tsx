import { ThemedText } from '@/components/themed-text';
import { ScreenContainer, SectionHeader } from '@/components/ui';

export default function ProgressScreen() {
  return (
    <ScreenContainer>
      <SectionHeader title="Progress" size="large" />
      <ThemedText type="body" themeColor="textSecondary">
        View your strength gains over time
      </ThemedText>
    </ScreenContainer>
  );
}
