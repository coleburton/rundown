import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
  GoalSetup: { fromSettings?: boolean };
  MotivationQuiz: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
  OnboardingSuccess: undefined;
  Dashboard: undefined;
  Settings: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'GoalSetup'>;

export function GoalSetupScreen({ navigation, route }: Props) {
  const { user, updateUser } = useMockAuth();
  const insets = useSafeAreaInsets();
  const fromSettings = route.params?.fromSettings;
  const [selectedGoal, setSelectedGoal] = useState<Goal>({ 
    type: 'total_activities', 
    value: 3 
  });
  const [originalGoal, setOriginalGoal] = useState<Goal>({ 
    type: 'total_activities', 
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
      const initialGoal = {
        type: user.goal_type || 'total_activities',
        value: user.goal_value || user.goal_per_week || 3
      };
      setSelectedGoal(initialGoal);
      setOriginalGoal(initialGoal);
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
    
    // If coming from settings and goal has changed, show confirmation
    if (fromSettings && (selectedGoal.type !== originalGoal.type || selectedGoal.value !== originalGoal.value)) {
      Alert.alert(
        'Update Goal',
        'Are you sure you want to update your weekly goal? This will affect your accountability tracking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update Goal', onPress: () => saveGoal() }
        ]
      );
      return;
    }
    
    // If not from settings or no change, proceed directly
    await saveGoal();
  };

  const saveGoal = async () => {
    try {
      setIsSubmitting(true);
      const timeSpent = Date.now() - screenStartTime;
      
      if (!fromSettings) {
        // Track screen completion for onboarding
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
      }
      
      // Track goal confirmation
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_CREATED, {
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value,
        screen: fromSettings ? 'Settings' : ONBOARDING_SCREENS.GOAL_SETUP,
        time_spent_ms: timeSpent,
        from_settings: fromSettings
      });
      
      // Update user with the selected goal using mock auth
      await updateUser({ 
        goal_per_week: selectedGoal.value, // Keep legacy field for backwards compatibility
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value
      });
      
      if (fromSettings) {
        navigation.goBack(); // Go back to settings
      } else {
        navigation.navigate('ValuePreview'); // Continue onboarding
      }
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: fromSettings ? 'Settings' : ONBOARDING_SCREENS.GOAL_SETUP,
        action: 'save_goal',
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value,
        from_settings: fromSettings
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
            {fromSettings ? 'Update Your Goal' : 'How do you want to build '}
            {!fromSettings && <Text style={{ color: '#f97316' }}>consistency?</Text>}
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#6b7280',
            textAlign: 'center'
          }}>
            {fromSettings 
              ? 'Adjust your weekly fitness goal to better match your current routine.'
              : 'Choose your accountability approach. We\'ll provide the support and positive reinforcement.'
            }
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
          title={fromSettings ? 'Save Changes' : 'Continue →'}
          disabled={isSubmitting}
          style={ONBOARDING_BUTTON_STYLE}
        />
      </View>
    </View>
  );
}