import { ThemedText } from '@/components/themed-text';
import { ScreenContainer, SectionHeader } from '@/components/ui';

export default function ProfileScreen() {
  return (
    <ScreenContainer>
      <SectionHeader title="Profile" size="large" />
      <ThemedText type="body" themeColor="textSecondary">
        Your fitness profile and settings
      </ThemedText>
    </ScreenContainer>
  );
}
