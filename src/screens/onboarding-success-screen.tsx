import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

type RootStackParamList = {
  OnboardingSuccess: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingSuccess'>;

const NUM_CONFETTI = 50;
const COLORS = ['#f97316', '#84cc16', '#14b8a6', '#f59e0b', '#ec4899'];

interface Confetti {
  x: number;
  delay: number;
  color: string;
  rotate: number;
  scale: number;
}

const generateConfetti = (): Confetti[] => {
  return Array.from({ length: NUM_CONFETTI }, () => ({
    x: Math.random() * 100,
    delay: Math.random() * 2000,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotate: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
  }));
};

export function OnboardingSuccessScreen({ navigation }: Props) {
  const animation = useSharedValue(0);
  const confetti = generateConfetti();

  useEffect(() => {
    animation.value = withSequence(
      withSpring(1),
      withDelay(500, withSpring(0.8))
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: animation.value },
      { translateY: withSpring(animation.value * -20) },
    ],
  }));

  const handleContinue = () => {
    navigation.navigate('Dashboard');
  };

  return (
    <View style={styles.container}>
      {confetti.map((conf, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              left: `${conf.x}%`,
              backgroundColor: conf.color,
              transform: [
                { scale: conf.scale },
                { rotate: `${conf.rotate}deg` },
              ],
            },
            useAnimatedStyle(() => ({
              transform: [
                { translateY: withDelay(
                  conf.delay,
                  withSpring(-800, { damping: 10, stiffness: 50 })
                ) },
              ],
            })),
          ]}
        />
      ))}

      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <Text style={styles.icon}>🎉</Text>
      </Animated.View>

      <View style={styles.content}>
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.description}>
          Time to turn those excuses into achievements. We'll be watching! 👀
        </Text>
      </View>

      <Button
        onPress={handleContinue}
        className="bg-orange-500 py-4"
        title="Let's Start Running"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: '100%',
  },
  iconContainer: {
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
  },
  content: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 300,
  },
}); 