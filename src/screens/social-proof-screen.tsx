import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { TYPOGRAPHY_STYLES } from '@/constants/Typography';
import { OnboardingBackButton } from '@/components/OnboardingBackButton';
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

// Stats from research studies
const STATS = [
  { number: '76%', label: 'achieve goals when they report progress to someone' },
  { number: '65%', label: 'success rate when committed to an accountability partner' },
  { number: '2x', label: 'more likely to succeed vs going it alone (43% baseline)' }
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
  const safeTopPadding = Math.max(insets.top, 16);
  const [screenStartTime] = useState(Date.now());

  // Track screen view on mount
  useEffect(() => {
    try {
      trackOnboardingScreenView(ONBOARDING_SCREENS.SOCIAL_PROOF, {
        step_number: 2,
        total_steps: 9
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_SOCIAL_PROOF_VIEWED);
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

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Back Button */}
      <View style={{ position: 'absolute', top: safeTopPadding, left: 0, right: 0, zIndex: 10 }}>
        <OnboardingBackButton />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: safeTopPadding
        }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 48 }}>
          <Text style={[TYPOGRAPHY_STYLES.h2, {
            color: '#111827',
            textAlign: 'center',
            marginBottom: 8
          }]}>
            It actually <Text style={{ color: '#f97316' }}>works</Text>.
          </Text>
          <Text style={[TYPOGRAPHY_STYLES.body1, {
            color: '#6b7280',
            textAlign: 'center'
          }]}>
            Don't just take our word for it — here's what the research says about accountability.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={{ marginBottom: 32 }}>
          <Text style={[TYPOGRAPHY_STYLES.h5, {
            color: '#111827',
            marginBottom: 16,
            textAlign: 'center'
          }]}>
            The research is clear
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
                <Text style={[TYPOGRAPHY_STYLES.h2, {
                  color: '#f97316',
                  marginRight: 16
                }]}>
                  {stat.number}
                </Text>
                <Text style={[TYPOGRAPHY_STYLES.body1Medium, {
                  color: '#374151',
                  flex: 1
                }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Success Stories */}
        <View style={{ marginBottom: 32 }}>
          <Text style={[TYPOGRAPHY_STYLES.h5, {
            color: '#111827',
            marginBottom: 16,
            textAlign: 'center'
          }]}>
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
                    <Text style={[TYPOGRAPHY_STYLES.h6, { color: '#ffffff' }]}>
                      {testimonial.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPOGRAPHY_STYLES.h6, {
                      color: '#111827',
                      marginBottom: 2
                    }]}>
                      {testimonial.name}
                    </Text>
                    <Text style={[TYPOGRAPHY_STYLES.body2Medium, {
                      color: '#f97316'
                    }]}>
                      {testimonial.result}
                    </Text>
                  </View>
                </View>
                <Text style={[TYPOGRAPHY_STYLES.body2, {
                  color: '#4b5563',
                  fontStyle: 'italic'
                }]}>
                  {testimonial.quote}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Research Attribution */}
        <View style={{
          backgroundColor: '#f8fafc',
          borderRadius: 12,
          padding: 16,
          marginBottom: 32
        }}>
          <Text style={[TYPOGRAPHY_STYLES.caption1, {
            color: '#6b7280',
            textAlign: 'center'
          }]}>
            Based on research from Dominican University of California and the American Society of Training and Development
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
