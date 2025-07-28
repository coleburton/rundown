import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { TYPOGRAPHY_STYLES } from '@/constants/Typography';
import analytics, { 
  ANALYTICS_EVENTS, 
  ONBOARDING_SCREENS, 
  trackOnboardingScreenView, 
  trackOnboardingScreenCompleted,
  trackOnboardingError,
  trackFunnelStep
} from '@/lib/analytics';

type RootStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  FitnessAppConnect: undefined;
  WhyAccountability: undefined;
  SocialProof: undefined;
  MotivationQuiz: undefined;
  GoalSetup: undefined;
  ValuePreview: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
  OnboardingSuccess: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'WhyAccountability'>;

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: '👥',
    title: '65% more likely to succeed',
    description: 'Studies show accountability partners dramatically increase goal achievement'
  },
  {
    icon: '🎯',
    title: 'Stay consistent',
    description: 'Regular check-ins help you build lasting habits and routines'
  },
  {
    icon: '📈',
    title: 'Track progress together',
    description: 'Share wins, learn from setbacks, and celebrate milestones'
  },
  {
    icon: '❤️',
    title: 'Build stronger relationships',
    description: 'Strengthen bonds while pursuing your fitness goals together'
  }
];

export function WhyAccountabilityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [screenStartTime] = useState(Date.now());
  
  // Track screen view on mount
  useEffect(() => {
    try {
      trackOnboardingScreenView(ONBOARDING_SCREENS.WHY_ACCOUNTABILITY, {
        step_number: 1,
        total_steps: 9
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.WHY_ACCOUNTABILITY_VIEWED);
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.WHY_ACCOUNTABILITY,
        action: 'screen_view_tracking'
      });
    }
  }, []);

  const handleContinue = () => {
    try {
      const timeSpent = Date.now() - screenStartTime;
      
      // Track screen completion
      trackOnboardingScreenCompleted(ONBOARDING_SCREENS.WHY_ACCOUNTABILITY, {
        time_spent_ms: timeSpent,
        time_spent_seconds: Math.round(timeSpent / 1000),
        step_number: 1,
        total_steps: 9
      });
      
      // Track funnel progression
      trackFunnelStep(ONBOARDING_SCREENS.WHY_ACCOUNTABILITY, 1, 9, {
        time_spent_ms: timeSpent
      });
      
      // Track button click
      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'continue_why_accountability',
        screen: ONBOARDING_SCREENS.WHY_ACCOUNTABILITY,
        button_text: "I'm convinced! →"
      });
      
      navigation.navigate('SocialProof');
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.WHY_ACCOUNTABILITY,
        action: 'continue_button_click'
      });
      // Still navigate even if tracking fails
      navigation.navigate('SocialProof');
    }
  };

  const handleBack = () => {
    try {
      const timeSpent = Date.now() - screenStartTime;
      
      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'back_why_accountability',
        screen: ONBOARDING_SCREENS.WHY_ACCOUNTABILITY,
        time_spent_ms: timeSpent
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_ABANDONED, {
        screen: ONBOARDING_SCREENS.WHY_ACCOUNTABILITY,
        step_number: 1,
        total_steps: 9,
        time_spent_ms: timeSpent,
        abandonment_reason: 'back_button'
      });
      
      navigation.goBack();
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.WHY_ACCOUNTABILITY,
        action: 'back_button_click'
      });
      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <OnboardingStepper currentStep={1} />
      
      {/* Back Button */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <TouchableOpacity 
          onPress={handleBack}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 4
          }}
        >
          <Text style={{ fontSize: 16, color: '#6b7280', marginRight: 8 }}>←</Text>
          <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '500' }}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 20, marginTop: 16 }}>
          <Text style={[TYPOGRAPHY_STYLES.h2, { 
            color: '#111827', 
            textAlign: 'center',
            marginBottom: 8
          }]}>
            Why accountability <Text style={{ color: '#f97316' }}>works</Text>
          </Text>
          <Text style={[TYPOGRAPHY_STYLES.body1, { 
            color: '#6b7280',
            textAlign: 'center'
          }]}>
            Science-backed benefits of having a fitness buddy
          </Text>
        </View>

        {/* Benefits */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          {benefits.map((benefit, index) => (
            <View key={index} style={{
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'flex-start',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2
            }}>
              {/* Icon */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#f97316',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                flexShrink: 0
              }}>
                <Text style={{ fontSize: 20 }}>{benefit.icon}</Text>
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY_STYLES.h5, { 
                  color: '#111827',
                  marginBottom: 4
                }]}>
                  {benefit.title}
                </Text>
                <Text style={[TYPOGRAPHY_STYLES.body2, { 
                  color: '#6b7280'
                }]}>
                  {benefit.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleContinue}
          size="lg"
          title="I'm convinced! →"
          style={ONBOARDING_BUTTON_STYLE}
        />
      </View>
    </View>
  );
}