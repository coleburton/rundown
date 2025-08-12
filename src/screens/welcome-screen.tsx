import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenTracker from '@/lib/ScreenTracker';
import analytics, { ANALYTICS_EVENTS } from '@/lib/analytics';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';

type RootStackParamList = {
  Welcome: undefined;
  Dashboard: undefined;
  FitnessAppConnect: undefined;
  WhyAccountability: undefined;
  GoalSetup: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    position: 'relative',
  } as ViewStyle,
  
  lightContainer: {
    backgroundColor: '#ffffff',
  } as ViewStyle,
  
  darkContainer: {
    backgroundColor: '#111827', // gray-900
  } as ViewStyle,
  
  // Header with dark mode toggle
  headerContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 10,
  } as ViewStyle,
  
  darkModeToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6', // gray-100
  } as ViewStyle,
  
  darkModeToggleDark: {
    backgroundColor: '#374151', // gray-700
  } as ViewStyle,
  
  // Hero section
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  } as ViewStyle,
  
  // Logo/Icon
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  } as ViewStyle,
  
  logoMain: {
    width: 96, // w-24 = 96px
    height: 96, // h-24 = 96px
    borderRadius: 24, // rounded-3xl
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
  
  logoGradient: {
    backgroundColor: '#f97316', // orange-500 base, gradient will be simulated
  } as ViewStyle,
  
  logoIcon: {
    fontSize: 48, // w-12 h-12 equivalent
    color: '#ffffff',
  } as TextStyle,
  
  logoPulse: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    backgroundColor: '#84cc16', // lime-400
    borderRadius: 12,
  } as ViewStyle,
  
  // Text content
  textContainer: {
    marginBottom: 32,
    alignItems: 'center',
  } as ViewStyle,
  
  mainHeadline: {
    fontSize: 36, // text-4xl
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  } as TextStyle,
  
  mainHeadlineLight: {
    color: '#111827', // gray-900
  } as TextStyle,
  
  mainHeadlineDark: {
    color: '#ffffff',
  } as TextStyle,
  
  subHeadline: {
    fontSize: 20, // text-xl
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  } as TextStyle,
  
  subHeadlineLight: {
    color: '#4b5563', // gray-600
  } as TextStyle,
  
  subHeadlineDark: {
    color: '#d1d5db', // gray-300
  } as TextStyle,
  
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    marginBottom: 32,
  } as TextStyle,
  
  descriptionLight: {
    color: '#6b7280', // gray-500
  } as TextStyle,
  
  descriptionDark: {
    color: '#9ca3af', // gray-400
  } as TextStyle,
  
  // Animated dots
  animatedDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 48,
  } as ViewStyle,
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  } as ViewStyle,
  
  dotOrange: {
    backgroundColor: '#f97316', // orange-500
  } as ViewStyle,
  
  dotLime: {
    backgroundColor: '#84cc16', // lime-500
  } as ViewStyle,
  
  dotTeal: {
    backgroundColor: '#14b8a6', // teal-500
  } as ViewStyle,
  
  
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  
  footerTextLight: {
    color: '#9ca3af', // gray-400
  } as TextStyle,
  
  footerTextDark: {
    color: '#6b7280', // gray-500
  } as TextStyle,
});

export function WelcomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDarkMode = colorScheme === 'dark';
  
  // Animated values for the pulsing dots
  const [dot1Anim] = React.useState(new Animated.Value(0.6));
  const [dot2Anim] = React.useState(new Animated.Value(0.6));
  const [dot3Anim] = React.useState(new Animated.Value(0.6));
  const [pulseAnim] = React.useState(new Animated.Value(1));
  
  React.useEffect(() => {
    // Animate the dots
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1Anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2Anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3Anim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot1Anim, { toValue: 0.6, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2Anim, { toValue: 0.6, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3Anim, { toValue: 0.6, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        // Repeat the animation
        setTimeout(animateDots, 1000);
      });
    };
    
    // Animate the logo pulse
    const animatePulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(animatePulse, 500);
      });
    };
    
    animateDots();
    animatePulse();
  }, [dot1Anim, dot2Anim, dot3Anim, pulseAnim]);

  const handleStart = async () => {
    try {
      // Track the start button click
      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'start_onboarding',
        screen: 'Welcome'
      });
      
      // User is already authenticated from login screen, proceed to onboarding
      console.log('Welcome screen - User is authenticated:', user?.id);
      
      // Track onboarding start
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_STARTED, {
        user_id: user?.id,
        screen: 'Welcome'
      });
      
      navigation.navigate('WhyAccountability');
    } catch (error) {
      console.error('Failed to start onboarding:', error);
    }
  };

  return (
    <View 
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer,
        { paddingTop: insets.top }
      ]}
    >
      {/* Track screen view */}
      <ScreenTracker screenName="Welcome" />
      
      {/* Dark mode toggle */}
      <View style={styles.headerContainer}>
        <Button
          variant="ghost"
          size="icon"
          onPress={() => {
            toggleColorScheme();
            // Track theme toggle
            analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
              button_name: 'theme_toggle',
              new_theme: isDarkMode ? 'light' : 'dark',
              screen: 'Welcome'
            });
          }}
          style={[
            styles.darkModeToggle,
            isDarkMode && styles.darkModeToggleDark
          ]}
        >
          <Text style={{ fontSize: 20 }}>
            {isDarkMode ? '☀️' : '🌙'}
          </Text>
        </Button>
      </View>

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoMain, styles.logoGradient]}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Animated.View 
            style={[
              styles.logoPulse,
              { 
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [1, 0.7],
                }),
              }
            ]} 
          />
        </View>

        {/* App Name Lockup */}
        <Text style={[
          {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 8,
            textAlign: 'center',
          },
          isDarkMode ? { color: '#ffffff' } : { color: '#111827' }
        ]}>
          Rundown
        </Text>

        {/* Main Text */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.mainHeadline,
            isDarkMode ? styles.mainHeadlineDark : styles.mainHeadlineLight
          ]}>
            Run from your excuses.
          </Text>
          
          <Text style={[
            styles.subHeadline,
            isDarkMode ? styles.subHeadlineDark : styles.subHeadlineLight
          ]}>
            Built for runners who mean it.
          </Text>
          
          <Text style={[
            styles.description,
            isDarkMode ? styles.descriptionDark : styles.descriptionLight
          ]}>
            Connect your Strava, choose a buddy, and hit your goals with zero excuses. We'll keep you honest — so you can stay proud.
          </Text>
        </View>

        {/* Animated Dots */}
        <View style={styles.animatedDots}>
          <Animated.View 
            style={[
              styles.dot, 
              styles.dotOrange,
              { opacity: dot1Anim, transform: [{ scale: dot1Anim }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot, 
              styles.dotLime,
              { opacity: dot2Anim, transform: [{ scale: dot2Anim }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot, 
              styles.dotTeal,
              { opacity: dot3Anim, transform: [{ scale: dot3Anim }] }
            ]} 
          />
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleStart}
          variant="default"
          size="lg"
          style={ONBOARDING_BUTTON_STYLE}
          title="Fine, Let's Do This"
          darkMode={isDarkMode}
        />

        <Text style={[
          styles.footerText,
          isDarkMode ? styles.footerTextDark : styles.footerTextLight
        ]}>
          Takes 2 minutes. Your future self will thank you.
        </Text>
      </View>
    </View>
  );
} 