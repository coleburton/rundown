import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';
import { Database } from '@/types/supabase';

type RunLog = Database['public']['Tables']['run_logs']['Row'];

export function useStravaActivities() {
  const { user } = useAuthContext();
  const [activities, setActivities] = useState<RunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the start of the current week (Monday)
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);

      // Get activities from Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('strava-sync', {
        body: {
          after: monday.toISOString(),
        },
      });

      if (error) throw error;

      // Fetch activities from the database
      const { data: activities, error: dbError } = await supabase
        .from('run_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monday.toISOString())
        .order('date', { ascending: false });

      if (dbError) throw dbError;

      setActivities(activities);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyProgress = () => {
    if (!user) return { progress: 0, goal: 3 };

    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);

    const weeklyRuns = activities.filter(
      (activity) => new Date(activity.date) >= monday
    );

    return {
      progress: weeklyRuns.length,
      goal: user.goal_per_week,
    };
  };

  const getDaysLeft = () => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay() + 7);
    sunday.setHours(23, 59, 59, 999);

    return Math.ceil((sunday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities,
    getWeeklyProgress,
    getDaysLeft,
  };
} 