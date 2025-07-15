import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { GoalPicker } from '@/components/GoalPicker';

type RootStackParamList = {
  Welcome: undefined;
  GoalSetup: undefined;
  ContactSetup: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'GoalSetup'>;

export function GoalSetupScreen({ navigation }: Props) {
  const { user, updateUser } = useMockAuth();
  const [selectedGoal, setSelectedGoal] = useState(3);

  const handleNext = async () => {
    try {
      // Update user with the selected goal using mock auth
      await updateUser({ goal_per_week: selectedGoal });
      navigation.navigate('ContactSetup');
    } catch (error) {
      console.error('Failed to save goal:', error);
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
          onChange={setSelectedGoal}
        />
        
        <View className="mt-auto">
          <Button
            onPress={handleNext}
            style={{ width: '100%', paddingVertical: 16, borderRadius: 16 }}
            title="Continue"
          />
        </View>
      </View>
    </View>
  );
} 