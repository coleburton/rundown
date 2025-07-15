import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { cva, type VariantProps } from "class-variance-authority";

// Define button variants using CVA like shadcn
const buttonVariants = cva(
  // Base styles (common to all variants)
  {},
  {
    variants: {
      variant: {
        default: "default",
        destructive: "destructive", 
        outline: "outline",
        secondary: "secondary",
        ghost: "ghost",
        link: "link",
      },
      size: {
        default: "default",
        sm: "sm",
        lg: "lg", 
        icon: "icon",
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    transition: 'all 0.2s',
  } as ViewStyle,
  
  // Variant styles
  default: {
    backgroundColor: '#f97316', // orange-500
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  
  destructive: {
    backgroundColor: '#ef4444', // red-500
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  } as ViewStyle,
  
  secondary: {
    backgroundColor: '#f3f4f6', // gray-100
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  } as ViewStyle,
  
  ghost: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  
  link: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  
  // Size styles
  sizeDefault: {
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
  } as ViewStyle,
  
  sizeSm: {
    height: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  } as ViewStyle,
  
  sizeLg: {
    height: 40,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  } as ViewStyle,
  
  sizeIcon: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
  } as ViewStyle,
  
  // Text styles
  textBase: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  } as TextStyle,
  
  textDefault: {
    color: '#ffffff',
  } as TextStyle,
  
  textDestructive: {
    color: '#ffffff',
  } as TextStyle,
  
  textOutline: {
    color: '#374151', // gray-700
  } as TextStyle,
  
  textSecondary: {
    color: '#374151', // gray-700
  } as TextStyle,
  
  textGhost: {
    color: '#374151', // gray-700
  } as TextStyle,
  
  textLink: {
    color: '#f97316', // orange-500
    textDecorationLine: 'underline',
  } as TextStyle,
  
  textSm: {
    fontSize: 13,
  } as TextStyle,
  
  textLg: {
    fontSize: 16,
  } as TextStyle,
  
  // Dark mode styles
  darkOutline: {
    backgroundColor: 'rgba(55, 65, 81, 0.3)', // gray-700 with opacity
    borderColor: '#374151', // gray-700
  } as ViewStyle,
  
  darkSecondary: {
    backgroundColor: '#374151', // gray-700
  } as ViewStyle,
  
  darkTextOutline: {
    color: '#ffffff',
  } as TextStyle,
  
  darkTextSecondary: {
    color: '#ffffff',
  } as TextStyle,
  
  darkTextGhost: {
    color: '#ffffff',
  } as TextStyle,
  
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
});

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onPress?: () => void;
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  darkMode?: boolean;
}

export function Button({
  onPress,
  title,
  children,
  variant = "default",
  size = "default",
  style,
  textStyle,
  disabled = false,
  darkMode = false,
  ...props
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyles = [styles.base];
    
    // Add variant styles
    if (variant === "default") baseStyles.push(styles.default);
    if (variant === "destructive") baseStyles.push(styles.destructive);
    if (variant === "outline") baseStyles.push(darkMode ? styles.darkOutline : styles.outline);
    if (variant === "secondary") baseStyles.push(darkMode ? styles.darkSecondary : styles.secondary);
    if (variant === "ghost") baseStyles.push(styles.ghost);
    if (variant === "link") baseStyles.push(styles.link);
    
    // Add size styles
    if (size === "default") baseStyles.push(styles.sizeDefault);
    if (size === "sm") baseStyles.push(styles.sizeSm);
    if (size === "lg") baseStyles.push(styles.sizeLg);
    if (size === "icon") baseStyles.push(styles.sizeIcon);
    
    // Add disabled styles
    if (disabled) baseStyles.push(styles.disabled);
    
    // Add custom styles
    if (style) baseStyles.push(style);
    
    return baseStyles;
  };
  
  const getTextStyle = (): TextStyle[] => {
    const baseStyles = [styles.textBase];
    
    // Add variant text styles
    if (variant === "default") baseStyles.push(styles.textDefault);
    if (variant === "destructive") baseStyles.push(styles.textDestructive);
    if (variant === "outline") baseStyles.push(darkMode ? styles.darkTextOutline : styles.textOutline);
    if (variant === "secondary") baseStyles.push(darkMode ? styles.darkTextSecondary : styles.textSecondary);
    if (variant === "ghost") baseStyles.push(darkMode ? styles.darkTextGhost : styles.textGhost);
    if (variant === "link") baseStyles.push(styles.textLink);
    
    // Add size text styles
    if (size === "sm") baseStyles.push(styles.textSm);
    if (size === "lg") baseStyles.push(styles.textLg);
    
    // Add custom text styles
    if (textStyle) baseStyles.push(textStyle);
    
    return baseStyles;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      {...props}
    >
      {children || (title && <Text style={getTextStyle()}>{title}</Text>)}
    </TouchableOpacity>
  );
}

export { buttonVariants }; 