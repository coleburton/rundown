import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SLIDES = [
  {
    title: "Run from your excuses.",
    subtitle: "Or we'll tell on you.",
    description: "Connect your Strava, pick your accountability buddy, and let us handle the rest. No more broken promises to yourself.",
    icon: require('../../assets/images/partial-react-logo.png'),
  }
];

interface CarouselProps {
  style?: any;
}

export function OnboardingCarousel({ style }: CarouselProps) {
  const insets = useSafeAreaInsets();
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const slide = SLIDES[0]; // We only have one slide

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#F97316', '#EA580C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { opacity: 0.1 }]}
      />
      
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.iconContainer}>
          <Image 
            source={slide.icon}
            style={styles.icon}
            contentFit="contain"
          />
          <View style={styles.dot} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>
      </View>

      <View style={styles.pagination}>
        <View style={[styles.paginationDot, { backgroundColor: '#F97316' }]} />
        <View style={[styles.paginationDot, { backgroundColor: '#84CC16' }]} />
        <View style={[styles.paginationDot, { backgroundColor: '#14B8A6' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: {
    width: 48,
    height: 48,
  },
  dot: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#84CC16',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1F2937',
    lineHeight: 56,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: 24,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    maxWidth: 300,
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}); 