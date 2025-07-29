import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { EnhancedGoalPicker, Goal } from '@/components/EnhancedGoalPicker';
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
  Welcome: undefined;
  WhyAccountability: undefined;
  GoalSetup: undefined;
  MotivationQuiz: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
  OnboardingSuccess: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'GoalSetup'>;

export function GoalSetupScreen({ navigation }: Props) {
  const { user, updateUser } = useMockAuth();
  const insets = useSafeAreaInsets();
  const [selectedGoal, setSelectedGoal] = useState<Goal>({ 
    type: 'weekly_commitments', 
    value: 3 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenStartTime] = useState(Date.now());

  // Track screen view on mount
  useEffect(() => {
    try {
      trackOnboardingScreenView(ONBOARDING_SCREENS.GOAL_SETUP, {
        step_number: 4,
        total_steps: 9
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_SETUP_STARTED);
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.GOAL_SETUP,
        action: 'screen_view_tracking'
      });
    }
  }, []);

  // Initialize with user's existing goal if available
  useEffect(() => {
    if (user) {
      setSelectedGoal({
        type: user.goal_type || 'weekly_commitments',
        value: user.goal_value || user.goal_per_week || 3
      });
    }
  }, [user]);

  const handleGoalChange = (goal: Goal) => {
    try {
      setSelectedGoal(goal);
      
      // Track goal selection in analytics (not creation - that happens on continue)
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_SELECTED, { 
        goal_type: goal.type,
        goal_value: goal.value,
        screen: ONBOARDING_SCREENS.GOAL_SETUP,
        time_to_select_ms: Date.now() - screenStartTime
      });
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.GOAL_SETUP,
        action: 'goal_selection',
        goal_type: goal.type,
        goal_value: goal.value
      });
      console.error('Error setting goal:', error);
    }
  };

  const handleNext = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const timeSpent = Date.now() - screenStartTime;
      
      // Track screen completion
      trackOnboardingScreenCompleted(ONBOARDING_SCREENS.GOAL_SETUP, {
        time_spent_ms: timeSpent,
        time_spent_seconds: Math.round(timeSpent / 1000),
        step_number: 4,
        total_steps: 9,
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value
      });
      
      // Track funnel progression
      trackFunnelStep(ONBOARDING_SCREENS.GOAL_SETUP, 4, 9, {
        time_spent_ms: timeSpent,
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value
      });
      
      // Track goal confirmation
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_CREATED, {
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value,
        screen: ONBOARDING_SCREENS.GOAL_SETUP,
        time_spent_ms: timeSpent
      });
      
      // Set user properties for segmentation
      setUserProperties({
        [USER_PROPERTIES.GOAL_TYPE]: selectedGoal.type,
        [USER_PROPERTIES.GOAL_VALUE]: selectedGoal.value,
        [USER_PROPERTIES.ONBOARDING_STEP]: 'value_preview'
      });
      
      // Update user with the selected goal using mock auth
      await updateUser({ 
        goal_per_week: selectedGoal.value, // Keep legacy field for backwards compatibility
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value
      });
      
      navigation.navigate('ValuePreview');
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.GOAL_SETUP,
        action: 'save_goal',
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value
      });
      console.error('Failed to save goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    try {
      const timeSpent = Date.now() - screenStartTime;
      
      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'back_goal_setup',
        screen: ONBOARDING_SCREENS.GOAL_SETUP,
        time_spent_ms: timeSpent,
        current_goal_type: selectedGoal.type,
        current_goal_value: selectedGoal.value
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_ABANDONED, {
        screen: ONBOARDING_SCREENS.GOAL_SETUP,
        step_number: 4,
        total_steps: 9,
        time_spent_ms: timeSpent,
        abandonment_reason: 'back_button',
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value
      });
      
      navigation.goBack();
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.GOAL_SETUP,
        action: 'back_button_click'
      });
      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <OnboardingStepper currentStep={6} />
      
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
        <View style={{ alignItems: 'center', marginBottom: 16, marginTop: 12 }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#111827', 
            textAlign: 'center',
            marginBottom: 6
          }}>
            How do you want to build <Text style={{ color: '#f97316' }}>consistency?</Text>
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Choose your accountability approach. We'll provide the support and positive reinforcement.
          </Text>
        </View>

        {/* Enhanced Goal Picker */}
        <EnhancedGoalPicker 
          value={selectedGoal}
          onChange={handleGoalChange}
          style={{ marginBottom: 20 }}
        />
      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleNext}
          size="lg"
          title="Continue →"
          disabled={isSubmitting}
          style={ONBOARDING_BUTTON_STYLE}
        />
      </View>
    </View>
  );
}