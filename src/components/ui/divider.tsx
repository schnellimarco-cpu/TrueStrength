import { StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type DividerProps = {
  style?: ViewStyle;
  color?: string;
  inset?: number;
};

export function Divider({ style, color, inset = 0 }: DividerProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color ?? theme.border,
          marginLeft: inset,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
