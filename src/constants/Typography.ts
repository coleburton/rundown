import { TextStyle } from 'react-native';

// Inter font family constants with system font fallbacks
export const FONT_FAMILIES = {
  regular: 'Inter',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
} as const;

// Typography styles using Inter font
export const TYPOGRAPHY_STYLES = {
  // Headings
  h1: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,
  
  h2: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  } as TextStyle,
  
  h3: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.25,
  } as TextStyle,
  
  h4: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 20,
    lineHeight: 28,
  } as TextStyle,
  
  h5: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 18,
    lineHeight: 26,
  } as TextStyle,
  
  h6: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  
  // Body text
  body1: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  
  body2: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  
  body1Medium: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  
  body2Medium: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  
  // Small text
  caption1: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  
  caption2: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
    lineHeight: 14,
  } as TextStyle,
  
  caption1Medium: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  
  // Button text
  buttonLarge: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  
  buttonMedium: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  
  buttonSmall: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
} as const;

// Helper function to get font family based on weight
export const getFontFamily = (weight: 'regular' | 'medium' | 'semiBold' = 'regular') => {
  return FONT_FAMILIES[weight];
};

// Helper function to create text style with Inter font
export const createTextStyle = (
  fontSize: number,
  weight: 'regular' | 'medium' | 'semiBold' = 'regular',
  lineHeight?: number,
  letterSpacing?: number
): TextStyle => ({
  fontFamily: getFontFamily(weight),
  fontSize,
  lineHeight: lineHeight || fontSize * 1.5,
  letterSpacing,
});