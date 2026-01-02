import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../App';
import { Button } from '../components/ui/button';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '../constants/OnboardingStyles';
import { useColorScheme } from '../hooks/useColorScheme';
import { TYPOGRAPHY_STYLES } from '../constants/Typography';

const HERO_PILLS = [
  { id: 'partner', label: 'Buddy emails', detail: 'Auto accountability' },
  { id: 'strava', label: 'Strava sync', detail: 'No manual logging' },
  { id: 'setup', label: '2-minute setup', detail: 'Goal + contact' },
] as const;

const INTRO_POINTS = [
  {
    id: 'commit',
    title: 'Set a weekly goal',
    copy: 'Keep the target simple: total miles, workouts, or time spent moving.',
  },
  {
    id: 'choose',
    title: 'Nominate your buddy',
    copy: 'Drop their email so Rundown can loop them in when you fall behind.',
  },
  {
    id: 'sync',
    title: 'Connect Strava once',
    copy: 'We watch your runs in real-time and send the receipts automatically.',
  },
] as const;

export function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start(() => animate());
    };
    animate();
  }, [pulseAnim]);

  const handleContinue = () => {
    navigation.navigate('UserInfo');
  };

  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer
      ]}
    >
      <LinearGradient
        colors={isDarkMode ? ['#020617', '#030c1f'] : ['#0f172a', '#1e293b']}
        style={[styles.heroGradient, { paddingTop: Math.max(insets.top, 32) }]}
      >
        <View style={styles.heroHeader}>
          <Animated.View
            style={[
              styles.heroBadge,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({ inputRange: [1, 1.25], outputRange: [1, 0.4] }),
              }
            ]}
          />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Beta preview</Text>
            <Text style={styles.heroTitle}>Run from your excuses.</Text>
            <Text style={styles.heroSubtitle}>
              Accountability emails fire automatically when Strava shows you missed.
            </Text>
          </View>
        </View>

        <View style={styles.heroPills}>
          {HERO_PILLS.map((pill) => (
            <View key={pill.id} style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>{pill.label}</Text>
              <Text style={styles.heroPillDetail}>{pill.detail}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={[styles.cardSurface, isDarkMode && styles.cardSurfaceDark]}>
        <Text style={styles.cardEyebrow}>How Rundown works</Text>
        <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
          Three steps to honest running
        </Text>
        <View style={styles.pointList}>
          {INTRO_POINTS.map((point, index) => (
            <View key={point.id} style={styles.pointRow}>
              <View style={[styles.pointBullet, isDarkMode && styles.pointBulletDark]}>
                <Text style={styles.pointBulletText}>{index + 1}</Text>
              </View>
              <View style={styles.pointCopyGroup}>
                <Text style={[styles.pointTitle, isDarkMode && styles.pointTitleDark]}>
                  {point.title}
                </Text>
                <Text style={[styles.pointCopy, isDarkMode && styles.pointCopyDark]}>
                  {point.copy}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View
        style={[
          ONBOARDING_CONTAINER_STYLE,
          styles.footer,
          {
            backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
            borderTopWidth: 0,
            paddingBottom: Math.max(16, insets.bottom)
          }
        ]}
      >
        <Button
          onPress={handleContinue}
          variant="default"
          size="lg"
          style={ONBOARDING_BUTTON_STYLE}
          title="Get Started"
          darkMode={isDarkMode}
        />
        <Text style={[styles.footerHint, isDarkMode && styles.footerHintDark]}>
          2-minute setup. We'll handle the tough love.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#f8fafc',
  },
  darkContainer: {
    backgroundColor: '#020617',
  },
  heroGradient: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: 'rgba(244, 114, 182, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.25)',
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: 'rgba(248, 250, 252, 0.8)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    ...TYPOGRAPHY_STYLES.h3,
    color: '#f8fafc',
    marginBottom: 6,
  },
  heroSubtitle: {
    ...TYPOGRAPHY_STYLES.body1,
    color: 'rgba(226, 232, 240, 0.9)',
    lineHeight: 22,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  heroPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.25)',
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  heroPillLabel: {
    ...TYPOGRAPHY_STYLES.body2,
    color: '#f8fafc',
    fontWeight: '600',
  },
  heroPillDetail: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: 'rgba(248, 250, 252, 0.7)',
    marginTop: 2,
  },
  cardSurface: {
    marginHorizontal: 24,
    marginTop: -32,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  cardSurfaceDark: {
    backgroundColor: '#0b1120',
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: 'transparent',
  },
  cardEyebrow: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#f97316',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardTitle: {
    ...TYPOGRAPHY_STYLES.h4,
    color: '#0f172a',
    marginBottom: 16,
  },
  cardTitleDark: {
    color: '#f8fafc',
  },
  pointList: {
    gap: 16,
  },
  pointRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pointBullet: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointBulletDark: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  pointBulletText: {
    ...TYPOGRAPHY_STYLES.body2,
    color: '#f97316',
    fontWeight: '700',
  },
  pointCopyGroup: {
    flex: 1,
  },
  pointTitle: {
    ...TYPOGRAPHY_STYLES.body1,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  pointTitleDark: {
    color: '#f8fafc',
  },
  pointCopy: {
    ...TYPOGRAPHY_STYLES.body2,
    color: '#475569',
    lineHeight: 20,
  },
  pointCopyDark: {
    color: '#94a3b8',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  footerHint: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
  },
  footerHintDark: {
    color: '#cbd5f5',
  },
});
