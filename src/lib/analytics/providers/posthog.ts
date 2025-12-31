/**
 * PostHog Analytics Provider (Stub - Ready for Credentials)
 * Implements the BaseAnalyticsProvider interface for PostHog
 *
 * TO USE:
 * 1. Install PostHog SDK: npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization
 * 2. Add to .env: EXPO_PUBLIC_POSTHOG_API_KEY=your_key and EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
 * 3. Set EXPO_PUBLIC_USE_POSTHOG=true in .env
 * 4. Uncomment the implementation below
 */

import { Platform } from 'react-native';
import { BaseAnalyticsProvider } from './base';
import { EventProperties, UserProperties } from '../types';

// Uncomment when PostHog SDK is installed:
// import PostHog from 'posthog-react-native';

export class PostHogProvider extends BaseAnalyticsProvider {
  // private client: PostHog | null = null;
  protected providerName = 'PostHog';

  async init(): Promise<void> {
    if (this.initialized) {
      this.log('Already initialized');
      return;
    }

    // Stub implementation - logs only
    this.log('PostHog ready - awaiting credentials');
    this.log('To enable: Install SDK and configure environment variables');
    this.initialized = true;

    /* UNCOMMENT WHEN POSTHOG SDK IS INSTALLED:

    try {
      const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
      const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

      if (!apiKey) {
        this.warn('PostHog API key not configured');
        return;
      }

      this.client = new PostHog(
        apiKey,
        {
          host,
          captureApplicationLifecycleEvents: true,  // Auto-track app lifecycle
          captureDeepLinks: true,
          debug: __DEV__,  // Enable debug logs in development
          enableSessionReplay: false,  // Can enable later with dev build
          featureFlagsRequestTimeoutMs: 10000,
        }
      );

      await this.client.init();

      // Set default properties
      this.client.register({
        platform: Platform.OS,
        app_version: require('../../../../package.json').version,
      });

      this.initialized = true;
      this.log('Initialized successfully');
    } catch (error) {
      this.error('Failed to initialize', error);
      throw error;
    }
    */
  }

  identify(userId: string, properties?: UserProperties): void {
    // Stub implementation
    this.log('Identify (stub)', { userId, ...properties });

    /* UNCOMMENT WHEN POSTHOG SDK IS INSTALLED:

    if (!this.client) {
      this.warn('Not initialized - cannot identify user');
      return;
    }

    try {
      this.client.identify(userId, properties);
      this.log('User identified', { userId });
    } catch (error) {
      this.error('Failed to identify user', error);
    }
    */
  }

  track(eventName: string, properties?: EventProperties): void {
    // Stub implementation
    this.log('Track event (stub)', { eventName, ...properties });

    /* UNCOMMENT WHEN POSTHOG SDK IS INSTALLED:

    if (!this.client) {
      this.warn('Not initialized - cannot track event');
      return;
    }

    try {
      this.client.capture(eventName, properties);
      this.log('Event tracked', { eventName, properties });
    } catch (error) {
      this.error('Failed to track event', error);
    }
    */
  }

  setUserProperties(properties: UserProperties): void {
    // Stub implementation
    this.log('Set user properties (stub)', properties);

    /* UNCOMMENT WHEN POSTHOG SDK IS INSTALLED:

    if (!this.client) {
      this.warn('Not initialized - cannot set user properties');
      return;
    }

    try {
      this.client.setPersonProperties(properties);
      this.log('User properties set', properties);
    } catch (error) {
      this.error('Failed to set user properties', error);
    }
    */
  }

  async reset(): Promise<void> {
    // Stub implementation
    this.log('Reset (stub)');

    /* UNCOMMENT WHEN POSTHOG SDK IS INSTALLED:

    if (!this.client) {
      this.warn('Not initialized - cannot reset');
      return;
    }

    try {
      await this.client.reset();
      this.log('User reset');
    } catch (error) {
      this.error('Failed to reset user', error);
    }
    */
  }
}
