import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const HEIGHT: Record<ButtonSize, number> = { sm: 36, md: 48, lg: 56 };

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  size = 'md',
  fullWidth,
}: ButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHT[size], backgroundColor: disabled ? theme.border : theme.accent },
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={[styles.primaryText, textStyles[size]]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
  loading,
  size = 'md',
  fullWidth,
}: ButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles.secondaryBase,
        {
          height: HEIGHT[size],
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          style={[
            styles.secondaryText,
            textStyles[size],
            { color: disabled ? theme.textSecondary : theme.text },
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

type SmallActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'ghost';
  style?: ViewStyle;
};

export function SmallActionButton({
  label,
  onPress,
  variant = 'ghost',
  style,
}: SmallActionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallBase,
        variant === 'filled'
          ? { backgroundColor: theme.accentSubtle }
          : { borderWidth: 1, borderColor: theme.border },
        style,
        pressed && styles.pressed,
      ]}>
      <Text
        style={[
          styles.smallText,
          { color: variant === 'filled' ? theme.accent : theme.textSecondary },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const textStyles = StyleSheet.create({
  sm: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  md: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  lg: { fontSize: 20, fontWeight: '600', lineHeight: 25 },
});

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  secondaryBase: {
    borderWidth: 1,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  smallBase: {
    height: 30,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    alignSelf: 'flex-start',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
