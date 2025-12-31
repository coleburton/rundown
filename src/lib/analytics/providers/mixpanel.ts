/**
 * Mixpanel Analytics Provider
 * Implements the BaseAnalyticsProvider interface for Mixpanel
 */

import { Mixpanel } from 'mixpanel-react-native';
import { Platform } from 'react-native';
import { BaseAnalyticsProvider } from './base';
import { EventProperties, UserProperties } from '../types';
import { addDebugEvent } from '../../MixpanelDebug';

export class MixpanelProvider extends BaseAnalyticsProvider {
  private client: Mixpanel | null = null;
  protected providerName = 'Mixpanel';

  async init(): Promise<void> {
    if (this.initialized) {
      this.log('Already initialized');
      return;
    }

    try {
      // Get Mixpanel token from environment or use development token
      const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || 'dev-token-placeholder';

      // Create a new instance with the token and automatic events tracking disabled
      this.client = new Mixpanel(MIXPANEL_TOKEN, false);

      // Initialize Mixpanel
      await this.client.init();

      // Set some default properties that will be sent with all events
      this.client.registerSuperProperties({
        platform: Platform.OS,
        app_version: require('../../../../package.json').version,
      });

      this.initialized = true;
      this.log('Initialized successfully');
    } catch (error) {
      this.error('Failed to initialize', error);
      throw error;
    }
  }

  identify(userId: string, properties?: UserProperties): void {
    if (!this.client) {
      this.warn('Not initialized - cannot identify user');
      return;
    }

    try {
      // Show debug overlay in development mode
      if (__DEV__) {
        addDebugEvent('identify', { userId, ...properties });
      }

      this.client.identify(userId);

      if (properties) {
        // Set user profile properties
        this.client.getPeople().set(properties);
      }

      this.log('User identified', { userId });
    } catch (error) {
      this.error('Failed to identify user', error);
    }
  }

  track(eventName: string, properties?: EventProperties): void {
    if (!this.client) {
      this.warn('Not initialized - cannot track event');
      return;
    }

    try {
      // Show debug overlay in development mode
      if (__DEV__) {
        addDebugEvent(eventName, properties || {});
      }

      this.client.track(eventName, properties);
      this.log('Event tracked', { eventName, properties });
    } catch (error) {
      this.error('Failed to track event', error);
    }
  }

  setUserProperties(properties: UserProperties): void {
    if (!this.client) {
      this.warn('Not initialized - cannot set user properties');
      return;
    }

    try {
      // Set as people properties for user profiles
      this.client.getPeople().set(properties);

      // Also register as super properties for events
      this.client.registerSuperProperties(properties);

      if (__DEV__) {
        addDebugEvent('set_user_properties', properties);
      }

      this.log('User properties set', properties);
    } catch (error) {
      this.error('Failed to set user properties', error);
    }
  }

  async reset(): Promise<void> {
    if (!this.client) {
      this.warn('Not initialized - cannot reset');
      return;
    }

    try {
      // Show debug overlay in development mode
      if (__DEV__) {
        addDebugEvent('reset', {});
      }

      await this.client.reset();
      this.log('User reset');
    } catch (error) {
      this.error('Failed to reset user', error);
    }
  }
}
