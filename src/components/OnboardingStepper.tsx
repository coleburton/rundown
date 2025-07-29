import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TOTAL_STEPS = 10; // Total number of steps in onboarding

const STEP_ICONS = [
  'person-outline',         // User Info (step 1)
  'key-outline',            // Login (step 2)
  'information-circle-outline', // Why Accountability (step 3)
  'star-outline',           // Social Proof (step 4)
  'bulb-outline',           // Motivation Quiz (step 5)
  'flag-outline',           // Goal Setup (step 6)
  'eye-outline',            // Value Preview (step 7)
  'fitness-outline',        // Strava Connect (step 8)
  'people-outline',         // Contact Setup (step 9)
  'chatbubble-outline',     // Message Style (step 10)
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