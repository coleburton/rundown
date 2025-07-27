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
  APP_OPEN: 'App Open',
  SCREEN_VIEW: 'Screen View',
  BUTTON_CLICK: 'Button Click',
  USER_SIGN_IN: 'User Sign In',
  USER_SIGN_UP: 'User Sign Up',
  USER_SIGN_OUT: 'User Sign Out',
  USER_PREFERENCE_SET: 'User Preference Set',
  GOAL_CREATED: 'Goal Created',
  ACTIVITY_TRACKED: 'Activity Tracked',
  MESSAGE_SENT: 'Message Sent',
  CONTACT_ADDED: 'Contact Added'
};

export default {
  initMixpanel,
  trackEvent,
  identifyUser,
  resetUser,
  ANALYTICS_EVENTS
}; 