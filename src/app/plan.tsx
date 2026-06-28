import { ThemedText } from '@/components/themed-text';
import { ScreenContainer, SectionHeader } from '@/components/ui';

export default function PlanScreen() {
  return (
    <ScreenContainer>
      <SectionHeader title="Plan" size="large" />
      <ThemedText type="body" themeColor="textSecondary">
        Your personalized training plan
      </ThemedText>
    </ScreenContainer>
  );
}
