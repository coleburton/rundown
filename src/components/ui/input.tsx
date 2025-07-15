import React from 'react';
import { TextInput, TextInputProps, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { cva, type VariantProps } from "class-variance-authority";

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
    borderRadius: 6,
    backgroundColor: 'transparent',
    fontSize: 14,
    fontWeight: '400',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    textAlignVertical: 'center',
  } as TextStyle,
  
  // Variant styles
  default: {
    borderColor: '#e5e7eb', // gray-200
    color: '#111827', // gray-900
    backgroundColor: 'transparent',
  } as ViewStyle,
  
  destructive: {
    borderColor: '#ef4444', // red-500
    color: '#111827', // gray-900
    backgroundColor: 'transparent',
  } as ViewStyle,
  
  // Size styles
  sizeDefault: {
    minHeight: 36,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  } as TextStyle,
  
  sizeSm: {
    minHeight: 32,
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
  } as TextStyle,
  
  sizeLg: {
    minHeight: 40,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  } as TextStyle,
  
  // Focus styles (will be applied programmatically)
  focused: {
    borderColor: '#f97316', // orange-500
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  } as ViewStyle,
  
  focusedDestructive: {
    borderColor: '#ef4444', // red-500
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
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
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  } as ViewStyle,
  
  darkFocusedDestructive: {
    borderColor: '#ef4444', // red-500
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  } as ViewStyle,
  
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
});

interface InputProps extends TextInputProps, VariantProps<typeof inputVariants> {
  darkMode?: boolean;
  style?: TextStyle;
}

export function Input({
  variant = "default",
  size = "default",
  darkMode = false,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  
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
    <TextInput
      style={getInputStyle()}
      onFocus={(e: any) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e: any) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      placeholderTextColor={getPlaceholderTextColor()}
      {...props}
    />
  );
}

export { inputVariants }; 