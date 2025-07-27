import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Button } from '@/components/ui/button';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import analytics, { ANALYTICS_EVENTS } from '../lib/analytics';
import Svg, { Circle } from 'react-native-svg';

type RootStackParamList = {
  GoalSetup: undefined;
  ValuePreview: undefined;
  FitnessAppConnect: undefined;
  ContactSetup: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ValuePreview'>;

// Mock Progress Ring Component
const MockProgressRing = ({ progress, goal }: { progress: number; goal: number }) => {
  const [animatedValue] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, []);

  const progressPercentage = (progress / goal) * 100;
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
  
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          <Animated.Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10b981"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, strokeDashoffset],
            })}
            strokeLinecap="round"
          />
        </Svg>
        
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
            {progress}
          </Text>
          <Text style={{ fontSize: 10, color: '#6b7280' }}>
            of {goal} runs
          </Text>
          {progress >= goal && (
            <Text style={{ fontSize: 16, marginTop: 2 }}>🔥</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export function ValuePreviewScreen({ navigation }: Props) {
  const { user } = useMockAuth();
  const insets = useSafeAreaInsets();
  const [currentPreview, setCurrentPreview] = useState(0);
  
  // Get user's goal for personalization
  const userGoal = user?.goal_value || user?.goal_per_week || 3;
  const goalType = user?.goal_type || 'runs';
  
  const previews = [
    {
      title: "Your personal dashboard",
      subtitle: "Track progress in real-time",
      component: (
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 20,
          marginHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
              Hey {user?.name?.split(' ')[0] || 'Runner'} 👋
            </Text>
            <View style={{ 
              backgroundColor: '#f3f4f6',
              borderRadius: 16, 
              width: 32, 
              height: 32,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={{ fontSize: 14 }}>⚙️</Text>
            </View>
          </View>
          
          <MockProgressRing progress={2} goal={userGoal} />
          
          <View style={{
            backgroundColor: '#f0fdf4',
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: '#bbf7d0'
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#166534',
              textAlign: 'center',
              marginBottom: 4
            }}>
              On track! 🎯
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#16a34a',
              textAlign: 'center'
            }}>
              {userGoal - 2} more {goalType === 'runs' ? 'runs' : 'workouts'} this week to hit your goal
            </Text>
          </View>
        </View>
      )
    },
    {
      title: "Accountability in action",
      subtitle: "Your buddy gets notified when you need support",
      component: (
        <View style={{
          backgroundColor: '#f3f4f6',
          borderRadius: 16,
          padding: 16,
          marginHorizontal: 8,
          minHeight: 200
        }}>
          {/* Phone header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ 
              width: 28, 
              height: 28, 
              backgroundColor: '#f97316', 
              borderRadius: 14, 
              marginRight: 8,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>R</Text>
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Rundown</Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>now</Text>
            </View>
          </View>

          {/* Message bubble */}
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            borderBottomLeftRadius: 4,
            padding: 14,
            marginBottom: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
          }}>
            <Text style={{ fontSize: 14, color: '#111827', lineHeight: 20 }}>
              Hey! {user?.name?.split(' ')[0] || 'Your buddy'} missed their {goalType === 'runs' ? 'run' : 'workout'} today. 
              {user?.motivation_type === 'friendly_competition' 
                ? ' Time to bring the competitive spirit! 🏃‍♂️💨'
                : user?.motivation_type === 'avoiding_guilt'
                ? ' Maybe send some gentle encouragement? 💪'
                : ' They could use some motivation! 🔥'
              }
            </Text>
          </View>

          <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>
            Only sent when goals are missed • Never spam
          </Text>
        </View>
      )
    },
    {
      title: "Your streak building",
      subtitle: "Watch your consistency grow week by week",
      component: (
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 20,
          marginHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16, textAlign: 'center' }}>
            8-Week Goal History
          </Text>
          
          {/* Weekly blocks simulation */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            {[
              { status: 'met', week: 'W1' },
              { status: 'met', week: 'W2' },
              { status: 'partial', week: 'W3' },
              { status: 'met', week: 'W4' },
              { status: 'met', week: 'W5' },
              { status: 'met', week: 'W6' },
              { status: 'met', week: 'W7' },
              { status: 'current', week: 'W8' }
            ].map((week, index) => {
              const blockColor = 
                week.status === 'met' ? '#10b981' :
                week.status === 'partial' ? '#f59e0b' :
                week.status === 'current' ? '#3b82f6' : '#e5e7eb';
              
              return (
                <View key={index} style={{ alignItems: 'center' }}>
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    backgroundColor: blockColor,
                    borderRadius: 4,
                    marginBottom: 4,
                    borderWidth: week.status === 'current' ? 2 : 0,
                    borderColor: '#111827'
                  }} />
                  <Text style={{ fontSize: 8, color: '#6b7280' }}>
                    {week.week}
                  </Text>
                </View>
              );
            })}
          </View>
          
          <View style={{ alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 14, color: '#15803d', fontWeight: '600' }}>
              6 week streak! 🔥
            </Text>
            <Text style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>
              You're building an amazing habit
            </Text>
          </View>
        </View>
      )
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPreview((prev) => (prev + 1) % previews.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
      button_name: 'continue_from_value_preview',
      screen: 'value_preview'
    });
    navigation.navigate('FitnessAppConnect');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <OnboardingStepper currentStep={5} />
      
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
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: '#111827', 
            textAlign: 'center',
            marginBottom: 8
          }}>
            Here's your experience
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: 24
          }}>
            This is what accountability looks like when it's done right.
          </Text>
        </View>

        {/* Preview Carousel */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ minHeight: 300, justifyContent: 'center' }}>
            {previews[currentPreview].component}
          </View>
          
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#111827',
              marginBottom: 4,
              textAlign: 'center'
            }}>
              {previews[currentPreview].title}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: 16
            }}>
              {previews[currentPreview].subtitle}
            </Text>
            
            {/* Carousel indicators */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {previews.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: index === currentPreview ? '#f97316' : '#e5e7eb'
                  }}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Benefits List */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            What you get
          </Text>
          
          <View style={{ gap: 12 }}>
            {[
              { icon: '📊', text: 'Real-time progress tracking' },
              { icon: '🎯', text: 'Personalized goal management' },
              { icon: '💬', text: 'Smart accountability messages' },
              { icon: '📈', text: 'Streak building & motivation' },
              { icon: '🔒', text: 'Complete privacy control' }
            ].map((benefit, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 16
              }}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>{benefit.icon}</Text>
                <Text style={{
                  fontSize: 14,
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {benefit.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Excitement Builder */}
        <View style={{
          backgroundColor: '#fef3e2',
          borderRadius: 16,
          padding: 20,
          borderLeftWidth: 4,
          borderLeftColor: '#f97316',
          marginBottom: 32
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#9a3412',
            marginBottom: 8,
            textAlign: 'center'
          }}>
            Ready to make it official? ⚡
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#c2410c',
            textAlign: 'center',
            lineHeight: 20
          }}>
            Connect your fitness app and choose your accountability buddy. 
            Your {userGoal} {goalType === 'runs' ? 'runs' : 'workouts'} per week goal is waiting.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleNext}
          size="lg"
          title="Let's connect your fitness app →"
          style={ONBOARDING_BUTTON_STYLE}
        />
      </View>
    </View>
  );
}