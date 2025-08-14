import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconComponent } from '../components/ui/IconComponent';
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
  { name: 'Sarah', achievement: 'Lost 15 lbs in 2 months', icon: 'Footprints', color: '#3b82f6' },
  { name: 'Mike', achievement: 'First marathon completed', icon: 'Medal', color: '#f59e0b' },
  { name: 'Emma', achievement: 'Consistent for 6 months', icon: 'Flame', color: '#ef4444' }
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
      // Default to yearly if available, otherwise monthly
      if (offerings.length > 0) {
        const hasYearly = offerings.find(p => p.packageType === 'yearly' || p.id.includes('annual') || p.id.includes('yearly'));
        if (hasYearly) {
          setSelectedPlan('yearly');
        } else {
          setSelectedPlan('monthly');
        }
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
    // Map our UI plan IDs to RevenueCat plans
    let selectedPlanData;
    if (selectedPlan === 'yearly') {
      selectedPlanData = plans.find(p => p.packageType === 'yearly' || p.id.includes('annual') || p.id.includes('yearly'));
    } else if (selectedPlan === 'monthly') {
      selectedPlanData = plans.find(p => p.packageType === 'monthly' || p.id.includes('monthly'));
    }
    
    if (!selectedPlanData) {
      Alert.alert('Error', 'Please select a plan');
      return;
    }

    setIsLoading(true);
    try {
      await revenueCat.purchasePackage(selectedPlanData.rcPackage);
      navigation.navigate('PostPaywallOnboarding');
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
        navigation.navigate('PostPaywallOnboarding');
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Failed to restore purchases. Please try again.');
    }
  };

  const getSelectedPlanData = () => {
    if (selectedPlan === 'yearly') {
      return plans.find(p => p.packageType === 'yearly' || p.id.includes('annual') || p.id.includes('yearly'));
    } else if (selectedPlan === 'monthly') {
      return plans.find(p => p.packageType === 'monthly' || p.id.includes('monthly'));
    }
    return null;
  };
  
  const selectedPlanData = getSelectedPlanData();

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
            <View style={{ marginBottom: 12 }}>
              <IconComponent
                library="Lucide"
                name="Zap"
                size={64}
                color="#f97316"
              />
            </View>
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
                <View style={{ marginRight: 12 }}>
                  <IconComponent
                    library="Lucide"
                    name={proof.icon}
                    size={24}
                    color={proof.color}
                  />
                </View>
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
              <View style={styles.plansContainer}>
                {/* Annual Plan */}
                <View style={styles.planOption}>
                  <TouchableOpacity
                    style={[
                      styles.planRadio,
                      selectedPlan === 'yearly' && styles.selectedRadio,
                      isDarkMode && styles.darkPlanRadio,
                      selectedPlan === 'yearly' && isDarkMode && styles.darkSelectedRadio
                    ]}
                    onPress={() => handlePlanSelect('yearly')}
                  >
                    <View style={styles.radioRow}>
                      <View style={styles.radioContainer}>
                        <View style={[
                          styles.radioButton,
                          selectedPlan === 'yearly' && styles.radioButtonSelected
                        ]}>
                          {selectedPlan === 'yearly' && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                        <View style={styles.planInfo}>
                          <Text style={[styles.planLabel, isDarkMode && styles.darkText]}>
                            Annual
                          </Text>
                          <Text style={[styles.planBilling, isDarkMode && styles.darkSubtext]}>
                            $12.99 • $155.88
                          </Text>
                        </View>
                      </View>
                      <View style={styles.priceSection}>
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountBadgeText}>66% OFF</Text>
                        </View>
                        <Text style={[styles.planPrice, isDarkMode && styles.darkText]}>
                          $1.67/mo
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Monthly Plan */}
                <View style={styles.planOption}>
                  <TouchableOpacity
                    style={[
                      styles.planRadio,
                      selectedPlan === 'monthly' && styles.selectedRadio,
                      isDarkMode && styles.darkPlanRadio,
                      selectedPlan === 'monthly' && isDarkMode && styles.darkSelectedRadio
                    ]}
                    onPress={() => handlePlanSelect('monthly')}
                  >
                    <View style={styles.radioRow}>
                      <View style={styles.radioContainer}>
                        <View style={[
                          styles.radioButton,
                          selectedPlan === 'monthly' && styles.radioButtonSelected
                        ]}>
                          {selectedPlan === 'monthly' && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                        <View style={styles.planInfo}>
                          <Text style={[styles.planLabel, isDarkMode && styles.darkText]}>
                            Monthly
                          </Text>
                          <Text style={[styles.planBilling, isDarkMode && styles.darkSubtext]}>
                            1 mo • $4.99
                          </Text>
                        </View>
                      </View>
                      <View style={styles.priceSection}>
                        <Text style={[styles.planPrice, isDarkMode && styles.darkText]}>
                          $2.99/mo
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
          title={isLoading ? 'Processing...' : 'Continue'}
          style={styles.purchaseButton}
          disabled={isLoading || loadingPlans}
          darkMode={isDarkMode}
        />

        <Button
          onPress={() => navigation.navigate('PaywallFreeTrial')}
          size="lg"
          title="See Free Trial Option"
          style={[styles.purchaseButton, { backgroundColor: isDarkMode ? '#6b7280' : '#6b7280' }]}
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
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    maxWidth: 280,
    lineHeight: 24,
  },
  socialProof: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  proofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  darkProofItem: {
    backgroundColor: '#1f2937',
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
    marginBottom: 16,
  },
  plansContainer: {
    gap: 12,
  },
  planOption: {
    marginBottom: 0,
  },
  planRadio: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  darkPlanRadio: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  selectedRadio: {
    borderColor: '#84cc16',
    backgroundColor: '#f0fdf4',
  },
  darkSelectedRadio: {
    borderColor: '#84cc16',
    backgroundColor: '#14532d',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#84cc16',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#84cc16',
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  planBilling: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  discountBadge: {
    backgroundColor: '#84cc16',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
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