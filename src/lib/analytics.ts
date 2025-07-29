import { Mixpanel } from 'mixpanel-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { addDebugEvent } from './MixpanelDebug';

// Create a singleton instance of Mixpanel
let mixpanelInstance: Mixpanel | null = null;

/**
 * Initialize Mixpanel with your project token
 * Get your token from https://mixpanel.com/settings/project
 */
export const initMixpanel = async () => {
  if (mixpanelInstance) return mixpanelInstance;
  
  try {
    // Replace with your actual Mixpanel token
    const MIXPANEL_TOKEN = 'YOUR_MIXPANEL_TOKEN';
    
    // Create a new instance with the token and automatic events tracking disabled
    mixpanelInstance = new Mixpanel(MIXPANEL_TOKEN, false);
    
    // Initialize Mixpanel
    await mixpanelInstance.init();
    
    // Set some default properties that will be sent with all events
    mixpanelInstance.registerSuperProperties({
      platform: Platform.OS,
      app_version: require('../../package.json').version,
    });
    
    console.log('Mixpanel initialized successfully');
    return mixpanelInstance;
  } catch (error) {
    console.error('Failed to initialize Mixpanel:', error);
    return null;
  }
};

/**
 * Track an event with optional properties
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!mixpanelInstance) {
    console.warn('Mixpanel not initialized. Call initMixpanel first.');
    return;
  }
  
  // Show debug overlay in development mode
  if (__DEV__) {
    addDebugEvent(eventName, properties || {});
  }
  
  mixpanelInstance.track(eventName, properties);
};

/**
 * Identify a user with a unique ID and optional user properties
 */
export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  if (!mixpanelInstance) {
    console.warn('Mixpanel not initialized. Call initMixpanel first.');
    return;
  }
  
  // Show debug overlay in development mode
  if (__DEV__) {
    addDebugEvent('identify', { userId, ...userProperties });
  }
  
  mixpanelInstance.identify(userId);
  
  if (userProperties) {
    // Set user profile properties
    mixpanelInstance.getPeople().set(userProperties);
  }
};

/**
 * Reset the current user's identity
 */
export const resetUser = async () => {
  if (!mixpanelInstance) {
    console.warn('Mixpanel not initialized. Call initMixpanel first.');
    return;
  }
  
  // Show debug overlay in development mode
  if (__DEV__) {
    addDebugEvent('reset', {});
  }
  
  await mixpanelInstance.reset();
};

// Common events to track
export const ANALYTICS_EVENTS = {
  // Core app events
  APP_OPEN: 'App Open',
  SCREEN_VIEW: 'Screen View',
  BUTTON_CLICK: 'Button Click',
  
  // User events
  USER_SIGN_IN: 'User Sign In',
  USER_SIGN_UP: 'User Sign Up',
  USER_SIGN_OUT: 'User Sign Out',
  USER_PREFERENCE_SET: 'User Preference Set',
  USER_PROFILE_UPDATE: 'User Profile Update',
  
  // Onboarding funnel events
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_SCREEN_VIEWED: 'Onboarding Screen Viewed',
  ONBOARDING_SCREEN_COMPLETED: 'Onboarding Screen Completed',
  ONBOARDING_STEP_ABANDONED: 'Onboarding Step Abandoned',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  ONBOARDING_ERROR: 'Onboarding Error',
  
  // Specific onboarding interactions
  WHY_ACCOUNTABILITY_VIEWED: 'Why Accountability Viewed',
  SOCIAL_PROOF_VIEWED: 'Social Proof Viewed',
  MOTIVATION_QUIZ_STARTED: 'Motivation Quiz Started',
  MOTIVATION_SELECTED: 'Motivation Type Selected',
  GOAL_SETUP_STARTED: 'Goal Setup Started',
  GOAL_SELECTED: 'Goal Selected',
  VALUE_PREVIEW_VIEWED: 'Value Preview Viewed',
  FITNESS_APP_CONNECT_STARTED: 'Fitness App Connect Started',
  FITNESS_APP_CONNECTED: 'Fitness App Connected',
  FITNESS_APP_SKIPPED: 'Fitness App Skipped',
  CONTACT_SETUP_STARTED: 'Contact Setup Started',
  CONTACT_SELECTED: 'Contact Selected',
  MESSAGE_STYLE_SELECTED: 'Message Style Selected',
  
  // Legacy events (keeping for backward compatibility)
  GOAL_CREATED: 'Goal Created',
  ACTIVITY_TRACKED: 'Activity Tracked',
  MESSAGE_SENT: 'Message Sent',
  CONTACT_ADDED: 'Contact Added'
};

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
  ONBOARDING_SUCCESS: 'onboarding_success'
} as const;

// User properties for segmentation
export const USER_PROPERTIES = {
  ONBOARDING_STEP: '$onboarding_step',
  FIRST_NAME: '$first_name',
  LAST_NAME: '$last_name',
  DATE_OF_BIRTH: '$date_of_birth',
  FITNESS_LEVEL: '$fitness_level',
  PRIMARY_GOAL: '$primary_goal',
  AUTH_METHOD: '$auth_method',
  MOTIVATION_TYPE: '$motivation_type',
  GOAL_TYPE: '$goal_type',
  GOAL_VALUE: '$goal_value',
  FITNESS_APP_CONNECTED: '$fitness_app_connected',
  CONTACT_RELATIONSHIP: '$contact_relationship',
  MESSAGE_STYLE: '$message_style',
  ONBOARDING_COMPLETED_AT: '$onboarding_completed_at',
  ONBOARDING_DURATION: '$onboarding_duration'
} as const;

/**
 * Track onboarding screen views with consistent properties
 */
export const trackOnboardingScreenView = (screenName: string, additionalProperties?: Record<string, any>) => {
  const properties = {
    screen_name: screenName,
    screen_type: 'onboarding',
    timestamp: new Date().toISOString(),
    ...additionalProperties
  };

  trackEvent(ANALYTICS_EVENTS.ONBOARDING_SCREEN_VIEWED, properties);
  trackEvent(ANALYTICS_EVENTS.SCREEN_VIEW, properties);
};

/**
 * Track onboarding screen completion
 */
export const trackOnboardingScreenCompleted = (screenName: string, additionalProperties?: Record<string, any>) => {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_SCREEN_COMPLETED, {
    screen_name: screenName,
    screen_type: 'onboarding',
    timestamp: new Date().toISOString(),
    ...additionalProperties
  });
};

/**
 * Track onboarding errors with context
 */
export const trackOnboardingError = (error: string | Error, context: Record<string, any>) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  trackEvent(ANALYTICS_EVENTS.ONBOARDING_ERROR, {
    error_message: errorMessage,
    error_stack: errorStack,
    timestamp: new Date().toISOString(),
    ...context
  });
  
  console.error('Onboarding Error:', errorMessage, context);
};

/**
 * Set user properties for segmentation
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (!mixpanelInstance) {
    console.warn('Mixpanel not initialized. Call initMixpanel first.');
    return;
  }

  // Set as people properties for user profiles
  mixpanelInstance.getPeople().set(properties);
  
  // Also register as super properties for events
  mixpanelInstance.registerSuperProperties(properties);

  if (__DEV__) {
    addDebugEvent('set_user_properties', properties);
  }
};

/**
 * Track funnel step completion with timing
 */
export const trackFunnelStep = (stepName: string, stepNumber: number, totalSteps: number, additionalProperties?: Record<string, any>) => {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_SCREEN_COMPLETED, {
    funnel_step: stepName,
    step_number: stepNumber,
    total_steps: totalSteps,
    funnel_progress: Math.round((stepNumber / totalSteps) * 100),
    timestamp: new Date().toISOString(),
    ...additionalProperties
  });
};

export default {
  initMixpanel,
  trackEvent,
  identifyUser,
  resetUser,
  trackOnboardingScreenView,
  trackOnboardingScreenCompleted,
  trackOnboardingError,
  setUserProperties,
  trackFunnelStep,
  ANALYTICS_EVENTS,
  ONBOARDING_SCREENS,
  USER_PROPERTIES
}; 