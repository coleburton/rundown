import { DebugSkipButton } from '@/components/DebugSkipButton';
import { Button } from '@/components/ui/button';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { TYPOGRAPHY_STYLES } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { IconComponent } from '@/components/ui/IconComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MESSAGE_TEMPLATES, formatMessage } from '../lib/message-templates';
import { OnboardingBackButton } from '@/components/OnboardingBackButton';
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
  icon: string;
  color: string;
}

const getStyleOptions = (userName: string): StyleOption[] => [
  {
    id: 'supportive',
    title: 'Supportive Friend',
    description: 'Gentle nudges and encouragement',
    example: formatMessage(
      MESSAGE_TEMPLATES.supportive['missed-goal'][1], 
      { user: userName, goalType: 'runs' }
    ),
    icon: 'Heart',
    color: '#f59e0b',
  },
  {
    id: 'snarky',
    title: 'Snarky Buddy',  
    description: 'Playful sass and teasing',
    example: formatMessage(
      MESSAGE_TEMPLATES.snarky['missed-goal'][0], 
      { user: userName, goalType: 'runs' }
    ),
    icon: 'Smile',
    color: '#8b5cf6',
  },
  {
    id: 'competitive',
    title: 'Competitive Coach',
    description: 'Challenge them to step up',
    example: formatMessage(
      MESSAGE_TEMPLATES.competitive['missed-goal'][0], 
      { user: userName, goalType: 'runs' }
    ),
    icon: 'Zap',
    color: '#3b82f6',
  },
  {
    id: 'achievement',
    title: 'Goal Tracker',
    description: 'Focus on milestones and progress',
    example: formatMessage(
      MESSAGE_TEMPLATES.achievement['missed-goal'][0], 
      { user: userName, goalType: 'runs' }
    ),
    icon: 'Target',
    color: '#10b981',
  },
  {
    id: 'chaotic',
    title: 'Chaotic Energy',
    description: 'Unpredictable and hilarious', 
    example: formatMessage(
      MESSAGE_TEMPLATES.chaotic['missed-goal'][0], 
      { user: userName, goalType: 'runs' }
    ),
    icon: 'Sparkles',
    color: '#ef4444',
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
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const safeTopPadding = Math.max(insets.top, 16);
  const [selectedStyle, setSelectedStyle] = useState<MessageStyle>('supportive');
  const [recommendedStyle, setRecommendedStyle] = useState<MessageStyle>('supportive');
  const [screenStartTime] = useState(Date.now());
  
  // Get user's first name with multiple fallback options
  const userName = user?.first_name || user?.name?.split(' ')[0] || 'Alex';
  const STYLE_OPTIONS = getStyleOptions(userName);

  // Track screen view on mount
  useEffect(() => {
    try {
      trackOnboardingScreenView(ONBOARDING_SCREENS.MESSAGE_STYLE, {
        step_number: 8,
        total_steps: 9
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_MESSAGE_STYLE_STARTED);
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
        analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_MESSAGE_STYLE_RECOMMENDED, {
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
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_MESSAGE_STYLE_SELECTED, {
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

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Back Button */}
      <View style={{ position: 'absolute', top: safeTopPadding, left: 0, right: 0, zIndex: 10 }}>
        <OnboardingBackButton />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: safeTopPadding
        }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 16, marginTop: 48 }}>
          <Text style={[TYPOGRAPHY_STYLES.h2, {
            color: '#111827',
            textAlign: 'center',
            marginBottom: 8
          }]}>
            Choose your <Text style={{ color: '#f97316' }}>motivation</Text> style
          </Text>
          <Text style={[TYPOGRAPHY_STYLES.body1, {
            color: '#6b7280',
            textAlign: 'center'
          }]}>
            How should your buddy motivate you when you skip a run?
          </Text>
        </View>

        {/* Style Options */}
        <View style={{ gap: 12, marginBottom: 8 }}>
          {STYLE_OPTIONS.map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
              <TouchableOpacity
                key={style.id}
                onPress={() => setSelectedStyle(style.id)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: isSelected ? '#fef3e2' : '#ffffff',
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? '#f97316' : '#e5e7eb',
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2
                }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isSelected ? style.color : '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  flexShrink: 0
                }}>
                  <IconComponent
                    library="Lucide"
                    name={style.icon}
                    size={20}
                    color={isSelected ? '#ffffff' : style.color}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={[TYPOGRAPHY_STYLES.h5, { color: '#111827' }]}>
                      {style.title}
                    </Text>
                    {style.id === recommendedStyle && (
                      <View style={{
                        backgroundColor: '#22c55e',
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        marginLeft: 8
                      }}>
                        <Text style={{
                          fontSize: 10,
                          color: '#ffffff',
                          fontWeight: '700',
                          letterSpacing: 0.5
                        }}>
                          SUGGESTED
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[TYPOGRAPHY_STYLES.body2, { color: '#6b7280' }]}>
                    {style.description}
                  </Text>
                </View>

                {/* Radio Button Indicator */}
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? '#f97316' : '#d1d5db',
                  backgroundColor: isSelected ? '#f97316' : '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 12,
                  flexShrink: 0
                }}>
                  {isSelected && (
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#ffffff'
                    }} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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
