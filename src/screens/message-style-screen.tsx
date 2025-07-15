import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { MessagePreview } from '@/components/MessagePreview';

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
  preview: string[];
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'supportive',
    title: 'Supportive Friend',
    description: 'Gentle nudges and encouragement',
    example: 'Hey, noticed you missed your run today. You got this! 💪',
    preview: [
      "Hey! Just checking in 👋",
      "Noticed you missed your run today",
      "No worries, tomorrow is a new day! 💪",
      "You've got this! Let's crush that goal 🎯",
    ],
  },
  {
    id: 'snarky',
    title: 'Snarky Buddy',
    description: 'Playful sass and teasing',
    example: 'Another Netflix marathon instead of an actual marathon? 🙄',
    preview: [
      "Well, well, well... 👀",
      "Another Netflix marathon instead of an actual marathon? 🙄",
      "Your running shoes are getting jealous of your couch 🛋️",
      "Time to prove me wrong! 💅",
    ],
  },
  {
    id: 'chaotic',
    title: 'Chaotic Energy',
    description: 'Unpredictable and hilarious',
    example: 'ALERT: Your friend chose couch over cardio. Send memes! 🚨',
    preview: [
      "🚨 ALERT 🚨",
      "Your friend chose couch over cardio!",
      "Requesting backup! Send motivation memes! 📱",
      "Don't make me call your mom! 😈",
    ],
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

      // For mock data, we'll use the updateUser function
      await updateUser({ message_style: selectedStyle });
      
      // Navigate to the success screen instead of dashboard
      navigation.navigate('OnboardingSuccess');
    } catch (error) {
      console.error('Failed to save message style:', error);
    }
  };

  const selectedOption = STYLE_OPTIONS.find(style => style.id === selectedStyle);

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <OnboardingStepper currentStep={2} />

      <View className="flex-1">
        {/* Headline */}
        <View className="px-6 space-y-4 mb-8">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            Choose your shame style
          </Text>
          <Text className="text-gray-600 dark:text-gray-300 text-center">
            How should we message your accountability buddy?
          </Text>
        </View>

        {/* Message Preview */}
        {selectedOption && (
          <MessagePreview messages={selectedOption.preview} />
        )}

        {/* Style Options */}
        <View className="px-6 space-y-4">
          {STYLE_OPTIONS.map((style) => (
            <TouchableOpacity
              key={style.id}
              onPress={() => setSelectedStyle(style.id)}
              className={`p-4 rounded-xl border-2 ${
                selectedStyle === style.id
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <View className="space-y-2">
                <Text
                  className={`font-medium ${
                    selectedStyle === style.id
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {style.title}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {style.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Finish Button */}
      <View className="p-6">
        <Button
          onPress={handleFinish}
          style={{ width: '100%', paddingVertical: 16 }}
          title="Let's Get Running!"
        />
      </View>
    </View>
  );
} 