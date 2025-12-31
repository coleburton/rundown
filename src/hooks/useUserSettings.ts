import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  goal_per_week: number;
  message_style: 'supportive' | 'snarky' | 'chaotic';
  send_day: string;
  send_time: string;
  timezone: string;
  measurement_unit: 'imperial' | 'metric';
  notification_enabled: boolean;
  reminder_time: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  relationship?: string;
  notification_preference: 'missed_goals' | 'weekly_summary' | 'both' | 'none';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  goal_type: 'weekly_runs' | 'monthly_distance' | 'weekly_distance' | 'streak_days' | 'custom';
  target_value: number;
  target_unit: 'runs' | 'miles' | 'kilometers' | 'days' | 'minutes';
  activity_types: string[];
  time_period: 'weekly' | 'monthly' | 'daily' | 'custom';
  start_date?: string;
  end_date?: string;
  description?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchProfile(),
        fetchContacts(),
        fetchGoals()
      ]);
    } catch (err) {
      console.error('Error fetching user settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('user-settings/profile', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    setProfile(data);
  };

  const fetchContacts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('user-settings/contacts', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    setContacts(data || []);
  };

  const fetchGoals = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('user-settings/goals', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    setGoals(data || []);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('user-settings/profile', {
        method: 'PUT',
        body: updates,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  const addContact = async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('user-settings/contacts', {
        method: 'POST',
        body: contactData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setContacts(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to add contact');
      throw err;
    }
  };

  const updateContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke(`user-settings/contacts/${contactId}`, {
        method: 'PUT',
        body: updates,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setContacts(prev => prev.map(c => c.id === contactId ? data : c));
      return data;
    } catch (err) {
      console.error('Error updating contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to update contact');
      throw err;
    }
  };

  const removeContact = async (contactId: string) => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke(`user-settings/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (err) {
      console.error('Error removing contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove contact');
      throw err;
    }
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('user-settings/goals', {
        method: 'POST',
        body: goalData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setGoals(prev => [...prev, data].sort((a, b) => a.priority - b.priority));
      return data;
    } catch (err) {
      console.error('Error adding goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to add goal');
      throw err;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke(`user-settings/goals/${goalId}`, {
        method: 'PUT',
        body: updates,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === goalId ? data : g));
      return data;
    } catch (err) {
      console.error('Error updating goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to update goal');
      throw err;
    }
  };

  const removeGoal = async (goalId: string) => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke(`user-settings/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) {
      console.error('Error removing goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove goal');
      throw err;
    }
  };

  return {
    profile,
    contacts,
    goals,
    loading,
    error,
    refresh: fetchAll,
    updateProfile,
    addContact,
    updateContact,
    removeContact,
    addGoal,
    updateGoal,
    removeGoal,
  };
}
