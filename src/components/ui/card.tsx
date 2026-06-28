import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: boolean;
};

export function Card({ children, style, onPress, padding = true }: CardProps) {
  const theme = useTheme();

  const baseStyle = [
    styles.card,
    { backgroundColor: theme.surface },
    padding && styles.padded,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...baseStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  padded: {
    padding: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
});
