import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import analytics, { ANALYTICS_EVENTS } from '../lib/analytics';

export type GoalType = 'runs' | 'run_miles' | 'activities' | 'bike_rides' | 'bike_miles';

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
    type: 'runs' as GoalType,
    name: 'Runs per Week',
    emoji: '🏃‍♂️',
    unit: 'runs',
    description: 'Number of running sessions',
    options: [2, 3, 4, 5, 6],
    color: '#10b981'
  },
  {
    type: 'run_miles' as GoalType,
    name: 'Running Miles',
    emoji: '📏',
    unit: 'miles',
    description: 'Total miles run per week',
    options: [10, 15, 20, 25, 30],
    color: '#3b82f6'
  },
  {
    type: 'activities' as GoalType,
    name: 'Any Activities',
    emoji: '🏋️‍♀️',
    unit: 'activities',
    description: 'Any fitness activities per week',
    options: [3, 4, 5, 6, 7],
    color: '#8b5cf6'
  },
  {
    type: 'bike_rides' as GoalType,
    name: 'Bike Rides',
    emoji: '🚴‍♂️',
    unit: 'rides',
    description: 'Number of bike rides per week',
    options: [2, 3, 4, 5, 6],
    color: '#f59e0b'
  },
  {
    type: 'bike_miles' as GoalType,
    name: 'Cycling Miles',
    emoji: '🚵‍♀️',
    unit: 'miles',
    description: 'Total miles cycled per week',
    options: [20, 30, 50, 75, 100],
    color: '#ef4444'
  }
];

const MOTIVATION_MESSAGES = {
  runs: {
    2: { title: 'Starting strong!', description: 'Perfect for building consistency', emoji: '🌱' },
    3: { title: 'Great balance!', description: 'Solid commitment with rest days', emoji: '⚖️' },
    4: { title: 'Getting serious!', description: 'You\'re building a real habit', emoji: '💪' },
    5: { title: 'Ambitious!', description: 'High achiever mode activated', emoji: '🚀' },
    6: { title: 'Beast mode!', description: 'You\'re a running machine', emoji: '🔥' },
    7: { title: 'Legendary!', description: 'Daily runner status unlocked', emoji: '👑' }
  },
  run_miles: {
    10: { title: 'Steady pace!', description: 'Building endurance gradually', emoji: '🌱' },
    15: { title: 'Nice mileage!', description: 'Good weekly volume', emoji: '⚖️' },
    20: { title: 'Solid runner!', description: 'You\'re getting serious', emoji: '💪' },
    25: { title: 'High mileage!', description: 'Impressive weekly volume', emoji: '🚀' },
    30: { title: 'Elite level!', description: 'You\'re in the top tier', emoji: '🔥' },
    35: { title: 'Ultra runner!', description: 'Extraordinary commitment', emoji: '👑' }
  },
  activities: {
    3: { title: 'Active lifestyle!', description: 'Great start to fitness', emoji: '🌱' },
    4: { title: 'Well-rounded!', description: 'Nice variety in activities', emoji: '⚖️' },
    5: { title: 'Fitness focused!', description: 'You\'re really committed', emoji: '💪' },
    6: { title: 'Activity beast!', description: 'Impressive dedication', emoji: '🚀' },
    7: { title: 'Fitness fanatic!', description: 'Maximum active lifestyle', emoji: '🔥' },
    8: { title: 'Movement master!', description: 'You never stop moving', emoji: '👑' }
  },
  bike_rides: {
    2: { title: 'Cycling start!', description: 'Building bike habits', emoji: '🌱' },
    3: { title: 'Regular rider!', description: 'Nice cycling routine', emoji: '⚖️' },
    4: { title: 'Bike enthusiast!', description: 'You love those wheels', emoji: '💪' },
    5: { title: 'Cycling machine!', description: 'Pedaling powerhouse', emoji: '🚀' },
    6: { title: 'Bike warrior!', description: 'Two wheels, pure speed', emoji: '🔥' },
    7: { title: 'Cycling legend!', description: 'Daily bike adventures', emoji: '👑' }
  },
  bike_miles: {
    20: { title: 'Good distance!', description: 'Solid weekly mileage', emoji: '🌱' },
    30: { title: 'Nice volume!', description: 'Building endurance', emoji: '⚖️' },
    50: { title: 'Strong cyclist!', description: 'Impressive distances', emoji: '💪' },
    75: { title: 'Cycling beast!', description: 'Serious bike commitment', emoji: '🚀' },
    100: { title: 'Century club!', description: 'Elite cycling volume', emoji: '🔥' },
    125: { title: 'Ultra cyclist!', description: 'Extraordinary distances', emoji: '👑' }
  }
};

export function EnhancedGoalPicker({ value, onChange, style }: EnhancedGoalPickerProps) {
  const [selectedType, setSelectedType] = useState<GoalType>(value.type);
  const [customValue, setCustomValue] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const currentGoalType = GOAL_TYPES.find(g => g.type === selectedType)!;
  const safeValue = currentGoalType.options.includes(value.value) ? value.value : currentGoalType.options[1];
  
  const motivationMessages = MOTIVATION_MESSAGES[selectedType];
  const motivationMessage = motivationMessages[safeValue as keyof typeof motivationMessages] || 
    Object.values(motivationMessages)[0];

  const handleTypeChange = (type: GoalType) => {
    setSelectedType(type);
    const newGoalType = GOAL_TYPES.find(g => g.type === type)!;
    const newValue = newGoalType.options[1]; // Default to second option
    
    const newGoal = { type, value: newValue };
    onChange(newGoal);
    
    try {
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_CREATED, { 
        goal_type: type,
        goal_value: newValue 
      });
    } catch (error) {
      console.error('Error tracking goal type change:', error);
    }
  };

  const handleValueChange = (newValue: number) => {
    setShowCustomInput(false);
    const newGoal = { type: selectedType, value: newValue };
    onChange(newGoal);
    
    try {
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_CREATED, { 
        goal_type: selectedType,
        goal_value: newValue 
      });
    } catch (error) {
      console.error('Error tracking goal value change:', error);
    }
  };

  const handleCustomValueSubmit = () => {
    const numValue = parseInt(customValue);
    if (numValue && numValue > 0) {
      const newGoal = { type: selectedType, value: numValue };
      onChange(newGoal);
      setShowCustomInput(false);
      setCustomValue('');
      
      try {
        analytics.trackEvent(ANALYTICS_EVENTS.GOAL_CREATED, { 
          goal_type: selectedType,
          goal_value: numValue,
          custom: true
        });
      } catch (error) {
        console.error('Error tracking custom goal value:', error);
      }
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
    marginBottom: 24,
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
    marginBottom: 24,
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
    paddingVertical: 20,
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