import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { TYPOGRAPHY_STYLES } from '@/constants/Typography';
import type { RootStackParamList } from '../../App';
import { useColorScheme } from '@/hooks/useColorScheme';

export function SplashScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const badgePulse = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(badgePulse, { toValue: 0, duration: 1200, useNativeDriver: true })
      ])
    ).start();

    Animated.timing(textFade, { toValue: 1, duration: 800, delay: 200, useNativeDriver: true }).start();
  }, [badgePulse, textFade]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [user, navigation]);

  const handleContinue = () => {
    navigation.replace('Onboarding');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32 }, isDarkMode ? styles.darkBg : styles.lightBg]}>
      <LinearGradient
        colors={isDarkMode ? ['#020617', '#030c1f'] : ['#0f172a', '#1e293b']}
        style={styles.hero}
      >
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [
                {
                  scale: badgePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] })
                }
              ],
              opacity: badgePulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] })
            }
          ]}
        >
          <Text style={styles.badgeIcon}>⚡</Text>
        </Animated.View>
        <Animated.View style={{ opacity: textFade }}>
          <Text style={styles.eyebrow}>Rundown</Text>
          <Text style={styles.title}>Accountability that hits different.</Text>
          <Text style={styles.subtitle}>
            We connect your Strava to the people who keep you honest. Real data. Real consequences.
          </Text>
        </Animated.View>
      </LinearGradient>

      {!user && (
        <View style={styles.ctaContainer}>
          <Text style={[styles.ctaText, isDarkMode && styles.ctaTextDark]}>Beta access is live.</Text>
          <Button
            onPress={handleContinue}
            title="Enter Rundown"
            variant="default"
            size="lg"
            style={styles.ctaButton}
            darkMode={isDarkMode}
          />
        </View>
      )}

      {user && (
        <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>Syncing your dashboard…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  lightBg: {
    backgroundColor: '#f8fafc',
  },
  darkBg: {
    backgroundColor: '#010712',
  },
  hero: {
    borderRadius: 32,
    padding: 28,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 12,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: 'rgba(248, 250, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.3)',
    marginBottom: 24,
  },
  badgeIcon: {
    fontSize: 34,
  },
  eyebrow: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: 'rgba(248, 250, 252, 0.85)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    ...TYPOGRAPHY_STYLES.h2,
    color: '#f8fafc',
    marginBottom: 12,
  },
  subtitle: {
    ...TYPOGRAPHY_STYLES.body1,
    color: 'rgba(226, 232, 240, 0.9)',
    lineHeight: 22,
  },
  ctaContainer: {
    marginBottom: 48,
  },
  ctaText: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaTextDark: {
    color: '#94a3b8',
  },
  ctaButton: {
    borderRadius: 18,
  },
  loadingText: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 32,
  },
  loadingTextDark: {
    color: '#cbd5f5',
  },
});
