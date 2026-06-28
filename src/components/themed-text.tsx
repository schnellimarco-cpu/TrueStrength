import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code'
    | 'largeTitle'
    | 'heading'
    | 'body'
    | 'footnote'
    | 'caption'
    | 'label';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        type === 'largeTitle' && styles.largeTitle,
        type === 'heading' && styles.heading,
        type === 'body' && styles.body,
        type === 'footnote' && styles.footnote,
        type === 'caption' && styles.caption,
        type === 'label' && styles.label,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // — existing variants (unchanged) —
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  title: {
    fontSize: 48,
    fontWeight: '600',
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '600',
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts?.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
  // — new HIG-aligned variants —
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
  },
});
