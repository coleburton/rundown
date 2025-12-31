/**
 * Base Analytics Provider
 * Abstract class that all analytics providers must extend
 */

import { AnalyticsProvider, EventProperties, UserProperties } from '../types';

export abstract class BaseAnalyticsProvider implements AnalyticsProvider {
  protected initialized = false;
  protected providerName = 'Base';

  abstract init(): Promise<void>;
  abstract identify(userId: string, properties?: UserProperties): void;
  abstract track(eventName: string, properties?: EventProperties): void;
  abstract setUserProperties(properties: UserProperties): void;
  abstract reset(): Promise<void>;

  isInitialized(): boolean {
    return this.initialized;
  }

  protected log(message: string, data?: any) {
    if (__DEV__) {
      console.log(`[${this.providerName}] ${message}`, data || '');
    }
  }

  protected warn(message: string, data?: any) {
    console.warn(`[${this.providerName}] ${message}`, data || '');
  }

  protected error(message: string, error?: any) {
    console.error(`[${this.providerName}] ${message}`, error || '');
  }
}
