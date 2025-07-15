import React from 'react';
import { Text, TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ThemedTextProps extends TextProps {
  lightColor?: string;
  darkColor?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button';
}

const variantStyles = {
  h1: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  button: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
};

export function ThemedText(props: ThemedTextProps) {
  const { style, lightColor, darkColor, variant = 'body', ...otherProps } = props;
  const color = useThemeColor(
    { 
      light: lightColor || '#1F2937',
      dark: darkColor || '#FFFFFF',
    },
    'text'
  );

  return (
    <Text
      style={[
        variantStyles[variant],
        { color },
        style,
      ]}
      {...otherProps}
    />
  );
} 