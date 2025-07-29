import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import analytics, { 
  ANALYTICS_EVENTS, 
  ONBOARDING_SCREENS, 
  trackOnboardingScreenView, 
  trackOnboardingScreenCompleted,
  trackOnboardingError,
  trackFunnelStep
} from '../lib/analytics';

type RootStackParamList = {
  WhyAccountability: undefined;
  SocialProof: undefined;
  MotivationQuiz: undefined;
  GoalSetup: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'SocialProof'>;

const STATS = [
  { number: '73%', label: 'hit their goals when they have a buddy' },
  { number: '2.5x', label: 'more likely to stick with it' },
  { number: '89%', label: 'say accountability changed their game' }
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    result: 'Went from 0 to 15 runs in 6 weeks',
    quote: '"My buddy kept me honest when I wanted to quit."'
  },
  {
    name: 'Mike R.',
    result: 'Hit his marathon goal after 3 failed attempts',
    quote: '"The gentle nudges made all the difference."'
  },
  {
    name: 'Jessica L.',
    result: 'Lost 25lbs through consistent running',
    quote: '"Having someone in my corner was everything."'
  }
];

export function SocialProofScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [screenStartTime] = useState(Date.now());

  // Track screen view on mount
  useEffect(() => {
    try {
      trackOnboardingScreenView(ONBOARDING_SCREENS.SOCIAL_PROOF, {
        step_number: 2,
        total_steps: 9
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.SOCIAL_PROOF_VIEWED);
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.SOCIAL_PROOF,
        action: 'screen_view_tracking'
      });
    }
  }, []);

  const handleNext = () => {
    try {
      const timeSpent = Date.now() - screenStartTime;
      
      // Track screen completion
      trackOnboardingScreenCompleted(ONBOARDING_SCREENS.SOCIAL_PROOF, {
        time_spent_ms: timeSpent,
        time_spent_seconds: Math.round(timeSpent / 1000),
        step_number: 2,
        total_steps: 9
      });
      
      // Track funnel progression
      trackFunnelStep(ONBOARDING_SCREENS.SOCIAL_PROOF, 2, 9, {
        time_spent_ms: timeSpent
      });

      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'continue_from_social_proof',
        screen: ONBOARDING_SCREENS.SOCIAL_PROOF,
        button_text: "I'm ready for this →",
        time_spent_ms: timeSpent
      });
      
      navigation.navigate('MotivationQuiz');
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.SOCIAL_PROOF,
        action: 'continue_button_click'
      });
      navigation.navigate('MotivationQuiz');
    }
  };

  const handleBack = () => {
    try {
      const timeSpent = Date.now() - screenStartTime;
      
      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'back_social_proof',
        screen: ONBOARDING_SCREENS.SOCIAL_PROOF,
        time_spent_ms: timeSpent
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_ABANDONED, {
        screen: ONBOARDING_SCREENS.SOCIAL_PROOF,
        step_number: 2,
        total_steps: 9,
        time_spent_ms: timeSpent,
        abandonment_reason: 'back_button'
      });
      
      navigation.goBack();
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.SOCIAL_PROOF,
        action: 'back_button_click'
      });
      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <OnboardingStepper currentStep={4} />
      
      {/* Back Button */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
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
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: '#111827', 
            textAlign: 'center',
            marginBottom: 8
          }}>
            It actually works.
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: 24
          }}>
            Don't just take our word for it — here's what happens when runners get real accountability.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            The numbers don't lie
          </Text>
          <View style={{ gap: 12 }}>
            {STATS.map((stat, index) => (
              <View key={index} style={{
                backgroundColor: '#f8fafc',
                borderLeftWidth: 4,
                borderLeftColor: '#f97316',
                borderRadius: 12,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: '#f97316',
                  marginRight: 16
                }}>
                  {stat.number}
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: '#374151',
                  fontWeight: '500',
                  flex: 1,
                  lineHeight: 22
                }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Success Stories */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            Real runners, real results
          </Text>
          <View style={{ gap: 16 }}>
            {TESTIMONIALS.map((testimonial, index) => (
              <View key={index} style={{
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 16,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12
                }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#f97316',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                      {testimonial.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 2
                    }}>
                      {testimonial.name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#f97316',
                      fontWeight: '500'
                    }}>
                      {testimonial.result}
                    </Text>
                  </View>
                </View>
                <Text style={{
                  fontSize: 14,
                  color: '#4b5563',
                  fontStyle: 'italic',
                  lineHeight: 20
                }}>
                  {testimonial.quote}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trust Signals */}
        <View style={{
          backgroundColor: '#f0fdf4',
          borderRadius: 16,
          padding: 20,
          borderLeftWidth: 4,
          borderLeftColor: '#22c55e',
          marginBottom: 32
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>🔒</Text>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#15803d'
            }}>
              Your privacy matters
            </Text>
          </View>
          <Text style={{
            fontSize: 14,
            color: '#166534',
            lineHeight: 20
          }}>
            We only send messages when you miss goals. Your buddy gets a simple text — no personal data shared, no spam, just accountability when you need it.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleNext}
          size="lg"
          title="I'm ready for this →"
          style={ONBOARDING_BUTTON_STYLE}
        />
      </View>
    </View>
  );
}