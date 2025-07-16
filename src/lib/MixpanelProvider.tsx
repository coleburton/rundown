import React, { useEffect } from 'react';
import analytics, { ANALYTICS_EVENTS } from './analytics';
import { useAuth } from '@/hooks/useAuth';

type MixpanelProviderProps = {
  children: React.ReactNode;
};

export default function MixpanelProvider({ children }: MixpanelProviderProps) {
  const { user } = useAuth();

  useEffect(() => {
    const initializeAnalytics = async () => {
      // Initialize Mixpanel
      await analytics.initMixpanel();
      
      // Track app open event
      analytics.trackEvent(ANALYTICS_EVENTS.APP_OPEN);
    };
    
    initializeAnalytics();
  }, []);

  // Identify user when they sign in
  useEffect(() => {
    if (user && user.id) {
      analytics.identifyUser(user.id, {
        email: user.email,
        name: user.name,
        $created: user.created_at,
      });
    }
  }, [user]);

  return <>{children}</>;
} 