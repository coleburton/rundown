import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TOTAL_STEPS = 10; // Total number of steps in onboarding

const STEP_ICONS = [
  'clipboard-outline',      // Welcome
  'information-circle-outline', // Why Accountability
  'star-outline',           // Social Proof  
  'bulb-outline',           // Motivation Quiz
  'flag-outline',           // Goal Setup
  'eye-outline',            // Value Preview
  'fitness-outline',        // Strava Connect
  'people-outline',         // Contact Setup
  'chatbubble-outline',     // Message Style
  'checkmark-circle-outline' // Success
] as const;

interface StepperProps {
  currentStep: number;
  style?: any;
}

export function OnboardingStepper({ currentStep, style }: StepperProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.progressBar}>
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <View key={index} style={styles.stepContainer}>
            <View
              style={[
                styles.progressDot,
                {
                  backgroundColor: index < currentStep ? '#f97316' : '#e5e7eb',
                },
              ]}
            >
              {index < currentStep ? (
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              ) : (
                <Ionicons 
                  name={STEP_ICONS[index]} 
                  size={14} 
                  color={index < currentStep ? '#ffffff' : '#9ca3af'} 
                />
              )}
            </View>
            {index < TOTAL_STEPS - 1 && (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor: index < currentStep - 1 ? '#f97316' : '#e5e7eb',
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 60, // Safe area top padding
    paddingBottom: 20,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  connector: {
    width: 32,
    height: 2,
    marginHorizontal: 4,
  },
});