import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Database } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics, calculateDaysSinceSignup } from '@/lib/analytics/index';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

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
        // Only update last_login_at on actual sign-in events
        const isSignInEvent = _event === 'SIGNED_IN' || _event === 'INITIAL_SESSION';
        fetchUser(session.user.id, isSignInEvent);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async (userId: string, updateLoginTimestamp = false) => {
    // Add stack trace to see where this is being called from
    console.log('useAuth - Fetching user profile for:', userId, 'updateTimestamp:', updateLoginTimestamp);
    console.log('useAuth - Called from:', new Error().stack?.split('\n')[2]);

    // Only update last_login_at on actual sign-in events, not every fetch
    if (updateLoginTimestamp) {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    }

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
          // The session token is automatically included by Supabase client
          const { data, error } = await supabase.functions.invoke('strava-auth', {
            body: {
              code,
              user_id: session.user.id
            }
          });

          if (error) {
            console.error('Error from strava-auth function:', error);
            // Try to get more details from the error
            try {
              if (error.context && error.context._bodyBlob) {
                const errorText = await error.context.text();
                console.error('Strava-auth error details:', errorText);
              }
            } catch (e) {
              console.error('Could not parse error details');
            }
            throw error;
          }

          console.log('Strava-auth response data:', data);

          console.log('Strava auth successful, refreshing user data');

          // Refresh user data to get updated Strava connection
          await fetchUser(session.user.id);

          // Trigger initial activity sync
          console.log('Triggering initial Strava activity sync...');
          const { error: syncError } = await supabase.functions.invoke('strava-sync', {
            body: {}, // Function uses JWT token to identify user
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (syncError) {
            console.error('Error syncing Strava activities:', syncError);
            // Don't throw - connection was successful, sync can be retried
          } else {
            console.log('Strava activities synced successfully');

            // Check if this is the user's first activity sync (activation milestone)
            const hasFirstActivity = await AsyncStorage.getItem('has_first_activity');
            if (!hasFirstActivity) {
              // Check if any activities were synced
              const { data: activities } = await supabase
                .from('strava_activities')
                .select('*')
                .eq('user_id', session.user.id)
                .limit(1);

              if (activities && activities.length > 0) {
                // Track first activity synced milestone
                const user = await supabase
                  .from('users')
                  .select('created_at')
                  .eq('id', session.user.id)
                  .single();

                if (user.data && analytics && typeof analytics.track === 'function') {
                  const signupDate = user.data.created_at ?? new Date().toISOString();
                  analytics.track(ANALYTICS_EVENTS.ACTIVATION_FIRST_ACTIVITY_SYNCED, {
                    days_since_signup: calculateDaysSinceSignup(signupDate),
                    activity_type: activities[0].type,
                  });

                  // Update user property
                  if (typeof analytics.setUserProperties === 'function') {
                    analytics.setUserProperties({
                      last_activity_sync_date: new Date().toISOString(),
                    });
                  }

                  await AsyncStorage.setItem('has_first_activity', 'true');
                }
              }
            }
          }
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
