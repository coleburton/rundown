import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type UserGoal = Database['public']['Tables']['user_goals']['Row'];
type UserGoalInsert = Database['public']['Tables']['user_goals']['Insert'];
type UserGoalUpdate = Database['public']['Tables']['user_goals']['Update'];

export interface Goal {
  type: string;
  value: number;
}

export function useUserGoals(userId: string | undefined) {
  const [activeGoal, setActiveGoal] = useState<UserGoal | null>(null);
  const [allGoals, setAllGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserGoals = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch all goals for the user, ordered by creation date
      const { data: goals, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAllGoals(goals || []);

      // Find the active goal (should only be one)
      const active = goals?.find(g => g.is_active) || null;
      setActiveGoal(active);
    } catch (error) {
      console.error('Error fetching user goals:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserGoals();
    }
  }, [userId, fetchUserGoals]);

  const createOrUpdateGoal = useCallback(async (goal: Goal): Promise<UserGoal | null> => {
    if (!userId) throw new Error('User ID is required');

    try {
      // Deactivate any existing active goals
      if (activeGoal) {
        await supabase
          .from('user_goals')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', activeGoal.id);
      }

      // Determine target_unit based on goal type
      const targetUnit = goal.type.includes('miles') || goal.type.includes('distance')
        ? 'miles'
        : 'count';

      // Create new active goal
      const newGoal: UserGoalInsert = {
        user_id: userId,
        goal_type: goal.type,
        target_value: goal.value,
        target_unit: targetUnit,
        time_period: 'weekly',
        is_active: true,
        priority: 1,
      };

      const { data, error } = await supabase
        .from('user_goals')
        .insert(newGoal)
        .select()
        .single();

      if (error) throw error;

      // Update state
      setActiveGoal(data);
      await fetchUserGoals();

      // Also update the users table for backward compatibility
      // This keeps the legacy fields in sync
      await supabase
        .from('users')
        .update({
          goal_type: goal.type,
          goal_value: goal.value,
          goal_per_week: goal.value,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return data;
    } catch (error) {
      console.error('Error creating/updating goal:', error);
      throw error;
    }
  }, [userId, activeGoal, fetchUserGoals]);

  const deactivateGoal = useCallback(async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', goalId);

      if (error) throw error;

      await fetchUserGoals();
    } catch (error) {
      console.error('Error deactivating goal:', error);
      throw error;
    }
  }, [fetchUserGoals]);

  // Convert a UserGoal to the simple Goal format used by components
  const toSimpleGoal = useCallback((userGoal: UserGoal | null): Goal => {
    if (!userGoal) {
      return { type: 'total_activities', value: 3 };
    }
    return {
      type: userGoal.goal_type,
      value: Number(userGoal.target_value),
    };
  }, []);

  return {
    activeGoal,
    allGoals,
    loading,
    createOrUpdateGoal,
    deactivateGoal,
    refreshGoals: fetchUserGoals,
    toSimpleGoal,
  };
}
