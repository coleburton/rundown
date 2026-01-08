import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type GradientColors = readonly [string, string, ...string[]];
type GradientLocations = readonly [number, number, ...number[]];

interface HeaderBlurOverlayProps {
  visible: boolean;
  height: number;
  colors?: GradientColors;
  locations?: GradientLocations;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_COLORS: GradientColors = [
  '#ffffff',
  'rgba(255, 255, 255, 0.95)',
  'rgba(255, 255, 255, 0)',
] as const;

const DEFAULT_LOCATIONS: GradientLocations = [0, 0.7, 1] as const;

export function HeaderBlurOverlay({
  visible,
  height,
  colors = DEFAULT_COLORS,
  locations = DEFAULT_LOCATIONS,
  style,
}: HeaderBlurOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height,
          zIndex: 10,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        locations={locations}
        style={{ flex: 1 }}
      />
    </View>
  );
}
