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
  y: number;
  delay: number;
  color: string;
  rotate: number;
  scale: number;
  shape: 'circle' | 'square';
  velocityX: number;
  velocityY: number;
}

const generateConfetti = (): Confetti[] => {
  return Array.from({ length: NUM_CONFETTI }, (_, index) => {
    // Generate random angle for burst effect
    const angle = (Math.random() * 2 * Math.PI);
    const velocity = 100 + Math.random() * 150; // Random velocity
    
    return {
      x: 50, // Start from center
      y: 40, // Start from emoji position
      delay: index * 30 + Math.random() * 200, // Staggered timing
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 360,
      scale: 0.6 + Math.random() * 0.8,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
      velocityX: Math.cos(angle) * velocity,
      velocityY: Math.sin(angle) * velocity,
    };
  });
};

export function OnboardingSuccessScreen({ navigation }: Props) {
  const animation = useSharedValue(0);
  const confettiAnimation = useSharedValue(0);
  const confetti = generateConfetti();

  useEffect(() => {
    // Animate the main icon
    animation.value = withSequence(
      withSpring(1),
      withDelay(500, withSpring(0.8))
    );
    
    // Trigger confetti animation
    confettiAnimation.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 50 }));
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
              top: `${conf.y}%`,
              backgroundColor: conf.color,
              borderRadius: conf.shape === 'circle' ? 4 : 1,
            },
            useAnimatedStyle(() => {
              const rotationValue = withDelay(conf.delay, withSpring(conf.rotate + (confettiAnimation.value * 360)));
              return {
                opacity: withDelay(conf.delay, withSpring(confettiAnimation.value)),
                transform: [
                  { scale: withDelay(conf.delay, withSpring(conf.scale * confettiAnimation.value)) },
                  { rotate: `${rotationValue}deg` },
                  { 
                    translateX: withDelay(
                      conf.delay,
                      withSpring(conf.velocityX * confettiAnimation.value, { damping: 8, stiffness: 60 })
                    ) 
                  },
                  { 
                    translateY: withDelay(
                      conf.delay,
                      withSpring(conf.velocityY * confettiAnimation.value, { damping: 8, stiffness: 60 })
                    ) 
                  },
                ],
              };
            }),
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
        size="lg"
        title="Let's Start Running"
        style={{ 
          width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}
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