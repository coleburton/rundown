import { useColorScheme } from './useColorScheme';

type Theme = 'light' | 'dark';

type ColorSchemeOptions = {
  [key in Theme]?: string;
};

type Colors = {
  [key in Theme]: {
    text: string;
    background: string;
    primary: string;
    secondary: string;
    destructive: string;
  }
};

const colors: Colors = {
  light: {
    text: '#000',
    background: '#fff',
    primary: '#f97316',
    secondary: '#84cc16',
    destructive: '#ef4444',
  },
  dark: {
    text: '#fff',
    background: '#000',
    primary: '#f97316',
    secondary: '#84cc16',
    destructive: '#ef4444',
  },
};

export function useThemeColor(
  props: ColorSchemeOptions,
  colorName: keyof Colors['light']
) {
  const { colorScheme } = useColorScheme();
  const theme: Theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return colors[theme][colorName];
} 
