import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import analytics, { ANALYTICS_EVENTS } from '../lib/analytics';

export type GoalType = 'daily_checkins' | 'weekly_commitments' | 'habit_streaks' | 'consistency_challenges' | 'accountability_sessions';

export interface Goal {
  type: GoalType;
  value: number;
}

interface EnhancedGoalPickerProps {
  value: Goal;
  onChange: (goal: Goal) => void;
  style?: any;
}


const GOAL_TYPES = [
  {
    type: 'weekly_commitments' as GoalType,
    name: 'Weekly Activities',
    emoji: '🎯',
    unit: 'activities',
    description: 'Any fitness activities per week',
    options: [2, 3, 4, 5, 6],
    color: '#10b981'
  },
  {
    type: 'consistency_challenges' as GoalType,
    name: 'Consistency Days',
    emoji: '📈',
    unit: 'days per week',
    description: 'Days active per week',
    options: [3, 4, 5, 6, 7],
    color: '#3b82f6'
  },
  {
    type: 'daily_checkins' as GoalType,
    name: 'Daily Check-ins',
    emoji: '✅',
    unit: 'check-ins',
    description: 'Daily accountability check-ins',
    options: [5, 6, 7],
    color: '#f97316'
  },
  {
    type: 'habit_streaks' as GoalType,
    name: 'Streak Goals',
    emoji: '🔥',
    unit: 'day streak',
    description: 'Target streak length',
    options: [7, 14, 21, 30],
    color: '#8b5cf6'
  },
  {
    type: 'accountability_sessions' as GoalType,
    name: 'Support Sessions',
    emoji: '🤝',
    unit: 'sessions',
    description: 'Weekly accountability meetings',
    options: [1, 2, 3, 4],
    color: '#ef4444'
  }
];

const MOTIVATION_MESSAGES = {
  daily_checkins: {
    5: { title: 'Consistency Builder!', description: 'Great start to daily habits', emoji: '🌱' },
    6: { title: 'Almost There!', description: 'Building strong accountability', emoji: '⚖️' },
    7: { title: 'Habit Master!', description: 'Daily consistency unlocked', emoji: '👑' }
  },
  weekly_commitments: {
    2: { title: 'Steady Progress!', description: 'Perfect for sustainable growth', emoji: '🌱' },
    3: { title: 'Well Balanced!', description: 'Great commitment level', emoji: '⚖️' },
    4: { title: 'Ambitious!', description: 'You\'re really dedicated', emoji: '💪' },
    5: { title: 'Goal Crusher!', description: 'Maximum weekly commitment', emoji: '🚀' }
  },
  habit_streaks: {
    7: { title: 'Week Warrior!', description: 'Building positive momentum', emoji: '🌱' },
    14: { title: 'Two Week Hero!', description: 'Habits are forming', emoji: '💪' },
    21: { title: 'Habit Formed!', description: 'Science says you\'ve got this', emoji: '🚀' },
    30: { title: 'Streak Legend!', description: 'Unstoppable consistency', emoji: '👑' }
  },
  consistency_challenges: {
    3: { title: 'Smart Start!', description: 'Building sustainable habits', emoji: '🌱' },
    4: { title: 'Good Rhythm!', description: 'Finding your groove', emoji: '⚖️' },
    5: { title: 'Consistency Pro!', description: 'You\'re building momentum', emoji: '💪' },
    6: { title: 'Almost Daily!', description: 'Impressive dedication', emoji: '🚀' },
    7: { title: 'Daily Champion!', description: 'Maximum consistency mode', emoji: '👑' }
  },
  accountability_sessions: {
    1: { title: 'Accountability Start!', description: 'Weekly support system', emoji: '🌱' },
    2: { title: 'Support Strong!', description: 'Twice weekly check-ins', emoji: '⚖️' },
    3: { title: 'Accountability Pro!', description: 'Regular support schedule', emoji: '💪' },
    4: { title: 'Support Champion!', description: 'Maximum accountability', emoji: '🚀' }
  }
};

export function EnhancedGoalPicker({ value, onChange, style }: EnhancedGoalPickerProps) {
  const [selectedType, setSelectedType] = useState<GoalType>(value.type);
  const [customValue, setCustomValue] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const currentGoalType = GOAL_TYPES.find(g => g.type === selectedType) || GOAL_TYPES[0];
  const safeValue = currentGoalType.options.includes(value.value) ? value.value : currentGoalType.options[1];
  
  const motivationMessages = MOTIVATION_MESSAGES[selectedType];
  const motivationMessage = motivationMessages[safeValue as keyof typeof motivationMessages] || 
    Object.values(motivationMessages)[0];

  const handleTypeChange = (type: GoalType) => {
    setSelectedType(type);
    const newGoalType = GOAL_TYPES.find(g => g.type === type)!;
    const defaultValue = newGoalType.options[1]; // Default to second option
    
    const newGoal = { type, value: defaultValue };
    onChange(newGoal);
    
    // Goal creation event will be tracked when user continues from goal setup screen
  };

  const handleValueChange = (newValue: number) => {
    setShowCustomInput(false);
    const newGoal = { type: selectedType, value: newValue };
    onChange(newGoal);
    
    // Goal creation event will be tracked when user continues from goal setup screen
  };

  const handleCustomValueSubmit = () => {
    const numValue = parseInt(customValue);
    if (numValue && numValue > 0) {
      const newGoal = { type: selectedType, value: numValue };
      onChange(newGoal);
      setShowCustomInput(false);
      setCustomValue('');
      
      // Goal creation event will be tracked when user continues from goal setup screen
    }
  };

  const handleShowCustomInput = () => {
    setShowCustomInput(true);
    setCustomValue(value.value.toString());
  };

  return (
    <View style={[styles.container, style]}>
      {/* Goal Type Selection */}
      <View style={styles.typeSection}>
        <Text style={styles.sectionTitle}>Goal Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {GOAL_TYPES.map((goalType) => {
            const isSelected = goalType.type === selectedType;
            return (
              <TouchableOpacity
                key={goalType.type}
                onPress={() => handleTypeChange(goalType.type)}
                style={[
                  styles.typeOption,
                  isSelected && { backgroundColor: goalType.color, borderColor: goalType.color }
                ]}
              >
                <Text style={styles.typeEmoji}>{goalType.emoji}</Text>
                <Text style={[
                  styles.typeName,
                  isSelected && styles.typeNameSelected
                ]}>
                  {goalType.name}
                </Text>
                <Text style={[
                  styles.typeDescription,
                  isSelected && styles.typeDescriptionSelected
                ]}>
                  {goalType.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Goal Value Selection */}
      <View style={styles.valueSection}>
        <Text style={styles.sectionTitle}>Weekly Target</Text>
        <View style={styles.valueOptions}>
          {currentGoalType.options.map((option) => {
            const isSelected = option === safeValue && !showCustomInput;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => handleValueChange(option)}
                style={[
                  styles.valueOption,
                  isSelected && { backgroundColor: currentGoalType.color, borderColor: currentGoalType.color }
                ]}
              >
                <Text style={[
                  styles.valueNumber,
                  isSelected && styles.valueNumberSelected
                ]}>
                  {option}
                </Text>
                <Text style={[
                  styles.valueUnit,
                  isSelected && styles.valueUnitSelected
                ]}>
                  {currentGoalType.unit}
                </Text>
              </TouchableOpacity>
            );
          })}
          
          {/* Custom Input Option */}
          <TouchableOpacity
            onPress={handleShowCustomInput}
            style={[
              styles.valueOption,
              styles.customOption,
              (showCustomInput || !currentGoalType.options.includes(value.value)) && { 
                backgroundColor: currentGoalType.color, 
                borderColor: currentGoalType.color 
              }
            ]}
          >
            {showCustomInput ? (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={[
                    styles.customInput,
                    { color: '#ffffff' }
                  ]}
                  value={customValue}
                  onChangeText={setCustomValue}
                  onSubmitEditing={handleCustomValueSubmit}
                  onBlur={handleCustomValueSubmit}
                  keyboardType="numeric"
                  autoFocus
                  placeholder="0"
                  placeholderTextColor="#ffffff80"
                />
                <Text style={[styles.valueUnit, { color: '#ffffff' }]}>
                  {currentGoalType.unit}
                </Text>
              </View>
            ) : (
              <>
                <Text style={[
                  styles.valueNumber,
                  !currentGoalType.options.includes(value.value) && styles.valueNumberSelected
                ]}>
                  {!currentGoalType.options.includes(value.value) ? value.value : '•••'}
                </Text>
                <Text style={[
                  styles.valueUnit,
                  !currentGoalType.options.includes(value.value) && styles.valueUnitSelected
                ]}>
                  {!currentGoalType.options.includes(value.value) ? currentGoalType.unit : 'Custom'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Motivation Message */}
      <View style={[styles.motivation, { backgroundColor: currentGoalType.color + '20' }]}>
        <Text style={styles.motivationEmoji}>
          {motivationMessage.emoji}
        </Text>
        <Text style={[styles.motivationTitle, { color: currentGoalType.color }]}>
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
  typeSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  typeScroll: {
    marginHorizontal: -4,
  },
  typeOption: {
    width: 140,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 4,
  },
  typeNameSelected: {
    color: '#ffffff',
  },
  typeDescription: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  typeDescriptionSelected: {
    color: '#ffffff',
  },
  valueSection: {
    marginBottom: 16,
  },
  valueOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  valueOption: {
    width: '30%',
    marginHorizontal: '1.5%',
    marginBottom: 8,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  valueNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 2,
  },
  valueNumberSelected: {
    color: '#ffffff',
  },
  valueUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  valueUnitSelected: {
    color: '#ffffff',
  },
  customOption: {
    borderStyle: 'dashed',
  },
  customInputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customInput: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    width: 40,
    padding: 0,
    marginBottom: 2,
  },
  motivation: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  motivationEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  motivationDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});