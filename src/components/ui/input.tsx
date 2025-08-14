import React from 'react';
import { TextInput, TextInputProps, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { cva, type VariantProps } from "class-variance-authority";
import { FONT_FAMILIES } from '../../constants/Typography';

// Define input variants using CVA like shadcn
const inputVariants = cva(
  // Base styles (common to all variants)
  {},
  {
    variants: {
      variant: {
        default: "default",
        destructive: "destructive",
      },
      size: {
        default: "default",
        sm: "sm",
        lg: "lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 12, // More modern, rounded feel
    backgroundColor: 'transparent',
    fontSize: 14,
    fontFamily: FONT_FAMILIES.regular,
    paddingHorizontal: 16, // More generous horizontal padding
    paddingVertical: 12, // Better vertical spacing
    minHeight: 48, // Taller for better touch target
    textAlignVertical: 'center',
  } as TextStyle,
  
  // Variant styles
  default: {
    borderColor: '#e5e7eb', // gray-200
    color: '#111827', // gray-900
    backgroundColor: '#f9fafb', // Very subtle gray background
  } as ViewStyle,
  
  destructive: {
    borderColor: '#ef4444', // red-500
    color: '#111827', // gray-900
    backgroundColor: 'transparent',
  } as ViewStyle,
  
  // Size styles
  sizeDefault: {
    minHeight: 48,
    fontSize: 14,
    fontFamily: FONT_FAMILIES.regular,
    paddingHorizontal: 16,
    paddingVertical: 12,
  } as TextStyle,
  
  sizeSm: {
    minHeight: 40,
    fontSize: 13,
    fontFamily: FONT_FAMILIES.regular,
    paddingHorizontal: 14,
    paddingVertical: 10,
  } as TextStyle,
  
  sizeLg: {
    minHeight: 56,
    fontSize: 16,
    fontFamily: FONT_FAMILIES.regular,
    paddingHorizontal: 18,
    paddingVertical: 14,
  } as TextStyle,
  
  // Focus styles (will be applied programmatically)
  focused: {
    borderColor: '#f97316', // orange-500
  } as ViewStyle,
  
  focusedDestructive: {
    borderColor: '#ef4444', // red-500
  } as ViewStyle,
  
  // Dark mode styles
  darkDefault: {
    borderColor: '#374151', // gray-700
    color: '#ffffff',
    backgroundColor: 'rgba(55, 65, 81, 0.3)', // gray-700 with opacity
  } as ViewStyle,
  
  darkDestructive: {
    borderColor: '#ef4444', // red-500
    color: '#ffffff',
    backgroundColor: 'rgba(55, 65, 81, 0.3)', // gray-700 with opacity
  } as ViewStyle,
  
  darkFocused: {
    borderColor: '#f97316', // orange-500
  } as ViewStyle,
  
  darkFocusedDestructive: {
    borderColor: '#ef4444', // red-500
  } as ViewStyle,
  
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
});

interface InputProps extends TextInputProps, VariantProps<typeof inputVariants> {
  darkMode?: boolean;
  style?: TextStyle;
  passwordType?: 'new' | 'current' | 'none';
}

export function Input({
  variant = "default",
  size = "default",
  darkMode = false,
  style,
  passwordType = 'none',
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  // Quick fix: Disable iOS autofill for reliable simulator behavior
  const getPasswordProps = () => {
    if (passwordType !== 'none') {
      return {
        textContentType: 'none' as const,
        autoComplete: 'off' as const,
        autoCorrect: false,
        spellCheck: false,
        // Disable iOS password suggestions entirely
        passwordRules: ''
      };
    }
    return {};
  };
  
  const getInputStyle = (): TextStyle[] => {
    const baseStyles = [styles.base];
    
    // Add variant styles
    if (variant === "default") {
      baseStyles.push(darkMode ? styles.darkDefault : styles.default);
    }
    if (variant === "destructive") {
      baseStyles.push(darkMode ? styles.darkDestructive : styles.destructive);
    }
    
    // Add size styles
    if (size === "default") baseStyles.push(styles.sizeDefault);
    if (size === "sm") baseStyles.push(styles.sizeSm);
    if (size === "lg") baseStyles.push(styles.sizeLg);
    
    // Add focus styles
    if (isFocused) {
      if (variant === "default") {
        baseStyles.push(darkMode ? styles.darkFocused : styles.focused);
      }
      if (variant === "destructive") {
        baseStyles.push(darkMode ? styles.darkFocusedDestructive : styles.focusedDestructive);
      }
    }
    
    // Add disabled styles
    if (props.editable === false) {
      baseStyles.push(styles.disabled);
    }
    
    // Add custom styles
    if (style) baseStyles.push(style as TextStyle);
    
    return baseStyles;
  };
  
  const getPlaceholderTextColor = () => {
    if (variant === "destructive") {
      return darkMode ? '#fca5a5' : '#f87171'; // red-300 : red-400
    }
    return darkMode ? '#9ca3af' : '#6b7280'; // gray-400 : gray-500
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TextInput
        style={getInputStyle()}
        onFocus={(e: any) => {
          setIsFocused(true);
          Animated.spring(scaleAnim, {
            toValue: 1.02,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }).start();
          props.onFocus?.(e);
        }}
        onBlur={(e: any) => {
          setIsFocused(false);
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }).start();
          props.onBlur?.(e);
        }}
        placeholderTextColor={getPlaceholderTextColor()}
        {...getPasswordProps()}
        // Additional iOS autofill disabling props
        importantForAutofill="no"
        {...props}
      />
    </Animated.View>
  );
}

export { inputVariants }; 