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
          >
            <Text style={styles.badgeIcon}>⚡</Text>
          </Animated.View>
          <Text style={styles.heroEyebrow}>Welcome to Rundown</Text>
          <Text style={styles.heroTitle}>Run from your excuses.</Text>
          <Text style={styles.heroSubtitle}>
            Connect Strava, pick a buddy, and we'll send the receipts when you fall behind.
          </Text>
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

      <View style={styles.contentSection}>
        <View style={styles.trustBadge}>
          <Text style={styles.trustIcon}>✓</Text>
          <Text style={[styles.trustText, isDarkMode && styles.trustTextDark]}>
            Join 1,000+ runners staying honest
          </Text>
        </View>

        <View style={styles.motivationBox}>
          <Text style={[styles.motivationText, isDarkMode && styles.motivationTextDark]}>
            Ready to stop making excuses?
          </Text>
          <Text style={[styles.motivationSubtext, isDarkMode && styles.motivationSubtextDark]}>
            Setup takes 2 minutes. Your future self will thank you.
          </Text>
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
          title="Let's Go"
          darkMode={isDarkMode}
        />
        <Text style={[styles.footerHint, isDarkMode && styles.footerHintDark]}>
          Free to start. Cancel anytime.
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
    alignItems: 'center',
    marginBottom: 24,
  },
  heroBadge: {
    width: 80,
    height: 80,
    borderRadius: 32,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 40,
  },
  heroEyebrow: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: 'rgba(248, 250, 252, 0.75)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 32,
    lineHeight: 38,
    color: '#f8fafc',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    color: 'rgba(226, 232, 240, 0.9)',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
    justifyContent: 'center',
  },
  heroPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.3)',
    backgroundColor: 'rgba(248, 250, 252, 0.12)',
  },
  heroPillLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: '#f8fafc',
  },
  heroPillDetail: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: 'rgba(248, 250, 252, 0.75)',
    marginTop: 2,
  },
  contentSection: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 32,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trustIcon: {
    fontSize: 16,
    color: '#10b981',
  },
  trustText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: '#64748b',
  },
  trustTextDark: {
    color: '#94a3b8',
  },
  motivationBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  motivationText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  motivationTextDark: {
    color: '#f8fafc',
  },
  motivationSubtext: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  motivationSubtextDark: {
    color: '#94a3b8',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  footerHint: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
  },
  footerHintDark: {
    color: '#94a3b8',
  },
});
