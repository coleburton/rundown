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

  const getWeekStart = (baseDate: Date = new Date()) => {
    const day = baseDate.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Start weeks on Monday
    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const getNextWeekStart = (baseDate: Date = new Date()) => {
    const nextWeek = new Date(getWeekStart(baseDate));
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  };

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

  const ensureCurrentGoalHistoryEntry = useCallback(async () => {
    if (!userId) return;

    try {
      let goalType: string | null = null;
      let goalValue: number | null = null;
      let effectiveDate: Date | null = null;

      if (activeGoal) {
        goalType = activeGoal.goal_type;
        goalValue = Number(activeGoal.target_value);
        const createdAt = activeGoal.created_at ? new Date(activeGoal.created_at) : new Date();
        effectiveDate = getWeekStart(createdAt);
      } else {
        const { data: fallbackUser, error: fallbackError } = await supabase
          .from('users')
          .select('goal_type, goal_value, goal_per_week, created_at')
          .eq('id', userId)
          .single();

        if (!fallbackError && fallbackUser?.goal_type) {
          goalType = fallbackUser.goal_type;
          goalValue = Number(fallbackUser.goal_value || fallbackUser.goal_per_week || 3);
          const createdAt = fallbackUser.created_at ? new Date(fallbackUser.created_at) : new Date(0);
          effectiveDate = getWeekStart(createdAt);
        }
      }

      if (!goalType || goalValue == null || !effectiveDate) {
        return;
      }

      const { data } = await supabase
        .from('goal_history')
        .select('id')
        .eq('user_id', userId)
        .eq('goal_type', goalType)
        .eq('goal_value', goalValue)
        .lte('effective_date', effectiveDate.toISOString())
        .limit(1)
        .maybeSingle();

      if (!data) {
        await supabase.from('goal_history').insert({
          user_id: userId,
          goal_type: goalType,
          goal_value: goalValue,
          effective_date: effectiveDate.toISOString(),
        });
      }
    } catch (error) {
      console.error('Error ensuring goal history entry:', error);
    }
  }, [userId, activeGoal]);

  const createOrUpdateGoal = useCallback(async (goal: Goal): Promise<UserGoal | null> => {
    if (!userId) throw new Error('User ID is required');

    try {
      await ensureCurrentGoalHistoryEntry();

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

      const now = new Date();
      const currentWeekStart = getWeekStart(now);
      const effectiveDate = activeGoal ? getNextWeekStart(now) : currentWeekStart;

      if (activeGoal) {
        // Remove any pending goal history entries that haven't started yet
        await supabase
          .from('goal_history')
          .delete()
          .eq('user_id', userId)
          .gte('effective_date', effectiveDate.toISOString());
      }

      const { error: historyError } = await supabase
        .from('goal_history')
        .insert({
          user_id: userId,
          goal_type: goal.type,
          goal_value: goal.value,
          effective_date: effectiveDate.toISOString(),
        });

      if (historyError) throw historyError;

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
  }, [userId, activeGoal, fetchUserGoals, ensureCurrentGoalHistoryEntry]);

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
