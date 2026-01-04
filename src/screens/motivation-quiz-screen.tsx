import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { VectorIcon } from '@/components/ui/IconComponent';
import type { ICON_MAP } from '@/components/ui/IconComponent';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DebugSkipButton } from '@/components/DebugSkipButton';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
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
  emoji: keyof typeof ICON_MAP;
}

const MOTIVATION_OPTIONS: MotivationOption[] = [
  {
    id: 'avoiding_guilt',
    title: 'Avoiding the guilt',
    description: 'Nothing worse than disappointing yourself',
    emoji: '😤'
  },
  {
    id: 'reaching_milestones',
    title: 'Hitting milestones',
    description: 'Love crossing things off the list',
    emoji: '🎯'
  },
  {
    id: 'friendly_competition',
    title: 'Friendly competition',
    description: 'A little rivalry keeps you honest',
    emoji: '⚡'
  },
  {
    id: 'building_habits',
    title: 'Building consistency',
    description: 'Steady progress beats perfect performance',
    emoji: '📈'
  },
  {
    id: 'proving_yourself',
    title: 'Proving you can',
    description: 'Time to show what you\'re made of',
    emoji: '💪'
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: safeTopPadding
        }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 26, 
            fontWeight: 'bold', 
            color: '#111827', 
            textAlign: 'center',
            marginBottom: 6
          }}>
            What drives you?
          </Text>
          <Text style={{ 
            fontSize: 15, 
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: 20
          }}>
            Help us personalize your experience. What keeps you motivated to run?
          </Text>
        </View>

        {/* Motivation Options */}
        <View style={{ marginBottom: 16 }}>
          {MOTIVATION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleMotivationSelect(option.id)}
              style={{
                backgroundColor: selectedMotivation === option.id ? '#fef3e2' : '#f9fafb',
                borderWidth: 2,
                borderColor: selectedMotivation === option.id ? '#f97316' : '#e5e7eb',
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: selectedMotivation === option.id ? '#f97316' : '#e5e7eb',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <VectorIcon emoji={option.emoji} size={16} color="#ffffff" />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: 2
                }}>
                  {option.title}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: '#6b7280',
                  lineHeight: 16
                }}>
                  {option.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Optional Note */}
        <View style={{
          backgroundColor: '#f0fdf4',
          borderRadius: 8,
          padding: 12,
          borderLeftWidth: 3,
          borderLeftColor: '#22c55e',
          marginBottom: 20
        }}>
          <Text style={{
            fontSize: 12,
            color: '#15803d',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            This helps us tailor your reminders and celebration style
          </Text>
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
