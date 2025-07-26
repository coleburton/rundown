import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { EnhancedGoalPicker, Goal } from '@/components/EnhancedGoalPicker';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import analytics, { ANALYTICS_EVENTS } from '../lib/analytics';

type RootStackParamList = {
  Welcome: undefined;
  WhyAccountability: undefined;
  GoalSetup: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
  OnboardingSuccess: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'GoalSetup'>;

export function GoalSetupScreen({ navigation }: Props) {
  const { user, updateUser } = useMockAuth();
  const [selectedGoal, setSelectedGoal] = useState<Goal>({ 
    type: 'runs', 
    value: 3 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with user's existing goal if available
  useEffect(() => {
    if (user) {
      setSelectedGoal({
        type: user.goal_type || 'runs',
        value: user.goal_value || user.goal_per_week || 3
      });
    }
  }, [user]);

  const handleGoalChange = (goal: Goal) => {
    try {
      setSelectedGoal(goal);
      // Track goal selection in analytics
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_CREATED, { 
        goal_type: goal.type,
        goal_value: goal.value 
      });
    } catch (error) {
      console.error('Error setting goal:', error);
    }
  };

  const handleNext = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Track goal confirmation
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_CREATED, {
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value,
        screen: 'goal_setup'
      });
      
      // Update user with the selected goal using mock auth
      await updateUser({ 
        goal_per_week: selectedGoal.type === 'runs' ? selectedGoal.value : 3, // Keep legacy field for backwards compatibility
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value
      });
      navigation.navigate('ContactSetup');
    } catch (error) {
      console.error('Failed to save goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <OnboardingStepper currentStep={2} />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 20 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: '#111827', 
            textAlign: 'center',
            marginBottom: 8
          }}>
            What's your <Text style={{ color: '#f97316' }}>goal?</Text>
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Choose your activity type and weekly target
          </Text>
        </View>

        {/* Enhanced Goal Picker */}
        <EnhancedGoalPicker 
          value={selectedGoal}
          onChange={handleGoalChange}
          style={{ marginBottom: 40 }}
        />
      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={ONBOARDING_CONTAINER_STYLE}>
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