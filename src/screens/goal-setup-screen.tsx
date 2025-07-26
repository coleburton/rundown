import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStepper } from '@/components/OnboardingStepper';
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

const GOAL_OPTIONS = [2, 3, 4, 5];

const MOTIVATION_MESSAGES = {
  2: {
    title: 'Great choice!',
    description: 'Perfect for beginners - sustainable and achievable!',
    emoji: '⚖️',
    bgColor: '#dcfce7', // green-100
    textColor: '#16a34a', // green-600
  },
  3: {
    title: 'Great choice!',
    description: 'Perfect for beginners - sustainable and achievable!',
    emoji: '⚖️',
    bgColor: '#dcfce7', // green-100
    textColor: '#16a34a', // green-600
  },
  4: {
    title: 'Getting serious!',
    description: 'You\'re committed to making running a daily habit.',
    emoji: '💪',
    bgColor: '#dcfce7', // green-100
    textColor: '#16a34a', // green-600
  },
  5: {
    title: 'Ambitious!',
    description: 'We like your style. Let\'s crush those goals!',
    emoji: '🚀',
    bgColor: '#dcfce7', // green-100
    textColor: '#16a34a', // green-600
  },
};

export function GoalSetupScreen({ navigation }: Props) {
  const { user, updateUser } = useMockAuth();
  const [selectedGoal, setSelectedGoal] = useState(2);
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
      // Track goal selection in analytics
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_CREATED, { 
        goal_value: goal 
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

  const motivationMessage = MOTIVATION_MESSAGES[selectedGoal as keyof typeof MOTIVATION_MESSAGES] || MOTIVATION_MESSAGES[2];

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <OnboardingStepper currentStep={2} />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 40, marginTop: 20 }}>
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
            How many runs per week are you committing to?
          </Text>
        </View>

        {/* Goal Options Grid */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: 32
        }}>
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = goal === selectedGoal;
            return (
              <TouchableOpacity
                key={goal}
                onPress={() => handleGoalChange(goal)}
                style={{
                  width: '48%',
                  height: 140,
                  marginBottom: 16,
                  borderRadius: 20,
                  backgroundColor: isSelected ? '#f97316' : '#ffffff',
                  borderWidth: isSelected ? 3 : 1,
                  borderColor: isSelected ? '#2563eb' : '#e5e7eb', // blue border when selected
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <Text style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: isSelected ? '#ffffff' : '#111827',
                  marginBottom: 4
                }}>
                  {goal}
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: isSelected ? '#ffffff' : '#6b7280'
                }}>
                  runs
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Motivation Message */}
        {selectedGoal && (
          <View style={{
            backgroundColor: motivationMessage.bgColor,
            borderRadius: 16,
            padding: 20,
            marginBottom: 40,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>
              {motivationMessage.emoji}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: motivationMessage.textColor,
                marginBottom: 4
              }}>
                {motivationMessage.title}
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6b7280'
              }}>
                {motivationMessage.description}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={{ 
        padding: 16, 
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
      }}>
        <Button
          onPress={handleNext}
          size="lg"
          title="Continue →"
          disabled={isSubmitting}
          style={{ 
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}
        />
      </View>
    </View>
  );
}