/**
 * Analytics Event Constants
 * Following PostHog naming convention: category:object_action
 *
 * Examples:
 * - onboarding:step_viewed
 * - paywall:plan_selected
 * - dashboard:refreshed
 */

export const ANALYTICS_EVENTS = {
  // ==================== App Lifecycle ====================
  APP_LAUNCHED: 'app:launched',
  APP_BACKGROUNDED: 'app:backgrounded',
  APP_FOREGROUNDED: 'app:foregrounded',
  APP_SESSION_STARTED: 'app:session_started',
  APP_SESSION_ENDED: 'app:session_ended',

  // ==================== Authentication ====================
  AUTH_SIGNUP_INITIATED: 'auth:signup_initiated',
  AUTH_SIGNUP_COMPLETED: 'auth:signup_completed',
  AUTH_LOGIN_INITIATED: 'auth:login_initiated',
  AUTH_LOGIN_COMPLETED: 'auth:login_completed',
  AUTH_LOGOUT: 'auth:logout',

  // ==================== Onboarding Funnel ====================
  ONBOARDING_STARTED: 'onboarding:started',
  ONBOARDING_STEP_VIEWED: 'onboarding:step_viewed',
  ONBOARDING_STEP_COMPLETED: 'onboarding:step_completed',
  ONBOARDING_STEP_ABANDONED: 'onboarding:step_abandoned',
  ONBOARDING_COMPLETED: 'onboarding:completed',
  ONBOARDING_ERROR: 'onboarding:error',

  // ==================== Specific Onboarding Steps ====================
  ONBOARDING_WHY_ACCOUNTABILITY_VIEWED: 'onboarding:why_accountability_viewed',
  ONBOARDING_SOCIAL_PROOF_VIEWED: 'onboarding:social_proof_viewed',
  ONBOARDING_MOTIVATION_QUIZ_STARTED: 'onboarding:motivation_quiz_started',
  ONBOARDING_MOTIVATION_SELECTED: 'onboarding:motivation_selected',
  ONBOARDING_GOAL_SETUP_STARTED: 'onboarding:goal_setup_started',
  ONBOARDING_GOAL_SELECTED: 'onboarding:goal_selected',
  ONBOARDING_VALUE_PREVIEW_VIEWED: 'onboarding:value_preview_viewed',
  ONBOARDING_FITNESS_APP_CONNECT_STARTED: 'onboarding:fitness_app_connect_started',
  ONBOARDING_FITNESS_APP_CONNECTED: 'onboarding:fitness_app_connected',
  ONBOARDING_FITNESS_APP_SKIPPED: 'onboarding:fitness_app_skipped',
  ONBOARDING_CONTACT_SETUP_STARTED: 'onboarding:contact_setup_started',
  ONBOARDING_CONTACT_SELECTED: 'onboarding:contact_selected',
  ONBOARDING_MESSAGE_STYLE_STARTED: 'onboarding:message_style_started',
  ONBOARDING_MESSAGE_STYLE_RECOMMENDED: 'onboarding:message_style_recommended',
  ONBOARDING_MESSAGE_STYLE_SELECTED: 'onboarding:message_style_selected',

  // ==================== Activation Milestones (NEW) ====================
  ACTIVATION_FIRST_DASHBOARD_VIEWED: 'activation:first_dashboard_viewed',
  ACTIVATION_FIRST_ACTIVITY_SYNCED: 'activation:first_activity_synced',
  ACTIVATION_WEEK1_RETAINED: 'activation:week1_retained',
  ACTIVATION_FIRST_GOAL_ACHIEVED: 'activation:first_goal_achieved',

  // ==================== Paywall & Revenue ====================
  PAYWALL_VIEWED: 'paywall:viewed',
  PAYWALL_DISMISSED: 'paywall:dismissed', // NEW
  PAYWALL_PLAN_SELECTED: 'paywall:plan_selected',
  PAYWALL_FREE_TRIAL_VIEWED: 'paywall:free_trial_viewed',

  // ==================== Purchases ====================
  PURCHASE_INITIATED: 'purchase:initiated',
  PURCHASE_COMPLETED: 'purchase:completed',
  PURCHASE_FAILED: 'purchase:failed',
  PURCHASE_CANCELLED: 'purchase:cancelled',

  // ==================== Subscription Lifecycle ====================
  SUBSCRIPTION_TRIAL_STARTED: 'subscription:trial_started',
  SUBSCRIPTION_RESTORED: 'subscription:restored',
  SUBSCRIPTION_CANCELLED: 'subscription:cancelled', // NEW
  SUBSCRIPTION_REACTIVATED: 'subscription:reactivated', // NEW
  SUBSCRIPTION_PLAN_CHANGED: 'subscription:plan_changed', // NEW

  // ==================== Strava Integration ====================
  STRAVA_CONNECTION_ATTEMPTED: 'strava:connection_attempted',
  STRAVA_CONNECTION_STARTED: 'strava:connection_started',
  STRAVA_CONNECTION_COMPLETED: 'strava:connection_completed',
  STRAVA_CONNECTION_FAILED: 'strava:connection_failed',
  STRAVA_DISCONNECTED: 'strava:disconnected', // NEW
  STRAVA_SYNC_INITIATED: 'strava:sync_initiated',
  STRAVA_SYNC_COMPLETED: 'strava:sync_completed',
  STRAVA_SYNC_FAILED: 'strava:sync_failed',
  STRAVA_ACTIVITY_SYNCED: 'strava:activity_synced',

  // ==================== Goal Management ====================
  GOAL_CREATED: 'goal:created',
  GOAL_UPDATED: 'goal:updated', // NEW
  GOAL_TYPE_CHANGED: 'goal:type_changed', // NEW
  GOAL_VALUE_CHANGED: 'goal:value_changed', // NEW
  GOAL_ACHIEVED: 'goal:achieved', // NEW
  GOAL_MISSED: 'goal:missed', // NEW
  GOAL_PROGRESS_UPDATED: 'goal:progress_updated',

  // ==================== Dashboard Interactions (NEW) ====================
  DASHBOARD_VIEWED: 'dashboard:viewed',
  DASHBOARD_REFRESHED: 'dashboard:refreshed',
  DASHBOARD_WEEK_CHANGED: 'dashboard:week_changed',
  DASHBOARD_ACTIVITY_CLICKED: 'dashboard:activity_clicked',
  DASHBOARD_STREAK_ACHIEVED: 'dashboard:streak_achieved', // NEW

  // ==================== Settings (NEW) ====================
  SETTINGS_VIEWED: 'settings:viewed',
  SETTINGS_PROFILE_UPDATED: 'settings:profile_updated',
  SETTINGS_GOAL_CHANGED: 'settings:goal_changed',
  SETTINGS_NOTIFICATIONS_TOGGLED: 'settings:notifications_toggled',
  SETTINGS_PRIVACY_VIEWED: 'settings:privacy_viewed',
  SETTINGS_TERMS_VIEWED: 'settings:terms_viewed',

  // ==================== User Profile ====================
  USER_SIGN_IN: 'user:sign_in', // Legacy compatibility
  USER_SIGN_UP: 'user:sign_up', // Legacy compatibility
  USER_SIGN_OUT: 'user:sign_out',
  USER_PROFILE_UPDATE: 'user:profile_update',
  USER_PREFERENCE_SET: 'user:preference_set',

  // ==================== Messages ====================
  MESSAGE_SCHEDULED: 'message:scheduled',
  MESSAGE_SENT_SUCCESS: 'message:sent_success',
  MESSAGE_SENT_FAILED: 'message:sent_failed',
  MESSAGE_VIEWED_IN_HISTORY: 'message:viewed_in_history', // NEW
  MESSAGE_STYLE_CHANGED: 'message:style_changed', // NEW
  MESSAGE_SENT: 'message:sent', // Legacy

  // ==================== Contacts ====================
  CONTACT_ADDED: 'contact:added',
  CONTACT_REMOVED: 'contact:removed', // NEW
  CONTACT_UPDATED: 'contact:updated', // NEW

  // ==================== Activity & Tracking ====================
  ACTIVITY_TRACKED: 'activity:tracked', // Legacy
  ACTIVITY_DETAIL_VIEWED: 'activity:detail_viewed', // NEW
  ACTIVITY_HISTORY_VIEWED: 'activity:history_viewed', // NEW

  // ==================== Forms & Interactions (NEW) ====================
  FORM_FIELD_COMPLETED: 'form:field_completed',
  FORM_VALIDATION_ERROR: 'form:validation_error',
  FORM_SUBMITTED: 'form:submitted',

  // ==================== General UI Interactions ====================
  SCREEN_VIEW: 'screen:view',
  BUTTON_CLICK: 'button:click',
  LINK_CLICKED: 'link:clicked', // NEW

  // ==================== Errors & Debugging ====================
  ERROR_OCCURRED: 'error:occurred', // NEW
  API_ERROR: 'api:error', // NEW
  NETWORK_ERROR: 'network:error', // NEW
} as const;

// Onboarding screen names for consistent tracking
export const ONBOARDING_SCREENS = {
  ONBOARDING: 'onboarding',
  USER_INFO: 'user_info',
  LOGIN: 'login',
  WELCOME: 'welcome',
  WHY_ACCOUNTABILITY: 'why_accountability',
  SOCIAL_PROOF: 'social_proof',
  MOTIVATION_QUIZ: 'motivation_quiz',
  GOAL_SETUP: 'goal_setup',
  VALUE_PREVIEW: 'value_preview',
  FITNESS_APP_CONNECT: 'fitness_app_connect',
  CONTACT_SETUP: 'contact_setup',
  MESSAGE_STYLE: 'message_style',
  ONBOARDING_SUCCESS: 'onboarding_success',
} as const;

// Screen names for general app navigation
export const SCREEN_NAMES = {
  DASHBOARD: 'Dashboard',
  SETTINGS: 'Settings',
  ACTIVITY_DETAIL: 'ActivityDetail',
  ACTIVITY_HISTORY: 'ActivityHistory',
  MESSAGE_HISTORY: 'MessageHistory',
  PAYWALL: 'Paywall',
  PAYWALL_FREE_TRIAL: 'PaywallFreeTrial',
  POST_PAYWALL_ONBOARDING: 'PostPaywallOnboarding',
  ...ONBOARDING_SCREENS,
} as const;

// Type for event names (for TypeScript autocomplete)
export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
export type OnboardingScreenName = typeof ONBOARDING_SCREENS[keyof typeof ONBOARDING_SCREENS];
export type ScreenName = typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];
