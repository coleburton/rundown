import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
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
    } else {
      // Auto-navigate for non-logged-in users to Onboarding
      const timer = setTimeout(() => {
        navigation.replace('Onboarding');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [user, navigation]);

  return (
    <View style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [
                {
                  scale: badgePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] })
                }
              ],
              opacity: badgePulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })
            }
          ]}
        >
          <Text style={styles.badgeIcon}>⚡</Text>
        </Animated.View>

        <Animated.View style={{ opacity: textFade, alignItems: 'center', marginTop: 24 }}>
          <Text style={[styles.brandName, isDarkMode && styles.brandNameDark]}>Rundown</Text>
        </Animated.View>
      </View>

      <View style={{ paddingBottom: Math.max(48, insets.bottom) }}>
        <Animated.View style={{ opacity: textFade }}>
          <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
            {user ? 'Loading…' : 'Loading…'}
          </Text>
        </Animated.View>
      </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  badgeIcon: {
    fontSize: 34,
  },
  brandName: {
    fontFamily: 'DMSans-Bold',
    fontSize: 32,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  brandNameDark: {
    color: '#f8fafc',
  },
  loadingText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  loadingTextDark: {
    color: '#64748b',
  },
});
