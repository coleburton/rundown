import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Database } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';

type User = Database['public']['Tables']['users']['Row'];

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
const redirectUri = makeRedirectUri({
  scheme: 'rundown',
  path: 'auth/callback',
  preferLocalhost: true,
});

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useAuth - Initial session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        userEmail: session?.user?.email 
      });
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      console.log('useAuth - Auth state change:', { 
        event: _event, 
        hasSession: !!session, 
        userId: session?.user?.id,
        userEmail: session?.user?.email 
      });
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async (userId: string) => {
    console.log('useAuth - Fetching user profile for:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('useAuth - Error fetching user profile:', error);
      console.log('useAuth - This might mean the user profile was not created yet');
      setLoading(false);
      return;
    }

    console.log('useAuth - User profile fetched successfully:', { id: data.id, name: data.name });
    setUser(data);
    setLoading(false);
  };

  const signInWithStrava = async () => {
    try {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No authenticated session found. User needs to log in first.');
        throw new Error('User must be logged in to connect Strava');
      }

      console.log('Found authenticated user:', session.user.id);
      console.log('DEBUG: Redirect URI being used:', redirectUri);

      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&scope=read,activity:read`;
      console.log('DEBUG: Full Strava auth URL:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        {
          showInRecents: true,
        }
      );

      if (result.type === 'success' && result.url) {
        const code = new URL(result.url).searchParams.get('code');
        if (code) {
          console.log('Strava auth code received, exchanging for token');
          
          // Exchange code for token using Supabase Edge Function
          const { data, error } = await supabase.functions.invoke('strava-auth', {
            body: { 
              code,
              user_id: session.user.id
            },
          });

          if (error) {
            console.error('Error from strava-auth function:', error);
            throw error;
          }

          console.log('Strava auth successful, refreshing user data');
          
          // Refresh user data to get updated Strava connection
          await fetchUser(session.user.id);
        }
      }
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUser(session.user.id);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    setUser(data);
    return data;
  };

  return {
    user,
    loading,
    signInWithStrava,
    signOut,
    refreshUser,
    updateUser,
  };
} 