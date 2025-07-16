import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { GoalPicker } from '@/components/GoalPicker';
import analytics, { ANALYTICS_EVENTS } from '../lib/analytics';

type RootStackParamList = {
  Welcome: undefined;
  GoalSetup: undefined;
  ContactSetup: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'GoalSetup'>;

export function GoalSetupScreen({ navigation }: Props) {
  const { user, updateUser } = useMockAuth();
  const [selectedGoal, setSelectedGoal] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with user's existing goal if available
  useEffect(() => {
    if (user?.goal_per_week) {
      setSelectedGoal(user.goal_per_week);
    }
  }, [user]);

  const handleGoalChange = (goal: number) => {
    try {
      setSelectedGoal(goal);
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
        goal_value: selectedGoal,
        screen: 'goal_setup'
      });
      
      // Update user with the selected goal using mock auth
      await updateUser({ goal_per_week: selectedGoal });
      navigation.navigate('ContactSetup');
    } catch (error) {
      console.error('Failed to save goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <OnboardingStepper currentStep={0} />
      
      <View className="flex-1 px-6 py-8">
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            What's your goal?
          </Text>
          <Text className="text-gray-500 dark:text-gray-400">
            How many runs per week are you committing to?
          </Text>
        </View>
        
        <GoalPicker
          value={selectedGoal}
          onChange={handleGoalChange}
        />
        
        <View className="mt-auto">
          <Button
            onPress={handleNext}
            style={{ width: '100%', paddingVertical: 16, borderRadius: 16 }}
            title="Continue"
            disabled={isSubmitting}
          />
        </View>
      </View>
    </View>
  );
} 