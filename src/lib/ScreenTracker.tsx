import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import analytics, { ANALYTICS_EVENTS } from './analytics';

type ScreenTrackerProps = {
  screenName: string;
  properties?: Record<string, any>;
};

/**
 * Component to track screen views in React Native
 * Add this component to the top of each screen component
 */
export default function ScreenTracker({ screenName, properties }: ScreenTrackerProps) {
  const navigation = useNavigation();

  useEffect(() => {
    // Track screen view
    analytics.trackEvent(ANALYTICS_EVENTS.SCREEN_VIEW, {
      screen_name: screenName,
      ...properties
    });
    
    // You can also track focus/blur events if needed
    const unsubscribeFocus = navigation.addListener('focus', () => {
      analytics.trackEvent(ANALYTICS_EVENTS.SCREEN_VIEW, {
        screen_name: screenName,
        event_type: 'focus',
        ...properties
      });
    });

    return () => {
      unsubscribeFocus();
    };
  }, [screenName, navigation, properties]);

  // This component doesn't render anything
  return null;
} 