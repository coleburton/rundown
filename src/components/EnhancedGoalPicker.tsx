import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import analytics, { ANALYTICS_EVENTS } from '../lib/analytics';
import { VectorIcon } from './ui/IconComponent';

export type GoalType = 'total_activities' | 'total_runs' | 'total_miles_running' | 'total_rides_biking' | 'total_miles_biking';

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
    type: 'total_activities' as GoalType,
    name: 'Total Activities',
    emoji: '🎯',
    unit: 'activities',
    description: 'Any fitness activities per week',
    options: [2, 3, 4, 5, 6],
    color: '#10b981'
  },
  {
    type: 'total_runs' as GoalType,
    name: 'Total Runs',
    emoji: '🏃',
    unit: 'runs',
    description: 'Running workouts per week',
    options: [2, 3, 4, 5, 6],
    color: '#3b82f6'
  },
  {
    type: 'total_miles_running' as GoalType,
    name: 'Running Miles',
    emoji: '🏃‍♂️',
    unit: 'miles',
    description: 'Total running miles per week',
    options: [5, 10, 15, 20, 25],
    color: '#f97316'
  },
  {
    type: 'total_rides_biking' as GoalType,
    name: 'Total Rides',
    emoji: '🚴',
    unit: 'rides',
    description: 'Cycling workouts per week',
    options: [2, 3, 4, 5, 6],
    color: '#8b5cf6'
  },
  {
    type: 'total_miles_biking' as GoalType,
    name: 'Cycling Miles',
    emoji: '🚴‍♂️',
    unit: 'miles',
    description: 'Total cycling miles per week',
    options: [10, 25, 50, 75, 100],
    color: '#ef4444'
  }
];

const MOTIVATION_MESSAGES = {
  total_activities: {
    2: { title: 'Steady Start!', description: 'Perfect for sustainable growth', emoji: '🌱' },
    3: { title: 'Well Balanced!', description: 'Great commitment level', emoji: '⚖️' },
    4: { title: 'Getting Serious!', description: 'You\'re really dedicated', emoji: '💪' },
    5: { title: 'Activity Master!', description: 'Excellent weekly commitment', emoji: '🚀' },
    6: { title: 'Goal Crusher!', description: 'Maximum weekly dedication', emoji: '👑' }
  },
  total_runs: {
    2: { title: 'Runner\'s Start!', description: 'Building your running habit', emoji: '🌱' },
    3: { title: 'Consistent Runner!', description: 'Great running rhythm', emoji: '⚖️' },
    4: { title: 'Dedicated Runner!', description: 'Strong running commitment', emoji: '💪' },
    5: { title: 'Running Pro!', description: 'Impressive weekly mileage', emoji: '🚀' },
    6: { title: 'Running Champion!', description: 'Elite running schedule', emoji: '👑' }
  },
  total_miles_running: {
    5: { title: 'Getting Started!', description: 'Building your base mileage', emoji: '🌱' },
    10: { title: 'Solid Foundation!', description: 'Great weekly distance', emoji: '⚖️' },
    15: { title: 'Strong Runner!', description: 'Impressive weekly mileage', emoji: '💪' },
    20: { title: 'Distance Master!', description: 'Serious weekly commitment', emoji: '🚀' },
    25: { title: 'Mileage Champion!', description: 'Elite distance training', emoji: '👑' }
  },
  total_rides_biking: {
    2: { title: 'Cyclist\'s Start!', description: 'Building your cycling habit', emoji: '🌱' },
    3: { title: 'Consistent Cyclist!', description: 'Great riding rhythm', emoji: '⚖️' },
    4: { title: 'Dedicated Rider!', description: 'Strong cycling commitment', emoji: '💪' },
    5: { title: 'Cycling Pro!', description: 'Impressive ride schedule', emoji: '🚀' },
    6: { title: 'Cycling Champion!', description: 'Elite riding routine', emoji: '👑' }
  },
  total_miles_biking: {
    10: { title: 'Getting Rolling!', description: 'Building your cycling base', emoji: '🌱' },
    25: { title: 'Solid Cyclist!', description: 'Great weekly distance', emoji: '⚖️' },
    50: { title: 'Strong Rider!', description: 'Impressive weekly mileage', emoji: '💪' },
    75: { title: 'Distance Cyclist!', description: 'Serious weekly commitment', emoji: '🚀' },
    100: { title: 'Mileage Master!', description: 'Elite cycling training', emoji: '👑' }
  }
};

export function EnhancedGoalPicker({ value, onChange, style }: EnhancedGoalPickerProps) {
  const [selectedType, setSelectedType] = useState<GoalType>(value.type);
  const [customValue, setCustomValue] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const currentGoalType = GOAL_TYPES.find(g => g.type === selectedType) || GOAL_TYPES[0];
  const safeValue = currentGoalType.options.includes(value.value) ? value.value : currentGoalType.options[1];
  
  const motivationMessages = MOTIVATION_MESSAGES[selectedType];
  const motivationMessage = motivationMessages?.[safeValue as keyof typeof motivationMessages] || 
    (motivationMessages ? Object.values(motivationMessages)[0] : { title: 'Goal Set!', description: 'Keep going!', emoji: '🎯' });

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