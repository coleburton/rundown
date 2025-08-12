import { useState, useEffect } from 'react';
import StravaAuthService from '@/services/strava-auth';

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  kudos_count: number;
  achievement_count: number;
}

export function useStravaData() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const stravaAuth = StravaAuthService.getInstance();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await stravaAuth.loadStoredTokens();
      if (stravaAuth.isAuthenticated()) {
        await fetchData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error initializing Strava auth:', error);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get activities from the last 4 weeks
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const [activitiesData, statsData] = await Promise.all([
        stravaAuth.getActivities(fourWeeksAgo, undefined, 50),
        stravaAuth.getAthleteStats().catch(() => null) // Stats might fail, that's OK
      ]);

      setActivities(activitiesData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching Strava data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Strava data');
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyProgress = (goalPerWeek: number = 3) => {
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
      goal: goalPerWeek,
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
        id: activity.id.toString(),
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
        id: activity.id.toString(),
        name: activity.name,
        type: activity.type,
        sport_type: activity.sport_type,
        date: activity.start_date_local,
        distance: Math.round(activity.distance / 1609.34 * 100) / 100, // Convert to miles
        duration: Math.round(activity.moving_time / 60), // Convert to minutes
        pace: activity.distance > 0 ? 
          Math.round((activity.moving_time / 60) / (activity.distance / 1609.34) * 100) / 100 : 0,
        countsTowardGoal: ['Run', 'VirtualRun'].includes(activity.type), // Add flag for goal counting
      }));
  };

  const doesActivityCountTowardGoal = (activityType: string) => {
    return ['Run', 'VirtualRun'].includes(activityType);
  };

  const isAuthenticated = () => stravaAuth.isAuthenticated();
  const getAthlete = () => stravaAuth.getAthlete();

  return {
    activities,
    stats,
    loading,
    error,
    refresh: fetchData,
    getWeeklyProgress,
    getDaysLeft,
    getRecentRuns,
    getRecentActivities,
    doesActivityCountTowardGoal,
    isAuthenticated,
    getAthlete,
  };
}