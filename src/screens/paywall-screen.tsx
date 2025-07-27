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

const PLAN_FEATURES = {
  monthly: ['Unlimited accountability', 'Custom shame messages', 'Progress tracking'],
  yearly: ['Everything in monthly', 'Advanced analytics', 'Priority support', '2 months free']
};

const SOCIAL_PROOF = [
  { name: 'Sarah', achievement: 'Lost 15 lbs in 2 months', emoji: '🏃‍♀️' },
  { name: 'Mike', achievement: 'First marathon completed', emoji: '🏅' },
  { name: 'Emma', achievement: 'Consistent for 6 months', emoji: '🔥' }
];

export function PaywallScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Animations
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const scaleAnimation = useSharedValue(0.9);

  useEffect(() => {
    // Load RevenueCat offerings
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
      if (offerings.length > 0 && offerings.find(p => p.isPopular)) {
        setSelectedPlan(offerings.find(p => p.isPopular)?.id || offerings[0].id);
      }
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

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) {
      Alert.alert('Error', 'Please select a plan');
      return;
    }

    setIsLoading(true);
    try {
      await revenueCat.purchasePackage(selectedPlanData.rcPackage);
      navigation.navigate('OnboardingSuccess');
    } catch (error) {
      if (error instanceof Error && error.message === 'Purchase was cancelled') {
        // User cancelled, don't show error
        return;
      }
      Alert.alert('Purchase Failed', 'Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      const customerInfo = await revenueCat.restorePurchases();
      if (Object.keys(customerInfo.entitlements.active).length > 0) {
        Alert.alert('Restore Successful', 'Your purchases have been restored.');
        navigation.navigate('OnboardingSuccess');
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Failed to restore purchases. Please try again.');
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <View style={[
      styles.container,
      isDarkMode ? styles.darkContainer : styles.lightContainer
    ]}>
      <LinearGradient
        colors={isDarkMode ? ['#1f2937', '#111827'] : ['#ffffff', '#f8fafc']}
        style={styles.gradient}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, containerStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.emoji, { fontSize: 64 }]}>🏃‍♂️</Text>
            <Text style={[styles.title, isDarkMode && styles.darkText]}>
              Ready to stop making excuses?
            </Text>
            <Text style={[styles.subtitle, isDarkMode && styles.darkSubtext]}>
              Join thousands who've turned accountability into results
            </Text>
          </View>

          {/* Social Proof */}
          <View style={styles.socialProof}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              What our runners achieve:
            </Text>
            {SOCIAL_PROOF.map((proof, index) => (
              <View key={index} style={[styles.proofItem, isDarkMode && styles.darkProofItem]}>
                <Text style={styles.proofEmoji}>{proof.emoji}</Text>
                <View style={styles.proofText}>
                  <Text style={[styles.proofName, isDarkMode && styles.darkText]}>{proof.name}</Text>
                  <Text style={[styles.proofAchievement, isDarkMode && styles.darkSubtext]}>
                    {proof.achievement}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Plans */}
          <View style={styles.pricing}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Choose your commitment level:
            </Text>
            
            {loadingPlans ? (
              <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>
                Loading plans...
              </Text>
            ) : (
              plans.map((plan) => (
              <View key={plan.id} style={styles.planContainer}>
                {plan.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlan === plan.id && styles.selectedPlan,
                    isDarkMode && styles.darkPlanCard,
                    selectedPlan === plan.id && isDarkMode && styles.darkSelectedPlan
                  ]}
                  onPress={() => handlePlanSelect(plan.id)}
                >
                  <View style={styles.planHeader}>
                    <Text style={[styles.planTitle, isDarkMode && styles.darkText]}>
                      {plan.title}
                    </Text>
                    {plan.discount && (
                      <Text style={styles.discountText}>{plan.discount}</Text>
                    )}
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <Text style={[styles.price, isDarkMode && styles.darkText]}>
                      {plan.price}
                    </Text>
                    <Text style={[styles.period, isDarkMode && styles.darkSubtext]}>
                      {plan.period}
                    </Text>
                  </View>
                  
                  <View style={styles.features}>
                    {(PLAN_FEATURES[plan.packageType as keyof typeof PLAN_FEATURES] || []).map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Text style={styles.checkmark}>✓</Text>
                        <Text style={[styles.featureText, isDarkMode && styles.darkSubtext]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              </View>
              ))
            )}
          </View>

          {/* Urgency/Scarcity */}
          <View style={[styles.urgencyBox, isDarkMode && styles.darkUrgencyBox]}>
            <Text style={styles.urgencyEmoji}>⏰</Text>
            <Text style={[styles.urgencyText, isDarkMode && styles.darkText]}>
              Limited time: Start your accountability journey today
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
          onPress={handlePurchase}
          size="lg"
          title={isLoading ? 'Processing...' : `Start ${selectedPlanData?.title || 'Selected'} Plan`}
          style={styles.purchaseButton}
          disabled={isLoading || loadingPlans}
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
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    maxWidth: 280,
    lineHeight: 24,
  },
  socialProof: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  proofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  darkProofItem: {
    backgroundColor: '#1f2937',
  },
  proofEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  proofText: {
    flex: 1,
  },
  proofName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  proofAchievement: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  pricing: {
    marginBottom: 24,
  },
  planContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: '#f97316',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  popularText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  darkPlanCard: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  selectedPlan: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  darkSelectedPlan: {
    borderColor: '#f97316',
    backgroundColor: '#292524',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  discountText: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  period: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  darkOriginalPrice: {
    color: '#6b7280',
  },
  features: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    width: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  urgencyBox: {
    backgroundColor: '#fef3e2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkUrgencyBox: {
    backgroundColor: '#292524',
  },
  urgencyEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ea580c',
    flex: 1,
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
  purchaseButton: {
    marginBottom: 16,
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
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginVertical: 24,
  },
});