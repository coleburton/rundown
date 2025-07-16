import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import analytics, { ANALYTICS_EVENTS } from '../lib/analytics';

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
  // Ensure value is a valid option, defaulting to 3 if not
  const safeValue = GOAL_OPTIONS.includes(value) ? value : 3;
  
  // Get the motivation message safely with a default fallback
  const motivationMessage = MOTIVATION_MESSAGES[safeValue as keyof typeof MOTIVATION_MESSAGES] || MOTIVATION_MESSAGES[3];

  const handleSelect = (goal: number) => {
    if (goal === safeValue) return;
    
    try {
      // Track goal selection in analytics
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_CREATED, { 
        goal_value: goal 
      });
      
      // Update the parent component
      onChange(goal);
    } catch (error) {
      console.error('Error selecting goal:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.options}>
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = goal === safeValue;

          return (
            <TouchableOpacity
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
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.motivation}>
        <Text style={styles.motivationEmoji}>
          {motivationMessage.emoji}
        </Text>
        <Text style={styles.motivationTitle}>
          {motivationMessage.title}
        </Text>
        <Text style={styles.motivationDescription}>
          {motivationMessage.description}
        </Text>
      </View>
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