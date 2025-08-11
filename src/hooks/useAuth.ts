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
});

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUser(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return;
    }

    setUser(data);
  };

  const signInWithStrava = async () => {
    try {
      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&scope=read,activity:read`;

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
          // Exchange code for token using Supabase Edge Function
          const { data, error } = await supabase.functions.invoke('strava-auth', {
            body: { code },
          });

          if (error) throw error;

          // Sign in with custom token from Edge Function
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.token,
          });

          if (signInError) throw signInError;
        }
      }
    } catch (error) {
      console.error('Error signing in with Strava:', error);
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

  return {
    user,
    loading,
    signInWithStrava,
    signOut,
    refreshUser,
  };
} 