/**
 * Main Analytics Facade
 * Provider-agnostic analytics service that routes to configured providers
 *
 * This is the primary interface for all analytics in the app.
 * Import from this file: import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics';
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AnalyticsProvider, EventProperties, UserProperties, SessionInfo } from './types';
import { MixpanelProvider } from './providers/mixpanel';
import { PostHogProvider } from './providers/posthog';

// Use environment variable to enable PostHog when ready
const USE_POSTHOG = process.env.EXPO_PUBLIC_USE_POSTHOG === 'true';

/**
 * Main Analytics Service
 * Routes all analytics calls to configured providers
 */
class AnalyticsService {
  private providers: AnalyticsProvider[];
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Start with Mixpanel, add PostHog when credentials are ready
    this.providers = [new MixpanelProvider()];

    if (USE_POSTHOG) {
      this.providers.push(new PostHogProvider());
      console.log('[Analytics] PostHog provider enabled');
    }

    console.log(`[Analytics] Initialized with ${this.providers.length} provider(s)`);
  }

  /**
   * Initialize all analytics providers
   */
  async init(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        console.log('[Analytics] Initializing providers...');
        await Promise.all(this.providers.map(p => p.init()));
        console.log('[Analytics] All providers initialized');
      } catch (error) {
        console.error('[Analytics] Failed to initialize providers', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Identify a user with unique ID and optional properties
   */
  identify(userId: string, properties?: UserProperties): void {
    this.providers.forEach(provider => {
      try {
        provider.identify(userId, properties);
      } catch (error) {
        console.error(`[Analytics] Provider failed to identify user`, error);
      }
    });
  }

  /**
   * Track an event with optional properties
   */
  track(eventName: string, properties?: EventProperties): void {
    this.providers.forEach(provider => {
      try {
        provider.track(eventName, properties);
      } catch (error) {
        console.error(`[Analytics] Provider failed to track event`, error);
      }
    });
  }

  /**
   * Set user properties for the identified user
   */
  setUserProperties(properties: UserProperties): void {
    this.providers.forEach(provider => {
      try {
        provider.setUserProperties(properties);
      } catch (error) {
        console.error(`[Analytics] Provider failed to set user properties`, error);
      }
    });
  }

  /**
   * Reset/clear the current user identity
   */
  async reset(): Promise<void> {
    await Promise.all(
      this.providers.map(provider =>
        provider.reset().catch(error => {
          console.error(`[Analytics] Provider failed to reset`, error);
        })
      )
    );
  }

  /**
   * Check if all providers are initialized
   */
  isInitialized(): boolean {
    return this.providers.every(p => p.isInitialized());
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Helper Functions

/**
 * Get or create current session ID
 */
export const getSessionId = async (): Promise<string> => {
  try {
    let sessionId = await AsyncStorage.getItem('current_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('current_session_id', sessionId);
    }
    return sessionId;
  } catch (error) {
    console.error('[Analytics] Failed to get session ID', error);
    // Fallback to in-memory session ID
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Clear current session (call on logout or session expiry)
 */
export const clearSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('current_session_id');
  } catch (error) {
    console.error('[Analytics] Failed to clear session', error);
  }
};

/**
 * Enrich event properties with standard metadata
 */
export const enrichEventProperties = async (
  properties: EventProperties = {}
): Promise<EventProperties> => {
  const sessionId = await getSessionId();

  return {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    app_version: require('../../../package.json').version,
    ...properties,
  };
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Calculate days since signup
 */
export const calculateDaysSinceSignup = (signupDate: string | Date): number => {
  const signup = new Date(signupDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - signup.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate comprehensive user properties from user object
 */
export const calculateUserProperties = (user: any): UserProperties => {
  const daysSinceSignup = user.created_at
    ? calculateDaysSinceSignup(user.created_at)
    : undefined;

  const age = user.date_of_birth
    ? calculateAge(new Date(user.date_of_birth))
    : undefined;

  return {
    user_id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at,
    date_of_birth: user.date_of_birth,
    age,
    days_since_signup: daysSinceSignup,

    // Onboarding
    onboarding_completed: user.onboarding_completed,
    onboarding_completed_at: user.onboarding_completed_at,
    fitness_level: user.fitness_level,
    primary_goal: user.primary_goal,
    motivation_type: user.motivation_type,
    message_style: user.message_style,

    // Goals
    goal_type: user.goal_type,
    goal_value: user.goal_value,

    // Integration
    strava_connected: !!user.strava_athlete_id,
    strava_athlete_id: user.strava_athlete_id,

    // Allow additional properties from user object
    ...Object.keys(user).reduce((acc, key) => {
      // Skip sensitive or redundant fields
      const skipFields = ['password', 'password_hash', 'auth_token'];
      if (!skipFields.includes(key) && user[key] !== undefined && user[key] !== null) {
        acc[key] = user[key];
      }
      return acc;
    }, {} as Record<string, any>),
  };
};

// Re-export types for convenience
export type {
  AnalyticsProvider,
  EventProperties,
  UserProperties,
  SessionInfo,
} from './types';
