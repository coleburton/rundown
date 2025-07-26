import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';

type RootStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  WhyAccountability: undefined;
  GoalSetup: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
  OnboardingSuccess: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'WhyAccountability'>;

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    icon: '👥',
    title: '65% more likely to succeed',
    description: 'Studies show accountability partners dramatically increase goal achievement'
  },
  {
    icon: '🎯',
    title: 'Stay consistent',
    description: 'Regular check-ins help you build lasting habits and routines'
  },
  {
    icon: '📈',
    title: 'Track progress together',
    description: 'Share wins, learn from setbacks, and celebrate milestones'
  },
  {
    icon: '❤️',
    title: 'Build stronger relationships',
    description: 'Strengthen bonds while pursuing your fitness goals together'
  }
];

export function WhyAccountabilityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  
  const handleContinue = () => {
    navigation.navigate('GoalSetup');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <OnboardingStepper currentStep={1} />
      
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
            Why accountability <Text style={{ color: '#f97316' }}>works</Text>
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Science-backed benefits of having a fitness buddy
          </Text>
        </View>

        {/* Benefits */}
        <View style={{ gap: 16, marginBottom: 40 }}>
          {benefits.map((benefit, index) => (
            <View key={index} style={{
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 16,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'flex-start',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2
            }}>
              {/* Icon */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#f97316',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                flexShrink: 0
              }}>
                <Text style={{ fontSize: 20 }}>{benefit.icon}</Text>
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: '#111827',
                  marginBottom: 4
                }}>
                  {benefit.title}
                </Text>
                <Text style={{ 
                  fontSize: 15, 
                  color: '#6b7280',
                  lineHeight: 22
                }}>
                  {benefit.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleContinue}
          size="lg"
          title="I'm convinced! →"
          style={ONBOARDING_BUTTON_STYLE}
        />
      </View>
    </View>
  );
}