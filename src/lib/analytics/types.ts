/**
 * Analytics TypeScript types and interfaces
 * Provider-agnostic analytics abstraction layer
 */

// Event properties - can include any key-value pairs
export interface EventProperties {
  [key: string]: string | number | boolean | Date | null | undefined;
}

// User properties for identification and segmentation
export interface UserProperties {
  // Core identity
  user_id?: string;
  email?: string;
  name?: string;
  created_at?: string | Date;
  date_of_birth?: string | Date;
  age?: number;

  // Onboarding
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | Date;
  onboarding_duration_seconds?: number;
  fitness_level?: string;
  primary_goal?: string;
  auth_method?: string;
  motivation_type?: string;
  message_style?: string;

  // Goals
  goal_type?: string;
  goal_value?: number;

  // Behavioral metrics
  days_since_signup?: number;
  lifetime_activities_count?: number;
  lifetime_distance_miles?: number;
  current_streak_weeks?: number;
  longest_streak_weeks?: number;
  total_weeks_goal_met?: number;
  avg_activities_per_week?: number;

  // Subscription
  subscription_status?: 'active' | 'trial' | 'cancelled' | 'expired' | 'free';
  subscription_plan?: 'monthly' | 'annual';
  subscription_start_date?: string | Date;
  subscription_end_date?: string | Date;
  lifetime_value_usd?: number;
  days_subscribed?: number;

  // Integration
  strava_connected?: boolean;
  strava_athlete_id?: string;
  fitness_app_connected?: boolean;

  // Engagement
  last_dashboard_view_date?: string | Date;
  last_activity_sync_date?: string | Date;
  last_activity_date?: string | Date;
  push_notifications_enabled?: boolean;

  // Contact/accountability
  contact_relationship?: string;
  accountability_messages_sent_count?: number;

  // Allow additional custom properties
  [key: string]: string | number | boolean | Date | null | undefined;
}

// Base analytics provider interface
export interface AnalyticsProvider {
  /**
   * Initialize the analytics provider
   */
  init(): Promise<void>;

  /**
   * Identify a user with unique ID and optional properties
   */
  identify(userId: string, properties?: UserProperties): void;

  /**
   * Track an event with optional properties
   */
  track(eventName: string, properties?: EventProperties): void;

  /**
   * Set user properties for the identified user
   */
  setUserProperties(properties: UserProperties): void;

  /**
   * Reset/clear the current user identity
   */
  reset(): Promise<void>;

  /**
   * Check if provider is initialized
   */
  isInitialized(): boolean;
}

// Session information
export interface SessionInfo {
  session_id: string;
  session_start: Date;
  session_number: number;
}
