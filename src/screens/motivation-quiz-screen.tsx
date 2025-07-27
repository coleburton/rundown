import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import analytics, { ANALYTICS_EVENTS } from '../lib/analytics';

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
  emoji: string;
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
  const [selectedMotivation, setSelectedMotivation] = useState<MotivationType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMotivationSelect = (motivation: MotivationType) => {
    setSelectedMotivation(motivation);
    
    // Track motivation selection
    analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
      button_name: 'motivation_select',
      motivation_type: motivation,
      screen: 'motivation_quiz'
    });
  };

  const handleNext = async () => {
    if (!selectedMotivation || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Track motivation confirmation
      analytics.trackEvent(ANALYTICS_EVENTS.USER_PREFERENCE_SET, {
        preference_type: 'motivation',
        preference_value: selectedMotivation,
        screen: 'motivation_quiz'
      });
      
      // Update user with the selected motivation
      await updateUser({ 
        motivation_type: selectedMotivation,
        onboarding_step: 'goal_setup'
      });
      
      navigation.navigate('GoalSetup');
    } catch (error) {
      console.error('Failed to save motivation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Track skip action
      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'skip_motivation_quiz',
        screen: 'motivation_quiz'
      });
      
      await updateUser({ onboarding_step: 'goal_setup' });
      navigation.navigate('GoalSetup');
    } catch (error) {
      console.error('Failed to skip motivation quiz:', error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <OnboardingStepper currentStep={3} />
      
      {/* Back Button */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
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
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8 }}>
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
                <Text style={{ fontSize: 16 }}>{option.emoji}</Text>
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
              
              {selectedMotivation === option.id && (
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#f97316',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                </View>
              )}
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
            🧠 This helps us tailor your reminders and celebration style
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
      </View>
    </View>
  );
}