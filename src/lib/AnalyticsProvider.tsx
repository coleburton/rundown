/**
 * Analytics Provider Component
 * Provider-agnostic analytics initialization and user identification
 */

import React, { useEffect } from 'react';
import { analytics, calculateUserProperties } from './analytics/index';
import { ANALYTICS_EVENTS } from './analytics/events';
import { useAuth } from '@/hooks/useAuth';

type AnalyticsProviderProps = {
  children: React.ReactNode;
};

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user } = useAuth();

  // Initialize analytics on mount
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        await analytics.init();

        // Track app launch
        analytics.track(ANALYTICS_EVENTS.APP_LAUNCHED);

        console.log('[AnalyticsProvider] Analytics initialized successfully');
      } catch (error) {
        console.error('[AnalyticsProvider] Failed to initialize analytics:', error);
      }
    };

    initializeAnalytics();
  }, []);

  // Identify user when they sign in
  useEffect(() => {
    if (user && user.id) {
      try {
        const userProperties = calculateUserProperties(user);
        analytics.identify(user.id, userProperties);

        console.log('[AnalyticsProvider] User identified:', {
          id: user.id,
          email: user.email,
          name: user.name,
        });
      } catch (error) {
        console.error('[AnalyticsProvider] Failed to identify user:', error);
      }
    }
  }, [user]);

  return <>{children}</>;
}
