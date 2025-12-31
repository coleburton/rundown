/**
 * Legacy Analytics Module (Backward Compatibility)
 * This file re-exports from the new analytics structure for backward compatibility
 * New code should import from './analytics/' directly
 *
 * MIGRATION GUIDE:
 * Old: import analytics, { ANALYTICS_EVENTS } from '@/lib/analytics';
 * New: import { analytics } from '@/lib/analytics';
 *      import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
 */

import { analytics as analyticsService } from './analytics/index';

/**
 * Initialize analytics (now initializes all configured providers)
 * @deprecated Use analytics.init() directly from '@/lib/analytics'
 */
export const initMixpanel = async () => {
  await analyticsService.init();
  return analyticsService;
};

/**
 * Track an event with optional properties
 * @deprecated Use analytics.track() directly from '@/lib/analytics'
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  analyticsService.track(eventName, properties);
};

/**
 * Identify a user with a unique ID and optional user properties
 * @deprecated Use analytics.identify() directly from '@/lib/analytics'
 */
export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  analyticsService.identify(userId, userProperties);
};

/**
 * Reset the current user's identity
 * @deprecated Use analytics.reset() directly from '@/lib/analytics'
 */
export const resetUser = async () => {
  await analyticsService.reset();
};

// Re-export events from new structure
// @deprecated Import from '@/lib/analytics/events' instead
export { ANALYTICS_EVENTS, ONBOARDING_SCREENS } from './analytics/events';

// Re-export properties from new structure
// @deprecated Import from '@/lib/analytics/properties' instead
export { USER_PROPERTIES } from './analytics/properties';

/**
 * Track onboarding screen views with consistent properties
 * @deprecated Use analytics.track() with ANALYTICS_EVENTS.ONBOARDING_STEP_VIEWED
 */
export const trackOnboardingScreenView = (screenName: string, additionalProperties?: Record<string, any>) => {
  const properties = {
    screen_name: screenName,
    screen_type: 'onboarding',
    timestamp: new Date().toISOString(),
    ...additionalProperties
  };

  analyticsService.track('onboarding:step_viewed', properties);
  analyticsService.track('screen:view', properties);
};

/**
 * Track onboarding screen completion
 * @deprecated Use analytics.track() with ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED
 */
export const trackOnboardingScreenCompleted = (screenName: string, additionalProperties?: Record<string, any>) => {
  analyticsService.track('onboarding:step_completed', {
    screen_name: screenName,
    screen_type: 'onboarding',
    timestamp: new Date().toISOString(),
    ...additionalProperties
  });
};

/**
 * Track onboarding errors with context
 * @deprecated Use analytics.track() with ANALYTICS_EVENTS.ONBOARDING_ERROR
 */
export const trackOnboardingError = (error: string | Error, context: Record<string, any>) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  analyticsService.track('onboarding:error', {
    error_message: errorMessage,
    error_stack: errorStack,
    timestamp: new Date().toISOString(),
    ...context
  });

  console.error('Onboarding Error:', errorMessage, context);
};

/**
 * Set user properties for segmentation
 * @deprecated Use analytics.setUserProperties() directly from '@/lib/analytics'
 */
export const setUserProperties = (properties: Record<string, any>) => {
  analyticsService.setUserProperties(properties);
};

/**
 * Track funnel step completion with timing
 * @deprecated Use analytics.track() with ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED
 */
export const trackFunnelStep = (stepName: string, stepNumber: number, totalSteps: number, additionalProperties?: Record<string, any>) => {
  analyticsService.track('onboarding:step_completed', {
    funnel_step: stepName,
    step_number: stepNumber,
    total_steps: totalSteps,
    funnel_progress: Math.round((stepNumber / totalSteps) * 100),
    timestamp: new Date().toISOString(),
    ...additionalProperties
  });
};

// Default export for backward compatibility
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
}; 