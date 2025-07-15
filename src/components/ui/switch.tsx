import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { cva, type VariantProps } from "class-variance-authority";

// Define switch variants using CVA like shadcn
const switchVariants = cva(
  // Base styles (common to all variants)
  {},
  {
    variants: {
      size: {
        default: "default",
        sm: "sm",
        lg: "lg",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const styles = StyleSheet.create({
  // Base switch container styles
  switchContainer: {
    borderRadius: 9999, // Fully rounded
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    justifyContent: 'center',
    transition: 'all 0.2s',
  } as ViewStyle,
  
  // Size variants
  sizeDefault: {
    height: 18, // h-[1.15rem] ≈ 18px
    width: 32, // w-8 = 32px
  } as ViewStyle,
  
  sizeSm: {
    height: 16,
    width: 28,
  } as ViewStyle,
  
  sizeLg: {
    height: 20,
    width: 36,
  } as ViewStyle,
  
  // Switch thumb styles
  switchThumb: {
    borderRadius: 9999,
    position: 'absolute',
    transition: 'all 0.2s',
  } as ViewStyle,
  
  thumbDefault: {
    width: 16,
    height: 16,
  } as ViewStyle,
  
  thumbSm: {
    width: 14,
    height: 14,
  } as ViewStyle,
  
  thumbLg: {
    width: 18,
    height: 18,
  } as ViewStyle,
  
  // State styles
  unchecked: {
    backgroundColor: '#e5e7eb', // input/bg-input equivalent
  } as ViewStyle,
  
  checked: {
    backgroundColor: '#f97316', // primary color (orange-500)
  } as ViewStyle,
  
  // Thumb colors
  thumbUnchecked: {
    backgroundColor: '#ffffff', // bg-background
  } as ViewStyle,
  
  thumbChecked: {
    backgroundColor: '#ffffff', // bg-primary-foreground
  } as ViewStyle,
  
  // Dark mode styles
  darkUnchecked: {
    backgroundColor: 'rgba(229, 231, 235, 0.8)', // bg-input/80 equivalent
  } as ViewStyle,
  
  darkChecked: {
    backgroundColor: '#f97316', // primary color stays same
  } as ViewStyle,
  
  darkThumbUnchecked: {
    backgroundColor: '#374151', // dark:bg-foreground
  } as ViewStyle,
  
  darkThumbChecked: {
    backgroundColor: '#ffffff', // dark:bg-primary-foreground
  } as ViewStyle,
  
  // Disabled styles
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
});

interface SwitchProps extends VariantProps<typeof switchVariants> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  darkMode?: boolean;
  style?: ViewStyle;
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  darkMode = false,
  size = "default",
  style,
  ...props
}: SwitchProps) {
  const [animatedValue] = React.useState(new Animated.Value(checked ? 1 : 0));
  
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: checked ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [checked, animatedValue]);
  
  const handlePress = () => {
    if (!disabled) {
      onCheckedChange?.(!checked);
    }
  };
  
  const getSwitchStyle = (): ViewStyle[] => {
    const baseStyles = [styles.switchContainer];
    
    // Add size styles
    if (size === "default") baseStyles.push(styles.sizeDefault);
    if (size === "sm") baseStyles.push(styles.sizeSm);
    if (size === "lg") baseStyles.push(styles.sizeLg);
    
    // Add state styles
    if (checked) {
      baseStyles.push(darkMode ? styles.darkChecked : styles.checked);
    } else {
      baseStyles.push(darkMode ? styles.darkUnchecked : styles.unchecked);
    }
    
    // Add disabled styles
    if (disabled) baseStyles.push(styles.disabled);
    
    // Add custom styles
    if (style) baseStyles.push(style);
    
    return baseStyles;
  };
  
  const getThumbStyle = (): ViewStyle[] => {
    const baseStyles = [styles.switchThumb];
    
    // Add size styles
    if (size === "default") baseStyles.push(styles.thumbDefault);
    if (size === "sm") baseStyles.push(styles.thumbSm);
    if (size === "lg") baseStyles.push(styles.thumbLg);
    
    // Add state styles
    if (checked) {
      baseStyles.push(darkMode ? styles.darkThumbChecked : styles.thumbChecked);
    } else {
      baseStyles.push(darkMode ? styles.darkThumbUnchecked : styles.thumbUnchecked);
    }
    
    return baseStyles;
  };
  
  const getThumbTransform = () => {
    const containerWidth = size === "sm" ? 28 : size === "lg" ? 36 : 32;
    const thumbWidth = size === "sm" ? 14 : size === "lg" ? 18 : 16;
    const maxTranslate = containerWidth - thumbWidth - 2; // -2 for padding
    
    return animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, maxTranslate],
      extrapolate: 'clamp',
    });
  };

  return (
    <TouchableOpacity
      style={getSwitchStyle()}
      onPress={disabled ? undefined : handlePress}
      {...props}
    >
      <Animated.View
        style={[
          getThumbStyle(),
          {
            transform: [
              {
                translateX: getThumbTransform(),
              },
            ],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

export { switchVariants }; 