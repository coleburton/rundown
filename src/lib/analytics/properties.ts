/**
 * Analytics Property Constants
 * Defines standard event and user property names
 */

// ==================== Standard Event Properties ====================
// These properties are included with every event (or most events)
export const STANDARD_PROPERTIES = {
  SESSION_ID: 'session_id',
  SCREEN_NAME: 'screen_name',
  PREVIOUS_SCREEN_NAME: 'previous_screen_name',
  TIMESTAMP: 'timestamp',
  USER_SUBSCRIPTION_STATUS: 'user_subscription_status',
  PLATFORM: 'platform',
  APP_VERSION: 'app_version',
  DEVICE_MODEL: 'device_model',
  OS_VERSION: 'os_version',
} as const;

// ==================== User Properties ====================
// These properties are set on the user/person object for segmentation
export const USER_PROPERTIES = {
  // Core Identity
  USER_ID: 'user_id',
  EMAIL: 'email',
  NAME: 'name',
  FIRST_NAME: 'first_name',
  LAST_NAME: 'last_name',
  CREATED_AT: 'created_at',
  DATE_OF_BIRTH: 'date_of_birth',
  AGE: 'age',
  TIMEZONE: 'timezone',

  // Onboarding
  ONBOARDING_STEP: 'onboarding_step',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_COMPLETED_AT: 'onboarding_completed_at',
  ONBOARDING_DURATION_SECONDS: 'onboarding_duration_seconds',
  ONBOARDING_ABANDONED_STEP: 'onboarding_abandoned_step',
  FITNESS_LEVEL: 'fitness_level',
  PRIMARY_GOAL: 'primary_goal',
  AUTH_METHOD: 'auth_method',
  MOTIVATION_TYPE: 'motivation_type',
  MESSAGE_STYLE: 'message_style',

  // Goals
  GOAL_TYPE: 'goal_type',
  GOAL_VALUE: 'goal_value',

  // Behavioral Metrics (NEW)
  DAYS_SINCE_SIGNUP: 'days_since_signup',
  LIFETIME_ACTIVITIES_COUNT: 'lifetime_activities_count',
  LIFETIME_DISTANCE_MILES: 'lifetime_distance_miles',
  CURRENT_STREAK_WEEKS: 'current_streak_weeks',
  LONGEST_STREAK_WEEKS: 'longest_streak_weeks',
  TOTAL_WEEKS_GOAL_MET: 'total_weeks_goal_met',
  AVG_ACTIVITIES_PER_WEEK: 'avg_activities_per_week',

  // Subscription
  SUBSCRIPTION_STATUS: 'subscription_status',
  SUBSCRIPTION_PLAN: 'subscription_plan',
  SUBSCRIPTION_START_DATE: 'subscription_start_date',
  SUBSCRIPTION_END_DATE: 'subscription_end_date',
  LIFETIME_VALUE_USD: 'lifetime_value_usd',
  DAYS_SUBSCRIBED: 'days_subscribed',

  // Integration
  FITNESS_APP_CONNECTED: 'fitness_app_connected',
  STRAVA_CONNECTED: 'strava_connected',
  STRAVA_ATHLETE_ID: 'strava_athlete_id',

  // Engagement (NEW)
  LAST_DASHBOARD_VIEW_DATE: 'last_dashboard_view_date',
  LAST_ACTIVITY_SYNC_DATE: 'last_activity_sync_date',
  LAST_ACTIVITY_DATE: 'last_activity_date',
  PUSH_NOTIFICATIONS_ENABLED: 'push_notifications_enabled',

  // Contacts/Accountability
  CONTACT_RELATIONSHIP: 'contact_relationship',
  ACCOUNTABILITY_MESSAGES_SENT_COUNT: 'accountability_messages_sent_count',
} as const;

// ==================== Event-Specific Property Groups ====================

// Onboarding event properties
export const ONBOARDING_PROPERTIES = {
  STEP_NAME: 'step_name',
  STEP_NUMBER: 'step_number',
  TOTAL_STEPS: 'total_steps',
  TIME_ON_STEP_SECONDS: 'time_on_step_seconds',
  INTERACTION_COUNT: 'interaction_count',
  VALIDATION_ERRORS: 'validation_errors',
  ABANDONED_REASON: 'abandoned_reason',
  FUNNEL_PROGRESS: 'funnel_progress',
} as const;

// Purchase/paywall event properties
export const PURCHASE_PROPERTIES = {
  PLAN_ID: 'plan_id',
  PLAN_TYPE: 'plan_type',
  PRICE: 'price',
  CURRENCY: 'currency',
  PAYWALL_SOURCE: 'paywall_source',
  TIME_ON_PAYWALL_SECONDS: 'time_on_paywall_seconds',
  PLANS_VIEWED: 'plans_viewed',
  DISCOUNT_SHOWN: 'discount_shown',
  DISCOUNT_CODE: 'discount_code',
  PAYMENT_METHOD: 'payment_method',
  ERROR_MESSAGE: 'error_message',
} as const;

// Strava/activity properties
export const ACTIVITY_PROPERTIES = {
  ACTIVITY_ID: 'activity_id',
  ACTIVITY_TYPE: 'activity_type',
  ACTIVITY_NAME: 'activity_name',
  DISTANCE_MILES: 'distance_miles',
  DISTANCE_METERS: 'distance_meters',
  DURATION_SECONDS: 'duration_seconds',
  PACE: 'pace',
  COUNTS_TOWARD_GOAL: 'counts_toward_goal',
  ACTIVITY_DATE: 'activity_date',
} as const;

// Goal properties
export const GOAL_PROPERTIES = {
  GOAL_TYPE: 'goal_type',
  GOAL_VALUE: 'goal_value',
  PREVIOUS_GOAL_TYPE: 'previous_goal_type',
  PREVIOUS_GOAL_VALUE: 'previous_goal_value',
  GOAL_ACHIEVED: 'goal_achieved',
  GOAL_PROGRESS: 'goal_progress',
  CHANGED_FROM: 'changed_from', // 'onboarding' | 'settings'
} as const;

// Dashboard interaction properties
export const DASHBOARD_PROPERTIES = {
  WEEK_OFFSET: 'week_offset',
  DIRECTION: 'direction', // 'past' | 'future'
  CURRENT_PROGRESS: 'current_progress',
  GOAL: 'goal',
  IS_ON_TRACK: 'is_on_track',
  STREAK_LENGTH: 'streak_length',
} as const;

// Form interaction properties
export const FORM_PROPERTIES = {
  FIELD_NAME: 'field_name',
  FORM_NAME: 'form_name',
  FORM_COMPLETION_PERCENTAGE: 'form_completion_percentage',
  ERROR_TYPE: 'error_type',
  ERROR_MESSAGE: 'error_message',
  VALIDATION_PASSED: 'validation_passed',
} as const;

// UI interaction properties
export const UI_PROPERTIES = {
  BUTTON_NAME: 'button_name',
  BUTTON_LOCATION: 'button_location',
  LINK_URL: 'link_url',
  LINK_TEXT: 'link_text',
  TIME_ON_SCREEN_SECONDS: 'time_on_screen_seconds',
} as const;

// Authentication properties
export const AUTH_PROPERTIES = {
  AUTH_MODE: 'auth_mode', // 'signUp' | 'signIn'
  AUTH_METHOD: 'auth_method', // 'email' | 'strava'
  PASSWORD_STRENGTH: 'password_strength', // 'weak' | 'medium' | 'strong'
  FROM_MODE: 'from_mode',
  TO_MODE: 'to_mode',
} as const;

// Export all property groups as one object for easy access
export const ANALYTICS_PROPERTIES = {
  ...STANDARD_PROPERTIES,
  ...USER_PROPERTIES,
  ...ONBOARDING_PROPERTIES,
  ...PURCHASE_PROPERTIES,
  ...ACTIVITY_PROPERTIES,
  ...GOAL_PROPERTIES,
  ...DASHBOARD_PROPERTIES,
  ...FORM_PROPERTIES,
  ...UI_PROPERTIES,
  ...AUTH_PROPERTIES,
} as const;

// Type for property names (for TypeScript autocomplete)
export type AnalyticsPropertyName = typeof ANALYTICS_PROPERTIES[keyof typeof ANALYTICS_PROPERTIES];
