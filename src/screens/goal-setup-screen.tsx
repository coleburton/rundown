import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserGoals } from '@/hooks/useUserGoals';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DebugSkipButton } from '@/components/DebugSkipButton';
import { EnhancedGoalPicker, Goal } from '@/components/EnhancedGoalPicker';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { Tooltip } from '@/components/ui/tooltip';
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
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'GoalSetup'>;

export function GoalSetupScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { activeGoal, createOrUpdateGoal, toSimpleGoal, loading: goalsLoading } = useUserGoals(user?.id);
  const insets = useSafeAreaInsets();
  const safeTopPadding = Math.max(insets.top, 16);
  const [selectedGoal, setSelectedGoal] = useState<Goal>({
    type: 'total_activities',
    value: 3
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenStartTime] = useState(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);

  const GOAL_TYPE_VALUES: Goal['type'][] = [
    'total_activities',
    'total_runs',
    'total_miles_running',
    'total_rides_biking',
    'total_miles_biking'
  ];

  const isValidGoalType = (value: string | null | undefined): value is Goal['type'] =>
    !!value && GOAL_TYPE_VALUES.includes(value as Goal['type']);

  // Track screen view on mount
  useEffect(() => {
    try {
      // Track onboarding screen view
      trackOnboardingScreenView(ONBOARDING_SCREENS.GOAL_SETUP, {
        step_number: 4,
        total_steps: 9
      });

      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_GOAL_SETUP_STARTED);
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.GOAL_SETUP,
        action: 'screen_view_tracking'
      });
    }
  }, []);

  // Initialize with user's existing goal from user_goals table
  useEffect(() => {
    if (!goalsLoading && activeGoal) {
      const initialGoal: Goal = {
        type: isValidGoalType(activeGoal.goal_type) ? activeGoal.goal_type : 'total_activities',
        value: Number(activeGoal.target_value)
      };
      setSelectedGoal(initialGoal);
      setIsInitialized(true);
    } else if (!goalsLoading && user) {
      // Fallback to users table if no goal in user_goals yet
      const initialGoal: Goal = {
        type: isValidGoalType(user.goal_type) ? user.goal_type : 'total_activities',
        value: user.goal_value || user.goal_per_week || 3
      };
      setSelectedGoal(initialGoal);
      setIsInitialized(true);
    }
  }, [activeGoal, goalsLoading, user]);

  const handleGoalChange = (goal: Goal) => {
    try {
      setSelectedGoal(goal);

      // Track onboarding goal selection
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_GOAL_SELECTED, {
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
    await saveGoal();
  };

  const saveGoal = async () => {
    try {
      setIsSubmitting(true);
      const timeSpent = Date.now() - screenStartTime;

      // Track onboarding goal creation
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

      // Set user properties for segmentation
      setUserProperties({
        [USER_PROPERTIES.GOAL_TYPE]: selectedGoal.type,
        [USER_PROPERTIES.GOAL_VALUE]: selectedGoal.value,
        [USER_PROPERTIES.ONBOARDING_STEP]: 'value_preview'
      });

      // Track initial goal creation
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_CREATED, {
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value,
        screen: ONBOARDING_SCREENS.GOAL_SETUP,
        time_spent_ms: timeSpent,
        context: 'onboarding'
      });

      // Save goal to user_goals table (this also updates users table for backward compatibility)
      await createOrUpdateGoal(selectedGoal);

      // Continue onboarding
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

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: safeTopPadding
        }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 16, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#111827',
              textAlign: 'center'
            }}>
              How do you want to build <Text style={{ color: '#f97316' }}>consistency?</Text>
            </Text>
            <Tooltip
              text="Start with a goal you can achieve consistently. You can always adjust it later in settings."
              style={{ marginLeft: 8 }}
            />
          </View>
          <Text style={{
            fontSize: 14,
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Choose your accountability approach. We'll provide the support and positive reinforcement.
          </Text>
        </View>

        {/* Enhanced Goal Picker */}
        {!isInitialized ? (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 40,
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Loading your goal...</Text>
          </View>
        ) : (
          <EnhancedGoalPicker
            value={selectedGoal}
            onChange={handleGoalChange}
            style={{ marginBottom: 20 }}
          />
        )}
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
        <DebugSkipButton
          onSkip={() => navigation.navigate('ValuePreview')}
          title="Debug Skip Goal Setup"
        />
      </View>
    </View>
  );
}
