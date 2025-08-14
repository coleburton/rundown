import { OnboardingStepper } from '@/components/OnboardingStepper';
import { DebugSkipButton } from '@/components/DebugSkipButton';
import { Button } from '@/components/ui/button';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { VectorIcon } from '@/components/ui/IconComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  MotivationQuiz: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
  OnboardingSuccess: undefined;
  Dashboard: undefined;
  Paywall: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'MessageStyle'>;

type MessageStyle = 'supportive' | 'snarky' | 'chaotic' | 'competitive' | 'achievement';

interface StyleOption {
  id: MessageStyle;
  title: string;
  description: string;
  example: string;
  emoji: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'supportive',
    title: 'Supportive Friend',
    description: 'Gentle nudges and encouragement',
    example: 'Hey! Looks like Alex missed their run today. Maybe send them some encouragement?',
    emoji: '🤗',
  },
  {
    id: 'snarky',
    title: 'Snarky Buddy',  
    description: 'Playful sass and teasing',
    example: 'Your running buddy Alex is making excuses again. Time for some tough love!',
    emoji: '😏',
  },
  {
    id: 'competitive',
    title: 'Competitive Coach',
    description: 'Challenge them to step up',
    example: 'Alex skipped their run today. Think they can handle a challenge to get back on track?',
    emoji: '⚡',
  },
  {
    id: 'achievement',
    title: 'Goal Tracker',
    description: 'Focus on milestones and progress',
    example: 'Alex missed their run today and is 1 day behind their weekly goal. Help them get back on track?',
    emoji: '🎯',
  },
  {
    id: 'chaotic',
    title: 'Chaotic Energy',
    description: 'Unpredictable and hilarious', 
    example: 'EMERGENCY! Alex\'s running shoes are getting dusty! Intervention needed ASAP!',
    emoji: '🤪',
  },
];

const getRecommendedStyle = (motivationType: string | null): MessageStyle => {
  switch (motivationType) {
    case 'friendly_competition':
      return 'competitive';
    case 'proving_yourself':
      return 'snarky';
    case 'reaching_milestones':
      return 'achievement';
    case 'avoiding_guilt':
    case 'building_habits':
    default:
      return 'supportive';
  }
};

export function MessageStyleScreen({ navigation }: Props) {
  const { user, updateUser } = useMockAuth();
  const insets = useSafeAreaInsets();
  const [selectedStyle, setSelectedStyle] = useState<MessageStyle>('supportive');
  const [recommendedStyle, setRecommendedStyle] = useState<MessageStyle>('supportive');
  const [screenStartTime] = useState(Date.now());

  // Track screen view on mount
  useEffect(() => {
    try {
      trackOnboardingScreenView(ONBOARDING_SCREENS.MESSAGE_STYLE, {
        step_number: 8,
        total_steps: 9
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.MESSAGE_STYLE_STARTED);
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.MESSAGE_STYLE,
        action: 'screen_view_tracking'
      });
    }
  }, []);

  useEffect(() => {
    if (user?.motivation_type) {
      const recommended = getRecommendedStyle(user.motivation_type);
      setRecommendedStyle(recommended);
      setSelectedStyle(recommended);
      
      try {
        analytics.trackEvent(ANALYTICS_EVENTS.MESSAGE_STYLE_RECOMMENDED, {
          motivation_type: user.motivation_type,
          recommended_style: recommended,
          screen: ONBOARDING_SCREENS.MESSAGE_STYLE
        });
      } catch (error) {
        trackOnboardingError(error as Error, {
          screen: ONBOARDING_SCREENS.MESSAGE_STYLE,
          action: 'style_recommendation'
        });
      }
    }
  }, [user?.motivation_type]);

  const handleFinish = async () => {
    try {
      if (!user) {
        console.error('User is null');
        return;
      }
      
      const timeSpent = Date.now() - screenStartTime;
      
      // Track screen completion
      trackOnboardingScreenCompleted(ONBOARDING_SCREENS.MESSAGE_STYLE, {
        time_spent_ms: timeSpent,
        time_spent_seconds: Math.round(timeSpent / 1000),
        step_number: 8,
        total_steps: 9,
        selected_style: selectedStyle,
        recommended_style: recommendedStyle,
        changed_from_recommended: selectedStyle !== recommendedStyle
      });
      
      // Track funnel progression
      trackFunnelStep(ONBOARDING_SCREENS.MESSAGE_STYLE, 8, 9, {
        time_spent_ms: timeSpent,
        selected_style: selectedStyle,
        recommended_style: recommendedStyle
      });
      
      // Track message style selection
      analytics.trackEvent(ANALYTICS_EVENTS.MESSAGE_STYLE_SELECTED, {
        selected_style: selectedStyle,
        recommended_style: recommendedStyle,
        changed_from_recommended: selectedStyle !== recommendedStyle,
        screen: ONBOARDING_SCREENS.MESSAGE_STYLE,
        time_spent_ms: timeSpent
      });
      
      // Set user properties for segmentation
      setUserProperties({
        [USER_PROPERTIES.MESSAGE_STYLE]: selectedStyle,
        [USER_PROPERTIES.ONBOARDING_STEP]: 'paywall'
      });

      await updateUser({ 
        message_style: selectedStyle
      });
      navigation.navigate('Paywall');
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.MESSAGE_STYLE,
        action: 'finish_selection',
        selected_style: selectedStyle
      });
      console.error('Failed to save message style:', error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const selectedOption = STYLE_OPTIONS.find(style => style.id === selectedStyle);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <OnboardingStepper currentStep={10} />
      
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
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ 
            fontSize: 26, 
            fontWeight: 'bold', 
            color: '#111827', 
            textAlign: 'center',
            marginBottom: 6
          }}>
            Choose your motivation style
          </Text>
          <Text style={{ 
            fontSize: 15, 
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: 20
          }}>
            How should your buddy motivate you when you skip a run?
          </Text>
        </View>

        {/* Message Preview */}
        <View style={{ 
          backgroundColor: '#f9fafb', 
          borderRadius: 12, 
          padding: 10, 
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#e5e7eb'
        }}>
          <Text style={{
            fontSize: 11,
            color: '#6b7280',
            fontWeight: '600',
            marginBottom: 6,
            textAlign: 'center'
          }}>
            Your buddy will receive this text:
          </Text>
          
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 8,
            padding: 8,
            borderWidth: 1,
            borderColor: '#d1d5db'
          }}>
            <Text style={{ 
              fontSize: 13, 
              color: '#111827',
              lineHeight: 17
            }}>
              {selectedOption?.example}
            </Text>
          </View>
        </View>


        {/* Recommendation Note */}
        {recommendedStyle && (
          <View style={{
            backgroundColor: '#f0fdf4',
            borderRadius: 8,
            padding: 8,
            borderLeftWidth: 3,
            borderLeftColor: '#22c55e',
            marginBottom: 10
          }}>
            <Text style={{
              fontSize: 11,
              color: '#15803d',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              Based on your motivation style, we suggest {STYLE_OPTIONS.find(s => s.id === recommendedStyle)?.title}
            </Text>
          </View>
        )}

        {/* Style Options */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: 5
          }}>
            Choose your preferred style:
          </Text>
          {STYLE_OPTIONS.map((style) => (
            <TouchableOpacity
              key={style.id}
              onPress={() => setSelectedStyle(style.id)}
              style={{
                backgroundColor: selectedStyle === style.id ? '#fef3e2' : '#f9fafb',
                borderWidth: 2,
                borderColor: selectedStyle === style.id ? '#f97316' : '#e5e7eb',
                borderRadius: 12,
                padding: 10,
                marginBottom: 4,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: selectedStyle === style.id ? '#f97316' : '#e5e7eb',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8
              }}>
                <VectorIcon emoji={style.emoji} size={13} color="#ffffff" />
              </View>
              
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {style.title}
                  </Text>
                  {style.id === recommendedStyle && (
                    <View style={{
                      backgroundColor: '#22c55e',
                      borderRadius: 8,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      marginLeft: 8
                    }}>
                      <Text style={{
                        fontSize: 8,
                        color: '#ffffff',
                        fontWeight: '600'
                      }}>
                        SUGGESTED
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  lineHeight: 14
                }}>
                  {style.description}
                </Text>
              </View>
              
              {selectedStyle === style.id && (
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#f97316',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <VectorIcon emoji="✓" size={9} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleFinish}
          size="lg"
          title="Let's Get Running!"
          style={ONBOARDING_BUTTON_STYLE}
        />
        <DebugSkipButton 
          onSkip={() => navigation.navigate('Paywall')}
          title="Debug Skip Message Style"
        />
      </View>
    </View>
  );
}