import { useState, useEffect, useCallback } from 'react';
import { User } from '../types/mock';
import { MockAuth } from '../lib/mock-auth';
import { useMockData } from '../lib/mock-data-context';

export function useMockAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state, setUser } = useMockData();
  const auth = MockAuth.getInstance();

  useEffect(() => {
    // Initialize auth state - wait for async storage loading
    const initAuth = async () => {
      try {
        await auth.initialize();
        setUser(auth.currentUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, [setUser]);

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await auth.signIn();
      setUser(user);
      return user;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await auth.signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const connectStrava = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await auth.connectStrava();
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Strava');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const disconnectStrava = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await auth.disconnectStrava();
      setUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Strava');
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await auth.updateUser(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  return {
    isAuthenticated: auth.isAuthenticated,
    user: state.user,
    isLoading,
    error,
    signIn,
    signOut,
    connectStrava,
    disconnectStrava,
    updateUser,
  };
} 