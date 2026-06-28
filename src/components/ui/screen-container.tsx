import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenContainerProps = {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function ScreenContainer({
  children,
  scrollable = false,
  style,
  contentStyle,
}: ScreenContainerProps) {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }, style]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {scrollable ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={[styles.content, contentStyle]}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
