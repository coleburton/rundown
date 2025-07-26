import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStepper } from '@/components/OnboardingStepper';

type RootStackParamList = {
  ContactSetup: undefined;
  MessageStyle: undefined;
  OnboardingSuccess: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'MessageStyle'>;

type MessageStyle = 'supportive' | 'snarky' | 'chaotic';

interface StyleOption {
  id: MessageStyle;
  title: string;
  description: string;
  example: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'supportive',
    title: 'Supportive Friend',
    description: 'Gentle nudges and encouragement',
    example: 'Hey! Sarah was supposed to run today but skipped it. Maybe send some encouragement?',
  },
  {
    id: 'snarky',
    title: 'Snarky Buddy',
    description: 'Playful sass and teasing',
    example: 'Your buddy Sarah is making excuses again instead of running. Time for some tough love!',
  },
  {
    id: 'chaotic',
    title: 'Chaotic Energy',
    description: 'Unpredictable and hilarious',
    example: 'EMERGENCY! 🚨 Sarah\'s running shoes are getting dusty! Intervention needed ASAP!',
  },
];

export function MessageStyleScreen({ navigation }: Props) {
  const { user, updateUser } = useMockAuth();
  const [selectedStyle, setSelectedStyle] = useState<MessageStyle>('supportive');

  const handleFinish = async () => {
    try {
      if (!user) {
        console.error('User is null');
        return;
      }

      await updateUser({ message_style: selectedStyle });
      navigation.navigate('OnboardingSuccess');
    } catch (error) {
      console.error('Failed to save message style:', error);
    }
  };

  const selectedOption = STYLE_OPTIONS.find(style => style.id === selectedStyle);

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <OnboardingStepper currentStep={4} />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
            Choose your shame style
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            Pick message tone
          </Text>
        </View>

        {/* Message Preview */}
        <View style={{ 
          backgroundColor: '#e5e7eb', 
          borderRadius: 16, 
          padding: 12, 
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1
        }}>
          {/* Header with avatar and name bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ 
              width: 32, 
              height: 32, 
              backgroundColor: '#000', 
              borderRadius: 16, 
              marginRight: 10 
            }} />
            <View style={{ 
              flex: 1, 
              height: 10, 
              backgroundColor: '#000', 
              borderRadius: 5,
              maxWidth: 120
            }} />
          </View>

          {/* Messages */}
          <View style={{ gap: 6 }}>
            {/* Incoming message */}
            <View style={{ alignSelf: 'flex-start', maxWidth: '75%' }}>
              <View style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                borderBottomLeftRadius: 4,
                padding: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1
              }}>
                <Text style={{ fontSize: 12, color: '#111827' }}>
                  {selectedOption?.example}
                </Text>
              </View>
            </View>

            {/* Outgoing message */}
            <View style={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
              <View style={{
                backgroundColor: '#f97316',
                borderRadius: 16,
                borderBottomRightRadius: 4,
                padding: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2
              }}>
                <Text style={{ fontSize: 12, color: '#ffffff' }}>
                  Noticed you missed your run today
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Style Options */}
        <View style={{ gap: 10, marginBottom: 20 }}>
          {STYLE_OPTIONS.map((style) => (
            <TouchableOpacity
              key={style.id}
              onPress={() => setSelectedStyle(style.id)}
              style={{
                backgroundColor: selectedStyle === style.id ? '#fef3e2' : '#ffffff',
                borderWidth: 1,
                borderColor: selectedStyle === style.id ? '#f97316' : '#e5e7eb',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'flex-start',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1
              }}
            >
              {/* Radio button */}
              <View style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: selectedStyle === style.id ? '#f97316' : '#9ca3af',
                backgroundColor: selectedStyle === style.id ? '#f97316' : 'transparent',
                marginRight: 10,
                marginTop: 2,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {selectedStyle === style.id && (
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#ffffff'
                  }} />
                )}
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: '#111827',
                  marginBottom: 2
                }}>
                  {style.title}
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#6b7280'
                }}>
                  {style.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing for button */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={{ 
        padding: 16, 
        backgroundColor: '#f3f4f6',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
      }}>
        <Button
          onPress={handleFinish}
          size="lg"
          title="Let's Get Running!"
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