import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StravaConnectionStatus = 'connected' | 'disconnected' | 'auth_failed' | 'token_expired';

const DISMISS_KEY = '@strava_connection_notice_dismissed_at';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export class StravaConnectionService {
  /**
   * Check if user's Strava connection is valid
   */
  static async checkConnectionStatus(userId: string): Promise<{
    status: StravaConnectionStatus;
    needsReconnection: boolean;
    disconnectedAt?: string;
    reason?: string;
  }> {
    const { data, error } = await supabase
      .from('users')
      .select('strava_connection_status, strava_disconnected_at, strava_disconnection_reason, strava_id, access_token')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error checking connection status:', error);
      return { status: 'disconnected', needsReconnection: true };
    }

    const status = (data.strava_connection_status || 'disconnected') as StravaConnectionStatus;
    const needsReconnection = !data.strava_id || !data.access_token || ['auth_failed', 'disconnected'].includes(status);

    return {
      status,
      needsReconnection,
      disconnectedAt: data.strava_disconnected_at ?? undefined,
      reason: data.strava_disconnection_reason ?? undefined
    };
  }

  /**
   * Check if notice should be shown (not dismissed recently)
   */
  static async shouldShowNotice(): Promise<boolean> {
    try {
      const dismissedAt = await AsyncStorage.getItem(DISMISS_KEY);
      if (!dismissedAt) return true;

      const dismissTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const shouldShow = (now - dismissTime) > DISMISS_DURATION_MS;

      console.log('Notice dismissal check:', {
        dismissedAt: new Date(dismissTime).toISOString(),
        hoursSinceDismissal: Math.floor((now - dismissTime) / (60 * 60 * 1000)),
        shouldShow
      });

      return shouldShow;
    } catch (error) {
      console.error('Error checking dismissal:', error);
      return true; // Show notice if we can't read dismissal
    }
  }

  /**
   * Dismiss notice for 24 hours
   */
  static async dismissNotice(): Promise<void> {
    try {
      await AsyncStorage.setItem(DISMISS_KEY, Date.now().toString());
      console.log('Notice dismissed for 24 hours');
    } catch (error) {
      console.error('Error dismissing notice:', error);
    }
  }

  /**
   * Clear dismissal (e.g., when user reconnects)
   */
  static async clearDismissal(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DISMISS_KEY);
      console.log('Notice dismissal cleared');
    } catch (error) {
      console.error('Error clearing dismissal:', error);
    }
  }

  /**
   * Disconnect from Strava (calls edge function)
   */
  static async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'No active session' };
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        return { success: false, error: 'Supabase URL not configured' };
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/strava-disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Disconnect failed:', errorData);
        return { success: false, error: errorData.error || 'Disconnect failed' };
      }

      // Clear dismissal on successful disconnect
      await this.clearDismissal();

      return { success: true };
    } catch (error) {
      console.error('Exception during disconnect:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
