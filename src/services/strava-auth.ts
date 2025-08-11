import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const STRAVA_CLIENT_ID = Constants.expoConfig?.extra?.stravaClientId || process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = Constants.expoConfig?.extra?.stravaClientSecret || process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET;
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'rundown',
  path: 'auth/strava/callback',
  preferLocalhost: true,
});

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: {
    id: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    profile_medium?: string;
  };
}

export interface StravaAuthResult {
  type: 'success' | 'cancel' | 'error';
  tokens?: StravaTokens;
  error?: string;
}

class StravaAuthService {
  private static instance: StravaAuthService;
  private tokens: StravaTokens | null = null;

  private constructor() {}

  static getInstance(): StravaAuthService {
    if (!StravaAuthService.instance) {
      StravaAuthService.instance = new StravaAuthService();
    }
    return StravaAuthService.instance;
  }

  async authenticate(): Promise<StravaAuthResult> {
    try {
      if (!STRAVA_CLIENT_ID) {
        throw new Error('Strava Client ID not configured');
      }
      
      console.log('Strava OAuth redirectUri:', redirectUri);
      console.log('Skipping backend - storing tokens locally only');

      const request = new AuthSession.AuthRequest({
        clientId: STRAVA_CLIENT_ID,
        scopes: ['activity:read'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          approval_prompt: 'force',
        },
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://www.strava.com/oauth/authorize',
      });

      if (result.type === 'success') {
        const { code } = result.params;
        
        if (!code) {
          return { type: 'error', error: 'No authorization code returned' };
        }

        const tokens = await this.exchangeCodeForTokens(code);
        
        if (tokens) {
          this.tokens = tokens;
          await this.storeTokens(tokens);
          return { type: 'success', tokens };
        } else {
          return { type: 'error', error: 'Failed to exchange code for tokens' };
        }
      } else if (result.type === 'cancel') {
        return { type: 'cancel' };
      } else {
        return { type: 'error', error: result.error?.message || 'Authentication failed' };
      }
    } catch (error) {
      console.error('Strava authentication error:', error);
      return { 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown authentication error' 
      };
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<StravaTokens | null> {
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Token exchange failed:', errorData);
        return null;
      }

      const data = await response.json();
      
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        athlete: data.athlete,
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return null;
    }
  }

  async refreshAccessToken(): Promise<StravaTokens | null> {
    try {
      if (!this.tokens?.refresh_token) {
        return null;
      }

      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          refresh_token: this.tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      const newTokens: StravaTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        athlete: this.tokens.athlete,
      };

      this.tokens = newTokens;
      await this.storeTokens(newTokens);
      
      return newTokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    if (!this.tokens) {
      await this.loadStoredTokens();
    }

    if (!this.tokens) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    
    if (this.tokens.expires_at <= now) {
      const refreshedTokens = await this.refreshAccessToken();
      if (!refreshedTokens) {
        return null;
      }
    }

    return this.tokens.access_token;
  }

  async storeTokens(tokens: StravaTokens): Promise<void> {
    try {
      await AsyncStorage.setItem('@strava_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Error storing Strava tokens:', error);
    }
  }

  async loadStoredTokens(): Promise<StravaTokens | null> {
    try {
      const storedTokens = await AsyncStorage.getItem('@strava_tokens');
      if (storedTokens) {
        this.tokens = JSON.parse(storedTokens);
        return this.tokens;
      }
    } catch (error) {
      console.error('Error loading stored Strava tokens:', error);
    }
    return null;
  }

  async clearTokens(): Promise<void> {
    try {
      this.tokens = null;
      await AsyncStorage.removeItem('@strava_tokens');
    } catch (error) {
      console.error('Error clearing Strava tokens:', error);
    }
  }

  isAuthenticated(): boolean {
    return this.tokens !== null;
  }

  getAthlete() {
    return this.tokens?.athlete;
  }

  async getActivities(after?: Date, before?: Date, per_page: number = 30): Promise<any[]> {
    try {
      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      let url = `https://www.strava.com/api/v3/athlete/activities?per_page=${per_page}`;
      
      if (after) {
        url += `&after=${Math.floor(after.getTime() / 1000)}`;
      }
      
      if (before) {
        url += `&before=${Math.floor(before.getTime() / 1000)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
      }

      const activities = await response.json();
      console.log(`Fetched ${activities.length} activities from Strava`);
      
      return activities;
    } catch (error) {
      console.error('Error fetching Strava activities:', error);
      throw error;
    }
  }

  async getAthleteStats(): Promise<any> {
    try {
      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      const athlete = this.getAthlete();
      if (!athlete?.id) {
        throw new Error('No athlete ID available');
      }

      const response = await fetch(`https://www.strava.com/api/v3/athletes/${athlete.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
      }

      const stats = await response.json();
      console.log('Fetched athlete stats from Strava');
      
      return stats;
    } catch (error) {
      console.error('Error fetching Strava athlete stats:', error);
      throw error;
    }
  }

  async sendTokensToBackend(tokens: StravaTokens): Promise<boolean> {
    try {
      console.log('Sending tokens to backend URL:', `${BACKEND_URL}/api/auth/strava/connect`);
      
      const response = await fetch(`${BACKEND_URL}/api/auth/strava/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          athlete: tokens.athlete,
        }),
      });

      console.log('Backend response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
      }

      return response.ok;
    } catch (error) {
      console.error('Error sending tokens to backend:', error);
      return false;
    }
  }
}

export default StravaAuthService;