import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { IconComponent } from '@/components/ui/IconComponent';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  iconColor: string;
  backgroundColor: string;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: 'Users',
    iconColor: '#3b82f6', // Blue icon
    backgroundColor: '#f1f5f9', // Light gray background
    title: '65% more likely to succeed',
    description: 'Studies show accountability partners dramatically increase goal achievement'
  },
  {
    icon: 'Target',
    iconColor: '#10b981', // Green icon
    backgroundColor: '#f1f5f9', // Light gray background
    title: 'Stay consistent',
    description: 'Regular check-ins help you build lasting habits and routines'
  },
  {
    icon: 'TrendingUp',
    iconColor: '#8b5cf6', // Purple icon
    backgroundColor: '#f1f5f9', // Light gray background
    title: 'Track progress together',
    description: 'Share wins, learn from setbacks, and celebrate milestones'
  },
  {
    icon: 'Heart',
    iconColor: '#f59e0b', // Orange icon
    backgroundColor: '#f1f5f9', // Light gray background
    title: 'Build stronger relationships',
    description: 'Strengthen bonds while pursuing your fitness goals together'
  }
];

export function WhyAccountabilityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const safeTopPadding = Math.max(insets.top, 16);
  const [screenStartTime] = useState(Date.now());
  
  // Track screen view on mount
  useEffect(() => {
    try {
      trackOnboardingScreenView(ONBOARDING_SCREENS.WHY_ACCOUNTABILITY, {
        step_number: 1,
        total_steps: 9
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_WHY_ACCOUNTABILITY_VIEWED);
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

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: safeTopPadding,
        }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
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
                backgroundColor: benefit.backgroundColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                flexShrink: 0
              }}>
                <IconComponent
                  library="Lucide"
                  name={benefit.icon}
                  size={20}
                  color={benefit.iconColor}
                />
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
