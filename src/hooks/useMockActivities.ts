import { useState, useEffect, useCallback } from 'react';
import { Activity } from '../types/mock';
import { MockActivities } from '../lib/mock-activities';
import { useMockData } from '../lib/mock-data-context';
import { useMockAuth } from './useMockAuth';

export function useMockActivities() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state, setActivities, addActivity: addActivityToStore } = useMockData();
  const { user } = useMockAuth();
  const mockActivities = MockActivities.getInstance();

  const fetchActivities = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching activities for user:', user.id);
      
      // Ensure mock activities are generated
      if (!mockActivities.hasActivities()) {
        console.log('No activities found, generating mock activities...');
        await mockActivities.regenerateActivities();
      }
      
      const fetchedActivities = await mockActivities.getActivities(user.id);
      console.log('Fetched activities:', fetchedActivities.length);
      setActivities(fetchedActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setIsLoading(false);
    }
  }, [user, setActivities, mockActivities]);

  const addActivity = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const newActivity = await mockActivities.addActivity(user.id);
      addActivityToStore(newActivity);
      return newActivity;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add activity');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, addActivityToStore, mockActivities]);

  const getActivitiesForWeek = useCallback(async (weekStart: Date) => {
    if (!user) return [];

    try {
      return await mockActivities.getActivitiesForWeek(user.id, weekStart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weekly activities');
      return [];
    }
  }, [user, mockActivities]);

  const regenerateActivities = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      await mockActivities.regenerateActivities();
      const fetchedActivities = await mockActivities.getActivities(user.id);
      setActivities(fetchedActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate activities');
    } finally {
      setIsLoading(false);
    }
  }, [user, setActivities, mockActivities]);

  const addTestActivities = useCallback(() => {
    if (!user) return;
    
    mockActivities.addTestActivities();
    const activities = mockActivities.getActivities(user.id);
    activities.then(fetchedActivities => {
      setActivities(fetchedActivities);
    });
  }, [user, setActivities, mockActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities: state.activities,
    isLoading,
    error,
    fetchActivities,
    addActivity,
    getActivitiesForWeek,
    regenerateActivities,
    addTestActivities,
  };
} 