import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TOTAL_STEPS = 8; // Total number of steps in onboarding

const STEP_ICONS = [
  'information-circle-outline', // Why Accountability (step 1)
  'star-outline',           // Social Proof (step 2)
  'bulb-outline',           // Motivation Quiz (step 3)
  'flag-outline',           // Goal Setup (step 4)
  'eye-outline',            // Value Preview (step 5)
  'fitness-outline',        // Strava Connect (step 6)
  'people-outline',         // Contact Setup (step 7)
  'chatbubble-outline',     // Message Style (step 8)
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