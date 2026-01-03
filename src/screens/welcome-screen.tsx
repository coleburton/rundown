import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Animated, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenTracker from '@/lib/ScreenTracker';
import analytics, { ANALYTICS_EVENTS } from '@/lib/analytics';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  Welcome: undefined;
  Dashboard: undefined;
  FitnessAppConnect: undefined;
  WhyAccountability: undefined;
  GoalSetup: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const HERO_PILLS = [
  {
    id: 'buddy-emails',
    label: 'Buddy emails',
    detail: 'No more ignored texts',
  },
  {
    id: 'strava-sync',
    label: 'Live Strava sync',
    detail: 'Real data only',
  },
  {
    id: 'two-minute',
    label: '2 min setup',
    detail: 'Goal + contact',
  },
] as const;

const INTRO_POINTS = [
  {
    id: 'connect',
    title: 'Connect Strava once',
    copy: 'We pull every run automatically so you never log workouts twice.',
  },
  {
    id: 'choose',
    title: 'Pick your accountability buddy',
    copy: 'Drop an email for the person who keeps it real when you slack off.',
  },
  {
    id: 'nudge',
    title: 'We send the receipts',
    copy: 'Miss your weekly goal and Rundown emails your buddy instantly.',
  },
] as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  lightContainer: {
    backgroundColor: '#f8fafc',
  } as ViewStyle,
  darkContainer: {
    backgroundColor: '#020617',
  } as ViewStyle,
  heroGradient: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  } as ViewStyle,
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  } as ViewStyle,
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.24)',
  } as ViewStyle,
  brandIcon: {
    fontSize: 32,
    color: '#fbbf24',
  } as TextStyle,
  logoPulse: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(15, 118, 110, 0.45)',
    zIndex: -1,
  } as ViewStyle,
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  } as ViewStyle,
  heroEyebrow: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(248, 250, 252, 0.75)',
    marginBottom: 8,
  } as TextStyle,
  heroTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 34,
    lineHeight: 40,
    color: '#f8fafc',
  } as TextStyle,
  heroSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 17,
    color: 'rgba(226, 232, 240, 0.9)',
    marginTop: 12,
    lineHeight: 24,
  } as TextStyle,
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  } as ViewStyle,
  heroPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.24)',
  } as ViewStyle,
  heroPillLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#f8fafc',
  } as TextStyle,
  heroPillDetail: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: 'rgba(248, 250, 252, 0.75)',
    marginTop: 2,
  } as TextStyle,
  contentCard: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    paddingVertical: 24,
    paddingHorizontal: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  } as ViewStyle,
  contentCardDark: {
    backgroundColor: '#0b1120',
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: 'rgba(0,0,0,0.2)',
  } as ViewStyle,
  cardEyebrow: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#f97316',
    marginBottom: 8,
  } as TextStyle,
  cardTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 24,
    lineHeight: 28,
    color: '#0f172a',
    marginBottom: 12,
  } as TextStyle,
  cardTitleDark: {
    color: '#f8fafc',
  } as TextStyle,
  cardDescription: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 20,
  } as TextStyle,
  cardDescriptionDark: {
    color: '#94a3b8',
  } as TextStyle,
  pointList: {
    gap: 16,
  } as ViewStyle,
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  } as ViewStyle,
  pointBullet: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#fff7ed',
  } as ViewStyle,
  pointBulletDark: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#f97316',
  } as ViewStyle,
  pointBulletText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#f97316',
  } as TextStyle,
  pointTextGroup: {
    flex: 1,
  } as ViewStyle,
  pointTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  } as TextStyle,
  pointTitleDark: {
    color: '#f8fafc',
  } as TextStyle,
  pointCopy: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  } as TextStyle,
  pointCopyDark: {
    color: '#94a3b8',
  } as TextStyle,
  animatedDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  } as ViewStyle,
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginHorizontal: 5,
  } as ViewStyle,
  dotOrange: {
    backgroundColor: '#f97316',
  } as ViewStyle,
  dotLime: {
    backgroundColor: '#84cc16',
  } as ViewStyle,
  dotTeal: {
    backgroundColor: '#14b8a6',
  } as ViewStyle,
  footer: {
    paddingHorizontal: 24,
  } as ViewStyle,
  footerText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
  } as TextStyle,
  footerTextLight: {
    color: '#94a3b8',
  } as TextStyle,
  footerTextDark: {
    color: '#475569',
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
        isDarkMode ? styles.darkContainer : styles.lightContainer
      ]}
    >
      <ScreenTracker screenName="Welcome" />

      <LinearGradient
        colors={isDarkMode ? ['#020617', '#030c1f'] : ['#0f172a', '#1e293b']}
        style={[styles.heroGradient, { paddingTop: Math.max(insets.top, 24) }]}
      >
        <View style={styles.heroHeader}>
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={[
                styles.logoPulse,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.5, 0],
                  }),
                }
              ]}
            />
            <View style={styles.brandBadge}>
              <Text style={styles.brandIcon}>⚡</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              toggleColorScheme();
              analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
                button_name: 'theme_toggle',
                new_theme: isDarkMode ? 'light' : 'dark',
                screen: 'Welcome'
              });
            }}
            style={styles.themeToggle}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
          >
            <Text style={{ fontSize: 20 }}>
              {isDarkMode ? '☀️' : '🌙'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heroEyebrow}>Accountability for real runners</Text>
        <Text style={styles.heroTitle}>Run from your excuses.</Text>
        <Text style={styles.heroSubtitle}>
          Connect Strava, select a buddy email, and let Rundown send the receipts when you fall behind.
        </Text>

        <View style={styles.heroPills}>
          {HERO_PILLS.map((pill) => (
            <View key={pill.id} style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>{pill.label}</Text>
              <Text style={styles.heroPillDetail}>{pill.detail}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={[styles.contentCard, isDarkMode && styles.contentCardDark]}>
        <Text style={styles.cardEyebrow}>Beta walkthrough</Text>
        <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
          How Rundown keeps you honest
        </Text>
        <Text style={[styles.cardDescription, isDarkMode && styles.cardDescriptionDark]}>
          Replace silent guilt with friendly accountability. Share your goals, and we’ll send respectful nudges via email when you miss.
        </Text>

        <View style={styles.pointList}>
          {INTRO_POINTS.map((point, index) => (
            <View key={point.id} style={styles.pointRow}>
              <View style={[
                styles.pointBullet,
                isDarkMode && styles.pointBulletDark
              ]}>
                <Text style={styles.pointBulletText}>{index + 1}</Text>
              </View>
              <View style={styles.pointTextGroup}>
                <Text style={[
                  styles.pointTitle,
                  isDarkMode && styles.pointTitleDark
                ]}>
                  {point.title}
                </Text>
                <Text style={[
                  styles.pointCopy,
                  isDarkMode && styles.pointCopyDark
                ]}>
                  {point.copy}
                </Text>
              </View>
            </View>
          ))}
        </View>

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

      <View
        style={[
          ONBOARDING_CONTAINER_STYLE,
          styles.footer,
          {
            backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? '#0f172a' : '#e5e7eb',
            paddingBottom: Math.max(16, insets.bottom)
          }
        ]}
      >
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
