import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { IconComponent } from '@/components/ui/IconComponent';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DebugSkipButton } from '@/components/DebugSkipButton';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { TYPOGRAPHY_STYLES } from '@/constants/Typography';
import { OnboardingBackButton } from '@/components/OnboardingBackButton';
import analytics, { 
  ANALYTICS_EVENTS, 
  ONBOARDING_SCREENS, 
  USER_PROPERTIES,
  trackOnboardingScreenView, 
  trackOnboardingScreenCompleted,
  trackOnboardingError,
  trackFunnelStep,
  setUserProperties
} from '../lib/analytics';

type RootStackParamList = {
  SocialProof: undefined;
  MotivationQuiz: undefined;
  GoalSetup: undefined;
  ValuePreview: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
  OnboardingSuccess: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'MotivationQuiz'>;

type MotivationType = 'avoiding_guilt' | 'reaching_milestones' | 'friendly_competition' | 'building_habits' | 'proving_yourself';

interface MotivationOption {
  id: MotivationType;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
}

const MOTIVATION_OPTIONS: MotivationOption[] = [
  {
    id: 'avoiding_guilt',
    title: 'Avoiding the guilt',
    description: 'Nothing worse than disappointing yourself',
    icon: 'ShieldAlert',
    iconColor: '#ef4444'
  },
  {
    id: 'reaching_milestones',
    title: 'Hitting milestones',
    description: 'Love crossing things off the list',
    icon: 'Target',
    iconColor: '#10b981'
  },
  {
    id: 'friendly_competition',
    title: 'Friendly competition',
    description: 'A little rivalry keeps you honest',
    icon: 'Zap',
    iconColor: '#f59e0b'
  },
  {
    id: 'building_habits',
    title: 'Building consistency',
    description: 'Steady progress beats perfect performance',
    icon: 'TrendingUp',
    iconColor: '#3b82f6'
  },
  {
    id: 'proving_yourself',
    title: 'Proving you can',
    description: 'Time to show what you\'re made of',
    icon: 'Flame',
    iconColor: '#8b5cf6'
  }
];

export function MotivationQuizScreen({ navigation }: Props) {
  const { updateUser } = useMockAuth();
  const insets = useSafeAreaInsets();
  const safeTopPadding = Math.max(insets.top, 16);
  const [selectedMotivation, setSelectedMotivation] = useState<MotivationType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenStartTime] = useState(Date.now());

  // Track screen view on mount
  useEffect(() => {
    try {
      trackOnboardingScreenView(ONBOARDING_SCREENS.MOTIVATION_QUIZ, {
        step_number: 3,
        total_steps: 9
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_MOTIVATION_QUIZ_STARTED);
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.MOTIVATION_QUIZ,
        action: 'screen_view_tracking'
      });
    }
  }, []);

  const handleMotivationSelect = (motivation: MotivationType) => {
    try {
      setSelectedMotivation(motivation);
      
      // Track motivation selection
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_MOTIVATION_SELECTED, {
        motivation_type: motivation,
        screen: ONBOARDING_SCREENS.MOTIVATION_QUIZ,
        time_to_select_ms: Date.now() - screenStartTime
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'motivation_select',
        motivation_type: motivation,
        screen: ONBOARDING_SCREENS.MOTIVATION_QUIZ
      });
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.MOTIVATION_QUIZ,
        action: 'motivation_selection',
        motivation_type: motivation
      });
    }
  };

  const handleNext = async () => {
    if (!selectedMotivation || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const timeSpent = Date.now() - screenStartTime;
      
      // Track screen completion
      trackOnboardingScreenCompleted(ONBOARDING_SCREENS.MOTIVATION_QUIZ, {
        time_spent_ms: timeSpent,
        time_spent_seconds: Math.round(timeSpent / 1000),
        step_number: 3,
        total_steps: 9,
        motivation_selected: selectedMotivation
      });
      
      // Track funnel progression
      trackFunnelStep(ONBOARDING_SCREENS.MOTIVATION_QUIZ, 3, 9, {
        time_spent_ms: timeSpent,
        motivation_type: selectedMotivation
      });
      
      // Track motivation confirmation
      analytics.trackEvent(ANALYTICS_EVENTS.USER_PREFERENCE_SET, {
        preference_type: 'motivation',
        preference_value: selectedMotivation,
        screen: ONBOARDING_SCREENS.MOTIVATION_QUIZ,
        time_spent_ms: timeSpent
      });
      
      // Set user properties for segmentation
      setUserProperties({
        [USER_PROPERTIES.MOTIVATION_TYPE]: selectedMotivation,
        [USER_PROPERTIES.ONBOARDING_STEP]: 'goal_setup'
      });
      
      // Update user with the selected motivation
      await updateUser({ 
        motivation_type: selectedMotivation,
        onboarding_step: 'goal_setup'
      });
      
      navigation.navigate('GoalSetup');
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.MOTIVATION_QUIZ,
        action: 'save_motivation',
        motivation_type: selectedMotivation
      });
      console.error('Failed to save motivation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      const timeSpent = Date.now() - screenStartTime;
      
      // Track skip action
      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'skip_motivation_quiz',
        screen: ONBOARDING_SCREENS.MOTIVATION_QUIZ,
        time_spent_ms: timeSpent
      });
      
      // Track screen completion (even though skipped)
      trackOnboardingScreenCompleted(ONBOARDING_SCREENS.MOTIVATION_QUIZ, {
        time_spent_ms: timeSpent,
        time_spent_seconds: Math.round(timeSpent / 1000),
        step_number: 3,
        total_steps: 9,
        completion_type: 'skipped'
      });
      
      await updateUser({ onboarding_step: 'goal_setup' });
      navigation.navigate('GoalSetup');
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.MOTIVATION_QUIZ,
        action: 'skip'
      });
      console.error('Failed to skip motivation quiz:', error);
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
          paddingHorizontal: 16,
          paddingTop: safeTopPadding
        }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 20, marginTop: 48 }}>
          <Text style={[TYPOGRAPHY_STYLES.h2, {
            color: '#111827',
            textAlign: 'center',
            marginBottom: 8
          }]}>
            What <Text style={{ color: '#f97316' }}>drives</Text> you?
          </Text>
          <Text style={[TYPOGRAPHY_STYLES.body1, {
            color: '#6b7280',
            textAlign: 'center'
          }]}>
            Help us personalize your experience. What keeps you motivated to run?
          </Text>
        </View>

        {/* Motivation Options */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          {MOTIVATION_OPTIONS.map((option) => {
            const isSelected = selectedMotivation === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleMotivationSelect(option.id)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: isSelected ? '#fef3e2' : '#ffffff',
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? '#f97316' : '#e5e7eb',
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2
                }}
              >
                {/* Icon */}
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isSelected ? option.iconColor : '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  flexShrink: 0
                }}>
                  <IconComponent
                    library="Lucide"
                    name={option.icon}
                    size={20}
                    color={isSelected ? '#ffffff' : option.iconColor}
                  />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <Text style={[TYPOGRAPHY_STYLES.h5, {
                    color: '#111827',
                    marginBottom: 4
                  }]}>
                    {option.title}
                  </Text>
                  <Text style={[TYPOGRAPHY_STYLES.body2, {
                    color: '#6b7280'
                  }]}>
                    {option.description}
                  </Text>
                </View>

                {/* Radio Button Indicator */}
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? '#f97316' : '#d1d5db',
                  backgroundColor: isSelected ? '#f97316' : '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 12,
                  flexShrink: 0
                }}>
                  {isSelected && (
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#ffffff'
                    }} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleNext}
          size="lg"
          title="Continue →"
          disabled={!selectedMotivation || isSubmitting}
          style={{
            ...ONBOARDING_BUTTON_STYLE,
            backgroundColor: selectedMotivation ? '#f97316' : '#e5e7eb'
          }}
        />
        
        <TouchableOpacity onPress={handleSkip} style={{ marginTop: 12 }}>
          <Text style={{
            fontSize: 14,
            color: '#6b7280',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            Skip for now
          </Text>
        </TouchableOpacity>
        <DebugSkipButton 
          onSkip={() => navigation.navigate('GoalSetup')}
          title="Debug Skip Motivation"
        />
      </View>
    </View>
  );
}
