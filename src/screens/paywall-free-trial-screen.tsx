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
import { IconComponent } from '../components/ui/IconComponent';
import { useColorScheme } from '../hooks/useColorScheme';
import { TYPOGRAPHY_STYLES } from '../constants/Typography';
import { revenueCat, SubscriptionPlan } from '../services/RevenueCat';

const TRIAL_TIMELINE = [
  {
    icon: 'Rocket',
    title: 'Start Free Today',
    description: 'Full access to all features. No credit card charged.',
    day: 'Today',
    color: '#22c55e'
  },
  {
    icon: 'Bell',
    title: 'Get Reminders',
    description: 'Daily check-ins keep you on track. Your buddy gets notified if you skip.',
    day: 'Days 1-13',
    color: '#3b82f6'
  },
  {
    icon: 'Mail',
    title: 'Trial Ending Email',
    description: 'We\'ll send a reminder 2 days before your trial ends.',
    day: 'Day 12',
    color: '#8b5cf6'
  },
  {
    icon: 'CreditCard',
    title: 'Subscribe or Cancel',
    description: 'Only $1.99/month if you stay. Cancel anytime with one tap.',
    day: 'Day 14',
    color: '#f97316'
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
        colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#fff7ed']}
        style={styles.gradient}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, containerStyle]}>
          {/* Header */}
          <View style={styles.header}>
            {/* Badge */}
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>14 DAYS FREE</Text>
            </View>

            <Text style={[TYPOGRAPHY_STYLES.h1, styles.title, isDarkMode && styles.darkText]}>
              Try it <Text style={{ color: '#f97316' }}>risk-free</Text>
            </Text>
            <Text style={[TYPOGRAPHY_STYLES.body1, styles.subtitle, isDarkMode && styles.darkSubtext]}>
              Full access to accountability coaching. Cancel anytime.
            </Text>
          </View>

          {/* Timeline */}
          <View style={styles.timeline}>
            {TRIAL_TIMELINE.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIcon,
                    { backgroundColor: `${item.color}15`, borderColor: item.color }
                  ]}>
                    <IconComponent
                      library="Lucide"
                      name={item.icon}
                      size={22}
                      color={item.color}
                    />
                  </View>
                  {index < TRIAL_TIMELINE.length - 1 && (
                    <View style={[styles.timelineLine, isDarkMode && styles.darkTimelineLine]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={[TYPOGRAPHY_STYLES.h5, styles.timelineTitle, isDarkMode && styles.darkText]}>
                      {item.title}
                    </Text>
                    <View style={[styles.dayBadge, { backgroundColor: `${item.color}15` }]}>
                      <Text style={[styles.dayBadgeText, { color: item.color }]}>
                        {item.day}
                      </Text>
                    </View>
                  </View>
                  <Text style={[TYPOGRAPHY_STYLES.body2, styles.timelineDescription, isDarkMode && styles.darkSubtext]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Trust Signals */}
          <View style={styles.trustSection}>
            <View style={styles.trustItem}>
              <IconComponent library="Lucide" name="ShieldCheck" size={20} color="#22c55e" />
              <Text style={[TYPOGRAPHY_STYLES.caption1Medium, styles.trustText, isDarkMode && styles.darkSubtext]}>
                No charge today
              </Text>
            </View>
            <View style={styles.trustItem}>
              <IconComponent library="Lucide" name="X" size={20} color="#22c55e" />
              <Text style={[TYPOGRAPHY_STYLES.caption1Medium, styles.trustText, isDarkMode && styles.darkSubtext]}>
                Cancel anytime
              </Text>
            </View>
            <View style={styles.trustItem}>
              <IconComponent library="Lucide" name="Clock" size={20} color="#22c55e" />
              <Text style={[TYPOGRAPHY_STYLES.caption1Medium, styles.trustText, isDarkMode && styles.darkSubtext]}>
                Reminder before billing
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed bottom section */}
      <View style={[
        styles.bottomSection,
        isDarkMode && styles.darkBottomSection,
        { paddingBottom: Math.max(20, insets.bottom) }
      ]}>
        {/* Price reminder */}
        <View style={styles.priceReminder}>
          <Text style={[TYPOGRAPHY_STYLES.body2, { color: '#6b7280' }]}>
            Then just{' '}
            <Text style={{ color: '#f97316', fontWeight: '700' }}>$1.99/month</Text>
          </Text>
        </View>

        <Button
          onPress={handleStartFreeTrial}
          size="lg"
          title={isLoading ? 'Starting...' : 'Start Free Trial'}
          style={styles.trialButton}
          disabled={isLoading || loadingPlans}
          darkMode={isDarkMode}
        />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.secondaryLink}
        >
          <Text style={[TYPOGRAPHY_STYLES.body2Medium, { color: '#6b7280' }]}>
            View other plans
          </Text>
        </TouchableOpacity>

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
    backgroundColor: '#111827',
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
    paddingTop: 70,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  freeBadge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  freeBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    textAlign: 'center',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    maxWidth: 300,
  },
  timeline: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginTop: 8,
  },
  darkTimelineLine: {
    backgroundColor: '#374151',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineTitle: {
    color: '#111827',
    flex: 1,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timelineDescription: {
    color: '#6b7280',
    lineHeight: 20,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  trustItem: {
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    color: '#15803d',
    textAlign: 'center',
  },
  bottomSection: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  darkBottomSection: {
    backgroundColor: '#1f2937',
    borderTopColor: '#374151',
  },
  priceReminder: {
    alignItems: 'center',
    marginBottom: 12,
  },
  trialButton: {
    marginBottom: 12,
    backgroundColor: '#f97316',
    borderRadius: 14,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  footerLinks: {
    alignItems: 'center',
    gap: 6,
  },
  restoreText: {
    fontSize: 13,
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 11,
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