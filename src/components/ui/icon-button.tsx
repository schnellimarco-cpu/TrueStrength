import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  name: string;
  onPress: () => void;
  size?: number;
  color?: string;
  accessibilityLabel: string;
  style?: ViewStyle;
};

export function IconButton({
  name,
  onPress,
  size = 22,
  color,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const iconColor = color ?? theme.textSecondary;
  const touchSize = size + 16;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        { width: touchSize, height: touchSize },
        pressed && styles.pressed,
        style,
      ]}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <SymbolView name={name as any} size={size} tintColor={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
