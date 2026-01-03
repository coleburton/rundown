import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';
import { Database } from '@/types/supabase';

export type Activity = Database['public']['Tables']['activities']['Row'];

export function useStravaActivities() {
  const { user } = useAuthContext();
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
      if (!user?.id) {
        setActivities([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log('fetchActivities - Starting fetch for user:', user?.id);

      // Calculate date 12 weeks ago for dashboard historical data
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - (12 * 7));

      console.log('fetchActivities - Date filter:', {
        twelveWeeksAgo: twelveWeeksAgo.toISOString(),
        now: new Date().toISOString()
      });

      const { data, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date_local', twelveWeeksAgo.toISOString())
        .order('start_date', { ascending: false });

      console.log('fetchActivities - Supabase response:', {
        userId: user?.id,
        dataCount: data?.length || 0,
        error: fetchError,
        hasData: !!data
      });

      if (fetchError) throw fetchError;

      setActivities((data as Activity[]) || []);
      console.log('fetchActivities - Activities set:', (data || []).length);
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
      
      console.log('Session info for sync:', {
        hasUser: !!session.user,
        userId: session.user?.id,
        hasToken: !!session.access_token
      });

      const { data, error: syncError } = await supabase.functions.invoke('strava-sync', {
        body: { after: after.toISOString() },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (syncError) {
        console.error('Sync function error details:', {
          message: syncError.message,
          context: syncError.context,
          details: syncError.details,
          data: data
        });
        
        // Try to extract error details from the response
        let errorMessage = syncError.message;
        if (syncError.context && syncError.context._bodyBlob) {
          try {
            const response = syncError.context;
            const errorText = await response.text();
            console.error('Function response body:', errorText);
            
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorMessage;
              if (errorJson.details) {
                errorMessage += ` (${errorJson.details})`;
              }
            } catch {
              // Not JSON, use raw text
              if (errorText) {
                errorMessage += ` - ${errorText}`;
              }
            }
          } catch (e) {
            console.error('Failed to read error response:', e);
          }
        }
        
        throw new Error(`Sync failed: ${errorMessage}`);
      }

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
      .map(activity => {
        const distance = activity.distance ?? 0;
        const movingTime = activity.moving_time ?? 0;

        return {
          id: activity.strava_activity_id.toString(),
          name: activity.name,
          date: activity.start_date_local,
          distance: Math.round((distance / 1609.34) * 100) / 100,
          duration: Math.round(movingTime / 60),
          pace: distance > 0
            ? Math.round(((movingTime / 60) / (distance / 1609.34)) * 100) / 100
            : 0,
        };
      });
  };

  const getRecentActivities = (limit: number = 5) => {
    return activities
      .slice(0, limit)
      .map(activity => {
        const distance = activity.distance ?? 0;
        const movingTime = activity.moving_time ?? 0;

        return {
          id: activity.strava_activity_id.toString(),
          name: activity.name,
          type: activity.type,
          sport_type: activity.sport_type,
          date: activity.start_date_local,
          distance: Math.round((distance / 1609.34) * 100) / 100,
          duration: Math.round(movingTime / 60),
          pace: distance > 0
            ? Math.round(((movingTime / 60) / (distance / 1609.34)) * 100) / 100
            : 0,
          countsTowardGoal: ['Run', 'VirtualRun'].includes(activity.type),
        };
      });
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
