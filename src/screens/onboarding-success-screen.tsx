import { Button } from '@/components/ui/button';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { VectorIcon } from '@/components/ui/IconComponent';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import analytics, { 
  ANALYTICS_EVENTS, 
  ONBOARDING_SCREENS, 
  USER_PROPERTIES,
  trackOnboardingScreenView, 
  trackOnboardingError,
  setUserProperties
} from '../lib/analytics';

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
      y: 60, // Start from emoji position (moved further down to avoid cutoff)
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
  const insets = useSafeAreaInsets();
  const animation = useSharedValue(0);
  const confettiAnimation = useSharedValue(0);
  const confetti = generateConfetti();

  useEffect(() => {
    // Track onboarding completion
    try {
      trackOnboardingScreenView(ONBOARDING_SCREENS.SUCCESS, {
        step_number: 9,
        total_steps: 9
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
        screen: ONBOARDING_SCREENS.SUCCESS,
        completion_time: Date.now()
      });
      
      // Set final user properties
      setUserProperties({
        [USER_PROPERTIES.ONBOARDING_COMPLETED]: true,
        [USER_PROPERTIES.ONBOARDING_COMPLETION_DATE]: new Date().toISOString(),
        [USER_PROPERTIES.ONBOARDING_STEP]: 'completed'
      });
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.SUCCESS,
        action: 'completion_tracking'
      });
    }

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
    try {
      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'lets_get_started',
        screen: ONBOARDING_SCREENS.SUCCESS,
        action: 'navigate_to_dashboard'
      });
      
      navigation.navigate('Dashboard');
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.SUCCESS,
        action: 'continue_button_click'
      });
      navigation.navigate('Dashboard');
    }
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
        <VectorIcon emoji="🎉" size={64} color="#f97316" />
      </Animated.View>

      <View style={styles.content}>
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.description}>
          We'll check your fitness progress every Sunday evening. If you missed your goal, we'll send your chosen message.
        </Text>
        
        {/* Next Steps */}
        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>What happens next:</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <VectorIcon emoji="📱" size={16} color="#6b7280" />
            </View>
            <Text style={styles.stepText}>Stay active and track your fitness activities</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <VectorIcon emoji="📊" size={16} color="#6b7280" />
            </View>
            <Text style={styles.stepText}>We'll monitor your progress automatically</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepIconContainer}>
              <VectorIcon emoji="💬" size={16} color="#6b7280" />
            </View>
            <Text style={styles.stepText}>Your buddy gets notified if you miss goals</Text>
          </View>
        </View>
        
        {/* Optional Midweek Reminder */}
        <View style={styles.reminderOption}>
          <Text style={styles.reminderText}>
            Want a midweek check-in? You can enable reminders in settings later.
          </Text>
        </View>
      </View>

      {/* Fixed Button at bottom */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleContinue}
          size="lg"
          title="Let's Get Started"
          style={[ONBOARDING_BUTTON_STYLE, { alignItems: 'center', justifyContent: 'center' }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  iconContainer: {
    marginBottom: 32,
    marginTop: 20,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'center',
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
    maxWidth: 320,
    marginBottom: 24,
  },
  nextSteps: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIconContainer: {
    marginRight: 12,
    width: 20,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  reminderOption: {
    backgroundColor: '#fef3e2',
    borderRadius: 12,
    padding: 12,
    alignSelf: 'stretch',
  },
  reminderText: {
    fontSize: 12,
    color: '#ea580c',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 