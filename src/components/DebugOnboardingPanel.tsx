import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isDebugMode } from '../lib/debug-mode';
import type { RootStackParamList } from '../../App';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface OnboardingScreen {
  name: keyof RootStackParamList;
  label: string;
  emoji: string;
}

const ONBOARDING_SCREENS: OnboardingScreen[] = [
  { name: 'Onboarding', label: 'Welcome Carousel', emoji: '👋' },
  { name: 'UserInfo', label: 'User Info', emoji: '👤' },
  { name: 'WhyAccountability', label: 'Why Accountability', emoji: '🤔' },
  { name: 'SocialProof', label: 'Social Proof', emoji: '⭐' },
  { name: 'MotivationQuiz', label: 'Motivation Quiz', emoji: '🎯' },
  { name: 'GoalSetup', label: 'Goal Setup', emoji: '🏃‍♂️' },
  { name: 'ValuePreview', label: 'Value Preview', emoji: '📊' },
  { name: 'FitnessAppConnect', label: 'Fitness App Connect', emoji: '📱' },
  { name: 'ContactSetup', label: 'Contact Setup', emoji: '👥' },
  { name: 'MessageStyle', label: 'Message Style', emoji: '💬' },
  { name: 'Paywall', label: 'Paywall', emoji: '💳' },
  { name: 'PaywallFreeTrial', label: 'Free Trial', emoji: '🆓' },
  { name: 'PostPaywallOnboarding', label: 'Post-Paywall Welcome', emoji: '🎉' },
  { name: 'OnboardingSuccess', label: 'Success', emoji: '✅' },
];

export function DebugOnboardingPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigation = useNavigation<Navigation>();

  if (!isDebugMode()) {
    return null;
  }

  const handleNavigate = (screenName: keyof RootStackParamList) => {
    navigation.navigate(screenName);
    setIsExpanded(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.toggleButtonText}>
          🚀 Debug Onboarding {isExpanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.panel} showsVerticalScrollIndicator={false}>
          <Text style={styles.panelTitle}>Jump to Onboarding Screen:</Text>
          {ONBOARDING_SCREENS.map((screen) => (
            <TouchableOpacity
              key={screen.name}
              style={styles.screenButton}
              onPress={() => handleNavigate(screen.name)}
            >
              <Text style={styles.screenButtonText}>
                {screen.emoji} {screen.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 16,
    zIndex: 1000,
    maxWidth: 250,
  },
  toggleButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 4,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '600',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  screenButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  screenButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
});