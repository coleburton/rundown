import { useEffect, useState } from 'react';
import type { ColorSchemeName, PlatformOSType } from 'react-native/types';

export type ColorSchemeContextType = {
  colorScheme: NonNullable<ColorSchemeName>;
  toggleColorScheme: () => void;
};

/**
 * Returns the current color scheme ('light' or 'dark')
 * and updates when the system color scheme changes
 */
export function useColorScheme(): ColorSchemeContextType {
  // Default to 'light' theme
  const [colorScheme, setColorScheme] = useState<NonNullable<ColorSchemeName>>('light');

  useEffect(() => {
    // Only run on native platforms
    const platform: PlatformOSType = require('react-native').Platform.OS;
    if (platform !== 'web') {
      // Need to dynamically import Appearance to avoid issues with web
      const { Appearance } = require('react-native');
      
      // Set initial color scheme
      setColorScheme(Appearance.getColorScheme() || 'light');

      // Listen for color scheme changes
      const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }: { colorScheme: ColorSchemeName }) => {
        setColorScheme(newColorScheme || 'light');
      });

      // Cleanup subscription
      return () => {
        subscription.remove();
      };
    }
  }, []);

  const toggleColorScheme = () => {
    setColorScheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { colorScheme, toggleColorScheme };
} 