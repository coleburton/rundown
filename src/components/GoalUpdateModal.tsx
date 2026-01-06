import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Button } from './ui/button';
import { EnhancedGoalPicker, Goal } from './EnhancedGoalPicker';
import { Tooltip } from './ui/tooltip';
import { useUserGoals } from '@/hooks/useUserGoals';
import { useAuth } from '@/hooks/useAuth';
import analytics, {
  ANALYTICS_EVENTS,
  USER_PROPERTIES,
  setUserProperties
} from '../lib/analytics';

interface GoalUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onGoalUpdated: () => void;
}

const GOAL_TYPE_VALUES: Goal['type'][] = [
  'total_activities',
  'total_runs',
  'total_miles_running',
  'total_rides_biking',
  'total_miles_biking'
];

const isValidGoalType = (value: string | null | undefined): value is Goal['type'] =>
  !!value && GOAL_TYPE_VALUES.includes(value as Goal['type']);

export function GoalUpdateModal({ visible, onClose, onGoalUpdated }: GoalUpdateModalProps) {
  const { user } = useAuth();
  const { activeGoal, createOrUpdateGoal, loading: goalsLoading } = useUserGoals(user?.id);
  const [selectedGoal, setSelectedGoal] = useState<Goal>({
    type: 'total_activities',
    value: 3
  });
  const [originalGoal, setOriginalGoal] = useState<Goal>({
    type: 'total_activities',
    value: 3
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [screenStartTime] = useState(Date.now());

  // Initialize with user's existing goal
  useEffect(() => {
    if (!goalsLoading && activeGoal) {
      const initialGoal: Goal = {
        type: isValidGoalType(activeGoal.goal_type) ? activeGoal.goal_type : 'total_activities',
        value: Number(activeGoal.target_value)
      };
      setSelectedGoal(initialGoal);
      setOriginalGoal(initialGoal);
      setIsInitialized(true);
    } else if (!goalsLoading && user) {
      // Fallback to users table if no goal in user_goals yet
      const initialGoal: Goal = {
        type: isValidGoalType(user.goal_type) ? user.goal_type : 'total_activities',
        value: user.goal_value || user.goal_per_week || 3
      };
      setSelectedGoal(initialGoal);
      setOriginalGoal(initialGoal);
      setIsInitialized(true);
    }
  }, [activeGoal, goalsLoading, user, visible]);

  // Track screen view when modal opens
  useEffect(() => {
    if (visible) {
      try {
        analytics.trackEvent(ANALYTICS_EVENTS.SCREEN_VIEW, {
          screen_name: 'goal_update',
          screen_type: 'modal',
          from_settings: true,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error tracking modal view:', error);
      }
    }
  }, [visible]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleGoalChange = (goal: Goal) => {
    try {
      setSelectedGoal(goal);

      analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
        button_name: 'goal_selection',
        goal_type: goal.type,
        goal_value: goal.value,
        screen: 'goal_update_modal',
        from_settings: true,
        time_to_select_ms: Date.now() - screenStartTime
      });
    } catch (error) {
      console.error('Error tracking goal change:', error);
    }
  };

  const handleUpdateGoal = async () => {
    if (isSubmitting) return;

    // Check if goal actually changed
    if (selectedGoal.type === originalGoal.type && selectedGoal.value === originalGoal.value) {
      onClose();
      return;
    }

    // Show confirmation alert
    Alert.alert(
      'Update Goal',
      'Are you sure you want to update your weekly goal? This will affect your accountability tracking.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update Goal', onPress: () => saveGoal() }
      ]
    );
  };

  const saveGoal = async () => {
    try {
      setIsSubmitting(true);
      const timeSpent = Date.now() - screenStartTime;
      const goalTypeChanged = selectedGoal.type !== originalGoal.type;
      const goalValueChanged = selectedGoal.value !== originalGoal.value;

      // Track goal update
      analytics.trackEvent(ANALYTICS_EVENTS.GOAL_UPDATED, {
        goal_type: selectedGoal.type,
        goal_value: selectedGoal.value,
        previous_goal_type: originalGoal.type,
        previous_goal_value: originalGoal.value,
        goal_type_changed: goalTypeChanged,
        goal_value_changed: goalValueChanged,
        screen: 'goal_update_modal',
        time_spent_ms: timeSpent,
        from_settings: true
      });

      analytics.trackEvent(ANALYTICS_EVENTS.SETTINGS_GOAL_CHANGED, {
        new_goal_type: selectedGoal.type,
        new_goal_value: selectedGoal.value,
        old_goal_type: originalGoal.type,
        old_goal_value: originalGoal.value,
        time_spent_ms: timeSpent
      });

      if (goalTypeChanged) {
        analytics.trackEvent(ANALYTICS_EVENTS.GOAL_TYPE_CHANGED, {
          from_type: originalGoal.type,
          to_type: selectedGoal.type,
          goal_value: selectedGoal.value,
          screen: 'goal_update_modal'
        });
      }

      if (goalValueChanged) {
        analytics.trackEvent(ANALYTICS_EVENTS.GOAL_VALUE_CHANGED, {
          goal_type: selectedGoal.type,
          from_value: originalGoal.value,
          to_value: selectedGoal.value,
          screen: 'goal_update_modal'
        });
      }

      // Set user properties
      setUserProperties({
        [USER_PROPERTIES.GOAL_TYPE]: selectedGoal.type,
        [USER_PROPERTIES.GOAL_VALUE]: selectedGoal.value
      });

      // Save goal to database
      await createOrUpdateGoal(selectedGoal);

      // Success! Close modal and refresh parent
      Alert.alert('Success', 'Your goal has been updated!');
      onGoalUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = selectedGoal.type !== originalGoal.type || selectedGoal.value !== originalGoal.value;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#ffffff' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb'
        }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 16, color: '#6b7280', fontFamily: 'DMSans-Medium' }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontFamily: 'DMSans-Bold', color: '#111827' }}>
            Update Goal
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
        >
          <Text style={{
            fontSize: 26,
            fontFamily: 'DMSans-Bold',
            color: '#111827',
            marginBottom: 8,
            letterSpacing: -0.5
          }}>
            Update Your Goal
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{
              fontSize: 16,
              fontFamily: 'DMSans-Regular',
              color: '#6b7280',
              lineHeight: 24,
              flex: 1
            }}>
              Adjust your weekly fitness goal to better match your current routine.
            </Text>
            <Tooltip
              text="Start with a goal you can achieve consistently. You can always adjust it later."
              style={{ marginLeft: 8 }}
            />
          </View>

          {/* Enhanced Goal Picker */}
          {!isInitialized ? (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 40,
              marginBottom: 20
            }}>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Loading your goal...</Text>
            </View>
          ) : (
            <EnhancedGoalPicker
              value={selectedGoal}
              onChange={handleGoalChange}
              style={{ marginBottom: 20 }}
            />
          )}

          {/* Change Indicator */}
          {hasChanges && (
            <View style={{
              backgroundColor: '#fff7ed',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#fed7aa',
              marginTop: 4
            }}>
              <Text style={{
                fontSize: 13,
                color: '#9a3412',
                fontFamily: 'DMSans-Bold',
                marginBottom: 6,
                letterSpacing: 0.3,
                textTransform: 'uppercase'
              }}>
                Changes Detected
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#7c2d12',
                fontFamily: 'DMSans-Regular',
                lineHeight: 20
              }}>
                Your goal will change from {originalGoal.value} to {selectedGoal.value} {selectedGoal.type === originalGoal.type ? '' : `and type will change to ${selectedGoal.type}`}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Update Button */}
        <View style={{
          padding: 20,
          paddingBottom: 34,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff'
        }}>
          <Button
            onPress={handleUpdateGoal}
            size="lg"
            title={isSubmitting ? "Updating..." : "Update Goal"}
            disabled={!hasChanges || isSubmitting}
            style={{
              backgroundColor: hasChanges && !isSubmitting ? '#f97316' : '#e5e7eb',
              borderRadius: 14,
              paddingVertical: 18,
            }}
            textStyle={{
              fontFamily: 'DMSans-Bold',
              fontSize: 16,
              letterSpacing: 0.3
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
