import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../App';
import { Button } from '../components/ui/button';
import { useColorScheme } from '../hooks/useColorScheme';
import { revenueCat, SubscriptionPlan } from '../services/RevenueCat';

const TRIAL_TIMELINE = [
  {
    icon: '🏃‍♂️',
    title: 'Start Free',
    description: 'Begin your accountability journey with full access to all features.',
    day: 'Day 1'
  },
  {
    icon: '📱',
    title: 'Week 1',
    description: 'Get daily check-ins and shame messages. See how accountability works.',
    day: 'Day 7'
  },
  {
    icon: '⏰',
    title: 'Trial Reminder',
    description: 'We\'ll remind you with an email that your trial is ending.',
    day: 'Day 12'
  },
  {
    icon: '💳',
    title: 'Auto-Subscribe',
    description: 'Continue your journey for just $1.99/month. Cancel anytime before.',
    day: 'Day 14'
  }
];

export function PaywallFreeTrialScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Animations
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const scaleAnimation = useSharedValue(0.9);

  useEffect(() => {
    loadOfferings();
    
    // Entrance animations
    fadeIn.value = withDelay(100, withSpring(1));
    slideUp.value = withDelay(200, withSpring(0));
    scaleAnimation.value = withDelay(300, withSpring(1));
  }, []);

  const loadOfferings = async () => {
    try {
      const offerings = await revenueCat.getOfferings();
      setPlans(offerings);
    } catch (error) {
      console.error('Failed to load offerings:', error);
      Alert.alert('Error', 'Failed to load subscription plans. Please try again.');
    } finally {
      setLoadingPlans(false);
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [
      { translateY: slideUp.value },
      { scale: scaleAnimation.value }
    ],
  }));

  const handleStartFreeTrial = async () => {
    // Find monthly plan for the trial
    const monthlyPlan = plans.find(p => p.packageType === 'monthly' || p.id.includes('monthly'));
    
    if (!monthlyPlan) {
      Alert.alert('Error', 'Unable to start free trial. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      await revenueCat.purchasePackage(monthlyPlan.rcPackage);
      navigation.navigate('PostPaywallOnboarding');
    } catch (error) {
      if (error instanceof Error && error.message === 'Purchase was cancelled') {
        return;
      }
      Alert.alert('Failed to start trial', 'Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      const customerInfo = await revenueCat.restorePurchases();
      if (Object.keys(customerInfo.entitlements.active).length > 0) {
        Alert.alert('Restore Successful', 'Your purchases have been restored.');
        navigation.navigate('PostPaywallOnboarding');
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Failed to restore purchases. Please try again.');
    }
  };

  return (
    <View style={[
      styles.container,
      isDarkMode ? styles.darkContainer : styles.lightContainer
    ]}>
      <LinearGradient
        colors={isDarkMode ? ['#1f2937', '#111827', '#0f172a'] : ['#f8fafc', '#e2e8f0', '#cbd5e1']}
        style={styles.gradient}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, containerStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.heroIllustration}>
              <Text style={styles.heroEmoji}>🏃‍♂️</Text>
              <View style={styles.sparkles}>
                <Text style={[styles.sparkle, { top: 10, left: 20 }]}>✨</Text>
                <Text style={[styles.sparkle, { top: 30, right: 15 }]}>⭐</Text>
                <Text style={[styles.sparkle, { bottom: 20, left: 10 }]}>💪</Text>
                <Text style={[styles.sparkle, { bottom: 10, right: 25 }]}>🔥</Text>
              </View>
            </View>
            <Text style={[styles.title, isDarkMode && styles.darkText]}>
              How your free trial works
            </Text>
            <Text style={[styles.subtitle, isDarkMode && styles.darkSubtext]}>
              Try accountability coaching risk-free for 2 weeks
            </Text>
          </View>

          {/* Timeline */}
          <View style={styles.timeline}>
            {TRIAL_TIMELINE.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIcon,
                    isDarkMode && styles.darkTimelineIcon,
                    index === TRIAL_TIMELINE.length - 1 && styles.lastTimelineIcon
                  ]}>
                    <Text style={styles.timelineEmoji}>{item.icon}</Text>
                  </View>
                  {index < TRIAL_TIMELINE.length - 1 && (
                    <View style={[styles.timelineLine, isDarkMode && styles.darkTimelineLine]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={[styles.timelineTitle, isDarkMode && styles.darkText]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.timelineDay, isDarkMode && styles.darkSubtext]}>
                      {item.day}
                    </Text>
                  </View>
                  <Text style={[styles.timelineDescription, isDarkMode && styles.darkSubtext]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Info */}
          <View style={[styles.pricingInfo, isDarkMode && styles.darkPricingInfo]}>
            <Text style={[styles.pricingTitle, isDarkMode && styles.darkText]}>
              Free access for 2 weeks, then $1.99/month
            </Text>
            <Text style={[styles.pricingSubtitle, isDarkMode && styles.darkSubtext]}>
              Cancel anytime before Day 14. No questions asked.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed bottom section */}
      <View style={[
        styles.bottomSection,
        isDarkMode && styles.darkBottomSection,
        { paddingBottom: Math.max(16, insets.bottom) }
      ]}>
        <Button
          onPress={handleStartFreeTrial}
          size="lg"
          title={isLoading ? 'Starting Trial...' : 'Start My Free Trial'}
          style={[styles.trialButton, { backgroundColor: isDarkMode ? '#84cc16' : '#84cc16' }]}
          disabled={isLoading || loadingPlans}
          darkMode={isDarkMode}
        />

        <Button
          onPress={() => navigation.goBack()}
          size="lg"
          title="Back to Payment Options"
          style={[styles.trialButton, { backgroundColor: isDarkMode ? '#6b7280' : '#6b7280' }]}
          disabled={isLoading}
          darkMode={isDarkMode}
        />
        
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={[styles.restoreText, isDarkMode && styles.darkSubtext]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>
          <Text style={[styles.termsText, isDarkMode && styles.darkSubtext]}>
            Terms of Service • Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#ffffff',
  },
  darkContainer: {
    backgroundColor: '#0f172a',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIllustration: {
    position: 'relative',
    marginBottom: 20,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 64,
  },
  sparkles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    maxWidth: 280,
    lineHeight: 24,
  },
  timeline: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#84cc16',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  darkTimelineIcon: {
    backgroundColor: '#14532d',
    borderColor: '#84cc16',
  },
  lastTimelineIcon: {
    backgroundColor: '#fef3e2',
    borderColor: '#f97316',
  },
  timelineEmoji: {
    fontSize: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: -8,
  },
  darkTimelineLine: {
    backgroundColor: '#374151',
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  timelineDay: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  timelineDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  pricingInfo: {
    backgroundColor: '#fef3e2',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  darkPricingInfo: {
    backgroundColor: '#292524',
    borderColor: '#a16207',
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ea580c',
    textAlign: 'center',
    marginBottom: 8,
  },
  pricingSubtitle: {
    fontSize: 14,
    color: '#9a3412',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSection: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 24,
  },
  darkBottomSection: {
    backgroundColor: '#1f2937',
    borderTopColor: '#374151',
  },
  trialButton: {
    marginBottom: 16,
    backgroundColor: '#84cc16',
  },
  footerLinks: {
    alignItems: 'center',
    gap: 8,
  },
  restoreText: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  darkText: {
    color: '#f9fafb',
  },
  darkSubtext: {
    color: '#d1d5db',
  },
});