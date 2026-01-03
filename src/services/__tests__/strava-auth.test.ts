import StravaAuthService from '@/services/strava-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

jest.mock('expo-auth-session', () => {
  const promptAsyncMock = jest.fn();
  const makeRedirectUriMock = jest.fn(() => 'rundown://auth');
  return {
    AuthRequest: jest.fn().mockImplementation(() => ({
      promptAsync: promptAsyncMock
    })),
    makeRedirectUri: makeRedirectUriMock,
    ResponseType: { Code: 'code' },
    __esModule: true,
    __mocked: {
      promptAsyncMock,
      makeRedirectUriMock
    }
  };
});

const { __mocked } = jest.requireMock('expo-auth-session');
const promptAsyncMock = __mocked.promptAsyncMock;
const makeRedirectUriMock = __mocked.makeRedirectUriMock;

jest.mock('expo-web-browser', () => {
  const openAuthSessionAsyncMock = jest.fn();
  return {
    maybeCompleteAuthSession: jest.fn(),
    openAuthSessionAsync: openAuthSessionAsyncMock,
    __esModule: true,
    __mocked: { openAuthSessionAsyncMock }
  };
});
const webBrowserMocks = jest.requireMock('expo-web-browser').__mocked;
const openAuthSessionAsyncMock = webBrowserMocks.openAuthSessionAsyncMock;

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        stravaClientId: 'client-id'
      }
    }
  }
}));

describe('StravaAuthService', () => {
  const fetchMock = global.fetch as jest.Mock;

  beforeEach(() => {
    (StravaAuthService as any).instance = undefined;
    (StravaAuthService as any).prototype.tokens = null;
    jest.clearAllMocks();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, athlete: { id: 1 } }),
      text: async () => ''
    });
  });

  test('authenticate succeeds when OAuth flow returns a code', async () => {
    promptAsyncMock.mockResolvedValueOnce({
      type: 'success',
      params: { code: 'auth-code' }
    });

    const service = StravaAuthService.getInstance();
    const result = await service.authenticate();

    expect(result.type).toBe('success');
    expect(fetchMock).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@strava_tokens',
      expect.any(String)
    );
  });

  test('authenticate handles cancellation', async () => {
    promptAsyncMock.mockResolvedValueOnce({ type: 'cancel' });

    const service = StravaAuthService.getInstance();
    const result = await service.authenticate();

    expect(result.type).toBe('cancel');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('getValidAccessToken loads stored tokens', async () => {
    const service = StravaAuthService.getInstance();
    const tokens = {
      access_token: 'stored-token',
      refresh_token: 'r',
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
    await AsyncStorage.setItem('@strava_tokens', JSON.stringify(tokens));

    const accessToken = await service.getValidAccessToken();
    expect(accessToken).toBe('stored-token');
  });

  test('sendTokensToBackend returns false on error response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'server error'
    });

    const service = StravaAuthService.getInstance();
    const result = await service.sendTokensToBackend({
      access_token: 'a',
      refresh_token: 'r',
      expires_at: 1,
      athlete: { id: 1 }
    });

    expect(result).toBe(false);
  });

  test('sendTokensToBackend returns true on success', async () => {
    const service = StravaAuthService.getInstance();
    const result = await service.sendTokensToBackend({
      access_token: 'a',
      refresh_token: 'r',
      expires_at: 1,
      athlete: { id: 1 }
    });

    expect(result).toBe(true);
  });
});
