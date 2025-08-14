/**
 * Debug utilities for development and testing
 */

export const DEBUG_MODE = __DEV__;

export interface DebugSkipOptions {
  skipDataSave?: boolean;
  skipValidation?: boolean;
  mockData?: any;
}

/**
 * Check if debug mode is enabled
 */
export const isDebugMode = (): boolean => {
  return DEBUG_MODE;
};

/**
 * Get debug skip options for onboarding screens
 */
export const getDebugSkipOptions = (): DebugSkipOptions => {
  if (!isDebugMode()) {
    return {};
  }

  return {
    skipDataSave: true,
    skipValidation: true,
    mockData: null
  };
};

/**
 * Mock data for testing various onboarding screens
 */
export const getMockOnboardingData = (screen: string) => {
  if (!isDebugMode()) {
    return null;
  }

  const mockData: Record<string, any> = {
    motivation: 'avoiding_guilt',
    goal: { type: 'total_activities', value: 3 },
    contact: { name: 'Test Contact', phone: '+1234567890' },
    message: 'You missed your goal this week!',
    fitness_app: 'strava'
  };

  return mockData[screen] || null;
};