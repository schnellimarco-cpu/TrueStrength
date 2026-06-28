import 'react-native-url-polyfill/auto';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import MobileFrame from '@/components/mobile-frame';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MobileFrame>
        <AnimatedSplashOverlay />
        <AppTabs />
      </MobileFrame>
    </ThemeProvider>
  );
}
