import React from 'react';
import { Image, ImageProps, StyleSheet, Text, View } from 'react-native';

interface ServiceLogoProps extends Omit<ImageProps, 'source'> {
  service: string;
  size?: number;
}

// For now, we'll use fallback icons until PNG files are added
// When you add PNG files to assets/images/service-logos/, you can uncomment the SERVICE_LOGOS object below

// Temporarily disable all requires to fix Metro cache issue
const SERVICE_LOGOS: Record<string, any> = {
  // strava: require('@/assets/images/service-logos/strava.png'),
  // apple: require('@/assets/images/service-logos/apple.png'),
  // garmin: require('@/assets/images/service-logos/garmin.png'),
};

// Fallback icons for services
const FALLBACK_ICONS: Record<string, string> = {
  strava: '🏃‍♂️',
  garmin: '⌚',
  apple: '🍎',
  fitbit: '📱',
  google: '🔍',
  spotify: '🎵',
  nike: '👟',
};

export function ServiceLogo({ service, size = 40, style, ...props }: ServiceLogoProps) {
  const logoSource = SERVICE_LOGOS?.[service.toLowerCase()];
  
  if (logoSource) {
    return (
      <Image
        source={logoSource}
        style={[
          styles.logo,
          {
            width: size,
            height: size,
          },
          style,
        ]}
        resizeMode="contain"
        {...props}
      />
    );
  }

  // Use fallback emoji icon
  const fallbackIcon = FALLBACK_ICONS[service.toLowerCase()] || '📱';
  
  return (
    <View
      style={[
        styles.fallbackContainer,
        {
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.6 }}>{fallbackIcon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    borderRadius: 8,
  },
  fallbackContainer: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});