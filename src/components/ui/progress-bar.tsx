import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  animated?: boolean;
};

export function ProgressBar({
  progress,
  height = 6,
  color,
  trackColor,
  animated = true,
}: ProgressBarProps) {
  const theme = useTheme();
  const fillColor = color ?? theme.accent;
  const fill = useSharedValue(animated ? 0 : progress);

  useEffect(() => {
    const clamped = Math.min(1, Math.max(0, progress));
    if (animated) {
      fill.value = withTiming(clamped, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      fill.value = clamped;
    }
  }, [progress, animated, fill]);

  const animatedStyle = useAnimatedStyle(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    width: (`${fill.value * 100}%`) as any,
  }));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor ?? theme.border,
          borderRadius: height / 2,
        },
      ]}>
      <Animated.View
        style={[
          styles.fill,
          animatedStyle,
          { backgroundColor: fillColor, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});
