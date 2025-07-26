import React from 'react';
import { View, StyleSheet } from 'react-native';

const TOTAL_STEPS = 6; // Total number of steps in onboarding

interface StepperProps {
  currentStep: number;
  style?: any;
}

export function OnboardingStepper({ currentStep, style }: StepperProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.progressBar}>
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              {
                backgroundColor: index < currentStep ? '#f97316' : '#e5e7eb',
              },
            ]}
          />
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
    gap: 8,
    height: 4,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});