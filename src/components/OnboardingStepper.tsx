import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const STEPS = [
  { title: 'Goal', description: 'Set your weekly target' },
  { title: 'Buddy', description: 'Choose accountability partner' },
  { title: 'Style', description: 'Pick message tone' },
];

interface StepperProps {
  currentStep: number;
  style?: any;
}

export function OnboardingStepper({ currentStep, style }: StepperProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.progressBar}>
        <View style={styles.progressBackground} />
        <Animated.View 
          style={[
            styles.progressFill,
            {
              width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
            }
          ]} 
        />
        {STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              {
                backgroundColor: index <= currentStep ? '#f97316' : '#e5e7eb',
                left: `${(index / (STEPS.length - 1)) * 100}%`,
              },
            ]}
          />
        ))}
      </View>
      
      <View style={styles.stepsContainer}>
        {STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isPast = index < currentStep;

          return (
            <View key={index} style={styles.stepInfo}>
              <Text
                style={[
                  styles.stepTitle,
                  (isActive || isPast) && styles.stepTitleActive,
                ]}
              >
                {step.title}
              </Text>
              {isActive && (
                <Text style={styles.stepDescription}>
                  {step.description}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressBar: {
    height: 2,
    marginBottom: 24,
  },
  progressBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#e5e7eb',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    height: 2,
    backgroundColor: '#f97316',
  },
  stepDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    top: -5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  stepInfo: {
    alignItems: 'center',
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#1f2937',
  },
  stepDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
}); 