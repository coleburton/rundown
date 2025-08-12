import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Activity {
  id: string;
  strava_activity_id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  kudos_count: number;
  achievement_count: number;
  raw_data: any;
  synced_at: string;
  created_at: string;
}

export function useStravaActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchActivities();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_date', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const syncWithStrava = async () => {
    try {
      setError(null);
      
      // Get last activity date for incremental sync
      const lastActivity = activities[0];
      const after = lastActivity 
        ? new Date(lastActivity.start_date) 
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error: syncError } = await supabase.functions.invoke('strava-sync', {
        body: { after: after.toISOString() },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (syncError) throw syncError;

      // Refresh activities after sync
      await fetchActivities();
      
      return data;
    } catch (err) {
      console.error('Error syncing with Strava:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync with Strava');
      throw err;
    }
  };

  const getWeeklyProgress = (goalPerWeek?: number) => {
    const goal = goalPerWeek || user?.goal_per_week || 3;
    
    // Get the start of the current week (Monday)
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);

    const weeklyActivities = activities.filter(activity => {
      const activityDate = new Date(activity.start_date_local);
      return activityDate >= monday && ['Run', 'VirtualRun'].includes(activity.type);
    });

    return {
      progress: weeklyActivities.length,
      goal,
    };
  };

  const getDaysLeft = () => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay() + 7);
    sunday.setHours(23, 59, 59, 999);

    return Math.ceil((sunday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getRecentRuns = (limit: number = 5) => {
    return activities
      .filter(activity => ['Run', 'VirtualRun'].includes(activity.type))
      .slice(0, limit)
      .map(activity => ({
        id: activity.strava_activity_id.toString(),
        name: activity.name,
        date: activity.start_date_local,
        distance: Math.round(activity.distance / 1609.34 * 100) / 100, // Convert to miles
        duration: Math.round(activity.moving_time / 60), // Convert to minutes
        pace: activity.distance > 0 ? 
          Math.round((activity.moving_time / 60) / (activity.distance / 1609.34) * 100) / 100 : 0,
      }));
  };

  const getRecentActivities = (limit: number = 5) => {
    return activities
      .slice(0, limit)
      .map(activity => ({
        id: activity.strava_activity_id.toString(),
        name: activity.name,
        type: activity.type,
        sport_type: activity.sport_type,
        date: activity.start_date_local,
        distance: Math.round(activity.distance / 1609.34 * 100) / 100, // Convert to miles
        duration: Math.round(activity.moving_time / 60), // Convert to minutes
        pace: activity.distance > 0 ? 
          Math.round((activity.moving_time / 60) / (activity.distance / 1609.34) * 100) / 100 : 0,
        countsTowardGoal: ['Run', 'VirtualRun'].includes(activity.type),
      }));
  };

  const doesActivityCountTowardGoal = (activityType: string) => {
    return ['Run', 'VirtualRun'].includes(activityType);
  };

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities,
    syncWithStrava,
    getWeeklyProgress,
    getDaysLeft,
    getRecentRuns,
    getRecentActivities,
    doesActivityCountTowardGoal,
  };
} 