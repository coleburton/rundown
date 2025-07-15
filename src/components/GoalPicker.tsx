import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withTiming,
} from 'react-native-reanimated';

interface GoalPickerProps {
  value: number;
  onChange: (value: number) => void;
  style?: any;
}

const GOAL_OPTIONS = [2, 3, 4, 5];

const MOTIVATION_MESSAGES = {
  2: {
    title: 'Starting small is smart.',
    description: 'Consistency beats intensity. Build a solid foundation.',
    emoji: '🌱',
  },
  3: {
    title: 'Nice balance!',
    description: 'This is a solid goal that leaves room for rest days.',
    emoji: '⚖️',
  },
  4: {
    title: 'Getting serious!',
    description: 'You\'re committed to making running a daily habit.',
    emoji: '💪',
  },
  5: {
    title: 'Ambitious!',
    description: 'We like your style. Let\'s crush those goals!',
    emoji: '🚀',
  },
};

export function GoalPicker({ value, onChange, style }: GoalPickerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const animation = useSharedValue(0);

  const handleSelect = (goal: number) => {
    if (goal === value || isAnimating) return;

    setIsAnimating(true);
    animation.value = withSpring(1, {}, (finished) => {
      if (finished) {
        animation.value = withTiming(0, { duration: 300 }, () => {
          setIsAnimating(false);
        });
        onChange(goal);
      }
    });
  };

  const motivationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(animation.value, [0, 0.5, 1], [1, 1.1, 1]),
        },
        {
          translateY: interpolate(animation.value, [0, 0.5, 1], [0, -10, 0]),
        },
      ],
      opacity: interpolate(animation.value, [0, 0.5, 1], [1, 0, 1]),
    };
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.options}>
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = goal === value;

          return (
            <Pressable
              key={goal}
              onPress={() => handleSelect(goal)}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionNumber,
                  isSelected && styles.optionNumberSelected,
                ]}>
                  {goal}
                </Text>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}>
                  runs
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={[styles.motivation, motivationStyle]}>
        <Text style={styles.motivationEmoji}>
          {MOTIVATION_MESSAGES[value as keyof typeof MOTIVATION_MESSAGES].emoji}
        </Text>
        <Text style={styles.motivationTitle}>
          {MOTIVATION_MESSAGES[value as keyof typeof MOTIVATION_MESSAGES].title}
        </Text>
        <Text style={styles.motivationDescription}>
          {MOTIVATION_MESSAGES[value as keyof typeof MOTIVATION_MESSAGES].description}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  option: {
    flex: 1,
    marginHorizontal: 4,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#fff',
    borderColor: '#f97316',
  },
  optionContent: {
    alignItems: 'center',
  },
  optionNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  optionNumberSelected: {
    color: '#f97316',
  },
  optionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionTextSelected: {
    color: '#f97316',
  },
  motivation: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff8f6',
    borderRadius: 16,
  },
  motivationEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f97316',
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
}); 