# Edge Functions Deployment Guide

Deploy these functions directly in the Supabase Dashboard → Edge Functions → Create new function

## Deployment Order

Deploy in this order to handle dependencies:

1. **strava-auth** (OAuth flow)
2. **strava-sync** (Activity sync)
3. **smooth-responder** (Webhook handler - IMPORTANT: Disable JWT verification)
4. **webhook-manager** (Webhook management)
5. **user-settings** (User API)

---

## 1. strava-auth

**Function name:** `strava-auth`
**JWT verification:** ✅ Enabled

### Code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID');
const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ENCRYPTION_KEY = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-dev-key-change-in-prod';

// SECURITY: Token encryption utilities
async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(token)
  );

  // Combine IV and encrypted data, then encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(encryptedToken: string): Promise<string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const combined = new Uint8Array(
    atob(encryptedToken)
      .split('')
      .map(char => char.charCodeAt(0))
  );

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encrypted
  );

  return decoder.decode(decrypted);
}

interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
  };
}

serve(async (req) => {
  try {
    console.log('Strava auth function called');
    const { code, user_id } = await req.json();
    console.log('Request data:', { hasCode: !!code, user_id });

    if (!code) {
      console.error('No authorization code provided');
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400 }
      );
    }

    if (!user_id) {
      console.error('No user_id provided');
      return new Response(
        JSON.stringify({ error: 'User ID is required for Strava connection' }),
        { status: 400 }
      );
    }

    // Check environment variables
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      console.error('Missing Strava environment variables');
      return new Response(
        JSON.stringify({ error: 'Strava configuration missing' }),
        { status: 500 }
      );
    }

    console.log('Exchanging code for token with Strava');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
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

    console.log('Strava token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Strava token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      });
      return new Response(
        JSON.stringify({
          error: 'Failed to exchange code for token',
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          details: errorData
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const stravaData = (await tokenResponse.json()) as StravaTokenResponse;
    console.log('Strava data received:', { athleteId: stravaData.athlete.id });

    // Initialize Supabase client with service role key
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Database configuration missing' }),
        { status: 500 }
      );
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Checking if user exists:', user_id);

    try {
      // Check if user exists by user_id (from current session)
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, email, strava_id, name')
        .eq('id', user_id)
        .single();

      console.log('User lookup completed');

      if (userError) {
        console.error('Error fetching user:', userError);
        return new Response(
          JSON.stringify({ error: 'User not found', details: userError.message }),
          { status: 404 }
        );
      }

      if (!existingUser) {
        console.error('User not found in database');
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404 }
        );
      }

      console.log('User found, updating Strava connection');

      // SECURITY: Encrypt tokens before storing
      const encryptedAccessToken = await encryptToken(stravaData.access_token);
      const encryptedRefreshToken = await encryptToken(stravaData.refresh_token);

      // Update the existing user's Strava connection
      const { error: updateError } = await supabase
        .from('users')
        .update({
          strava_id: stravaData.athlete.id.toString(),
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: new Date(stravaData.expires_at * 1000).toISOString(),
          name: existingUser.name || `${stravaData.athlete.firstname} ${stravaData.athlete.lastname}`,
        })
        .eq('id', user_id);

      console.log('User update completed');

      if (updateError) {
        console.error('Error updating user:', updateError);

        // Check if this is a duplicate strava_id error
        if (updateError.code === '23505' && updateError.message.includes('strava_id')) {
          return new Response(
            JSON.stringify({
              error: 'This Strava account is already connected to another user',
              code: 'STRAVA_ALREADY_CONNECTED'
            }),
            { status: 409 }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Failed to update user', details: updateError.message }),
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: dbError.message }),
        { status: 500 }
      );
    }

    console.log('Strava connection successful');

    return new Response(
      JSON.stringify({
        success: true,
        athlete: stravaData.athlete,
        message: 'Strava account connected successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Unexpected error in strava-auth function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
});
```

---

## 2. strava-sync

**Function name:** `strava-sync`
**JWT verification:** ✅ Enabled

### Code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const STRAVA_API_URL = 'https://www.strava.com/api/v3';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  kudos_count: number;
  achievement_count: number;
  athlete: {
    id: number;
  };
}

serve(async (req) => {
  try {
    console.log('Strava sync function called');

    const { after } = await req.json();
    const authHeader = req.headers.get('Authorization');

    console.log('Request data:', { hasAfter: !!after, hasAuth: !!authHeader });

    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    console.log('Attempting to get user with token');

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('Auth result:', { hasUser: !!user, authError: authError?.message });

    if (authError || !user) {
      console.error('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: authError?.message }),
        { status: 401 }
      );
    }

    console.log('Looking up user in users table:', user.id);

    // Get user's Strava credentials - check both public.users and auth.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('strava_id, access_token, refresh_token, token_expires_at')
      .eq('id', user.id)
      .single();

    console.log('User lookup result:', { hasUserData: !!userData, userError: userError?.message, stravaId: userData?.strava_id });

    if (userError || !userData) {
      // Try to find user by email as fallback
      console.log('User not found by id, trying email lookup:', user.email);

      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id, strava_id, access_token, refresh_token, token_expires_at')
        .eq('email', user.email!)
        .single();

      console.log('Email lookup result:', { hasUserByEmail: !!userByEmail, emailError: emailError?.message });

      if (emailError || !userByEmail) {
        console.error('User not found in users table');
        return new Response(
          JSON.stringify({
            error: 'User not found in database',
            details: `User ${user.id} (${user.email}) not found in users table`,
            userError: userError?.message,
            emailError: emailError?.message
          }),
          { status: 404 }
        );
      }

      // Use email lookup result
      userData = userByEmail;
    }

    if (!userData.access_token || !userData.strava_id) {
      console.error('User has no Strava credentials');
      return new Response(
        JSON.stringify({
          error: 'User not connected to Strava',
          details: 'Please connect your Strava account first'
        }),
        { status: 400 }
      );
    }

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(userData.token_expires_at);

    console.log('Token expiry check:', { now: now.toISOString(), expiresAt: expiresAt.toISOString(), needsRefresh: expiresAt <= now });

    if (expiresAt <= now) {
      console.log('Token expired, attempting refresh');

      // Refresh token
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: Deno.env.get('STRAVA_CLIENT_ID'),
          client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
          refresh_token: userData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      console.log('Token refresh response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        console.error('Token refresh failed:', data);
        throw new Error(`Failed to refresh token: ${data.message || response.statusText}`);
      }

      console.log('Token refreshed successfully');

      // Update user's tokens
      await supabase
        .from('users')
        .update({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_expires_at: new Date(data.expires_at * 1000).toISOString(),
        })
        .eq('id', user.id);

      userData.access_token = data.access_token;
    }

    // Calculate after timestamp
    const afterTimestamp = after ? Math.floor(new Date(after).getTime() / 1000) : Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const activitiesUrl = `${STRAVA_API_URL}/athlete/activities?after=${afterTimestamp}&per_page=50`;

    console.log('Fetching activities from Strava:', activitiesUrl);

    // Fetch activities from Strava
    const activitiesResponse = await fetch(activitiesUrl, {
      headers: {
        Authorization: `Bearer ${userData.access_token}`,
      },
    });

    console.log('Strava activities response status:', activitiesResponse.status);

    if (!activitiesResponse.ok) {
      const errorText = await activitiesResponse.text();
      console.error('Strava API error:', errorText);
      throw new Error(`Failed to fetch activities from Strava: ${activitiesResponse.status} ${activitiesResponse.statusText}`);
    }

    const activities: StravaActivity[] = await activitiesResponse.json();
    console.log('Fetched activities:', activities.length);

    // Store all activities (not just runs)
    if (activities.length > 0) {
      const { error: activitiesError } = await supabase.from('activities').upsert(
        activities.map((activity) => ({
          user_id: user.id,
          strava_activity_id: activity.id,
          name: activity.name,
          type: activity.type,
          sport_type: activity.sport_type,
          start_date: activity.start_date,
          start_date_local: activity.start_date_local,
          distance: activity.distance,
          moving_time: activity.moving_time,
          elapsed_time: activity.elapsed_time,
          total_elevation_gain: activity.total_elevation_gain,
          average_speed: activity.average_speed,
          max_speed: activity.max_speed,
          average_heartrate: activity.average_heartrate ? Math.round(Number(activity.average_heartrate)) : null,
          max_heartrate: activity.max_heartrate ? Math.round(Number(activity.max_heartrate)) : null,
          kudos_count: activity.kudos_count,
          achievement_count: activity.achievement_count,
          raw_data: activity, // Store full response for future use
          synced_at: new Date().toISOString(),
        })),
        { onConflict: 'strava_activity_id' }
      );

      if (activitiesError) {
        console.error('Database upsert error:', activitiesError);
        throw activitiesError;
      }

      console.log('Activities stored in database successfully');
    }

    // Update sync status
    const lastActivityDate = activities.length > 0
      ? new Date(Math.max(...activities.map(a => new Date(a.start_date).getTime())))
      : null;

    await supabase.from('sync_status').upsert({
      user_id: user.id,
      last_sync_at: new Date().toISOString(),
      last_activity_date: lastActivityDate?.toISOString(),
      sync_errors: null,
    }, { onConflict: 'user_id' });

    console.log('Sync completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        count: activities.length,
        message: `Successfully synced ${activities.length} activities`
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Sync function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack || 'No stack trace available'
      }),
      { status: 500 }
    );
  }
});
```

---

## 3. smooth-responder (Strava Webhook)

**Function name:** `smooth-responder`
**JWT verification:** ❌ **DISABLED** (Public webhook endpoint)

⚠️ **CRITICAL**: After creating this function, go to Settings and **DISABLE JWT verification**

### Code:

```typescript
// This function is deployed as "smooth-responder" in Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const STRAVA_VERIFY_TOKEN = Deno.env.get('STRAVA_VERIFY_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ENCRYPTION_KEY = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-dev-key-change-in-prod';

// SECURITY: Token decryption utility (same as in strava-auth)
async function decryptToken(encryptedToken: string): Promise<string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const combined = new Uint8Array(
    atob(encryptedToken)
      .split('')
      .map(char => char.charCodeAt(0))
  );

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encrypted
  );

  return decoder.decode(decrypted);
}

interface StravaWebhookEvent {
  object_type: string;
  object_id: number;
  aspect_type: string;
  updates: Record<string, any>;
  owner_id: number;
  subscription_id: number;
  event_time: number;
}

serve(async (req) => {
  const url = new URL(req.url);

  try {
    // Handle subscription verification (GET request)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Webhook verification:', { mode, token, challenge });

      if (mode === 'subscribe' && token === STRAVA_VERIFY_TOKEN) {
        console.log('Webhook verification successful');
        return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        console.log('Webhook verification failed');
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Handle webhook events (POST request)
    if (req.method === 'POST') {
      const event: StravaWebhookEvent = await req.json();

      console.log('Received Strava webhook event:', {
        object_type: event.object_type,
        object_id: event.object_id,
        aspect_type: event.aspect_type,
        owner_id: event.owner_id,
        event_time: event.event_time
      });

      // Initialize Supabase client
      const supabase = createClient(
        SUPABASE_URL!,
        SUPABASE_SERVICE_ROLE_KEY!
      );

      // Only process activity events
      if (event.object_type === 'activity') {
        // Find user by strava_id
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, access_token, refresh_token, token_expires_at')
          .eq('strava_id', event.owner_id.toString())
          .single();

        if (userError || !user) {
          console.log('User not found for strava_id:', event.owner_id);
          return new Response('OK', { status: 200 }); // Still return 200 to avoid retries
        }

        console.log('Found user for webhook:', user.id);

        if (event.aspect_type === 'create') {
          // New activity created - fetch and store it
          await processNewActivity(supabase, user, event.object_id);
        } else if (event.aspect_type === 'update') {
          // Activity updated - update our stored version
          await processUpdatedActivity(supabase, user, event.object_id);
        } else if (event.aspect_type === 'delete') {
          // Activity deleted - remove from our database
          await processDeletedActivity(supabase, user.id, event.object_id);
        }
      }

      return new Response('OK', { status: 200 });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

async function processNewActivity(supabase: any, user: any, activityId: number) {
  try {
    console.log('Processing new activity:', activityId);

    // SECURITY: Decrypt token before use
    let accessToken: string;
    try {
      accessToken = await decryptToken(user.access_token);
    } catch (error) {
      console.error('Failed to decrypt access token:', error);
      return;
    }

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(user.token_expires_at);

    if (expiresAt <= now) {
      console.log('Refreshing expired token');
      accessToken = await refreshToken(supabase, user);
    }

    // Fetch activity details from Strava
    const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch activity from Strava:', response.status);
      return;
    }

    const activity = await response.json();
    console.log('Fetched activity:', activity.name, activity.type);

    // Store activity in database
    const { error } = await supabase.from('activities').upsert({
      user_id: user.id,
      strava_activity_id: activity.id,
      name: activity.name,
      type: activity.type,
      sport_type: activity.sport_type,
      start_date: activity.start_date,
      start_date_local: activity.start_date_local,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      average_heartrate: activity.average_heartrate ? Math.round(Number(activity.average_heartrate)) : null,
      max_heartrate: activity.max_heartrate ? Math.round(Number(activity.max_heartrate)) : null,
      kudos_count: activity.kudos_count,
      achievement_count: activity.achievement_count,
      raw_data: activity,
      synced_at: new Date().toISOString(),
    }, { onConflict: 'strava_activity_id' });

    if (error) {
      console.error('Database error storing activity:', error);
    } else {
      console.log('Successfully stored new activity');
    }

  } catch (error) {
    console.error('Error processing new activity:', error);
  }
}

async function processUpdatedActivity(supabase: any, user: any, activityId: number) {
  try {
    console.log('Processing updated activity:', activityId);

    // Similar to processNewActivity but could be more selective about what to update
    await processNewActivity(supabase, user, activityId);

  } catch (error) {
    console.error('Error processing updated activity:', error);
  }
}

async function processDeletedActivity(supabase: any, userId: string, activityId: number) {
  try {
    console.log('Processing deleted activity:', activityId);

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('user_id', userId)
      .eq('strava_activity_id', activityId);

    if (error) {
      console.error('Error deleting activity:', error);
    } else {
      console.log('Successfully deleted activity');
    }

  } catch (error) {
    console.error('Error processing deleted activity:', error);
  }
}

// SECURITY: Token encryption utility (same as in strava-auth)
async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(token)
  );

  // Combine IV and encrypted data, then encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function refreshToken(supabase: any, user: any): Promise<string> {
  // SECURITY: Decrypt refresh token before use
  let refreshToken: string;
  try {
    refreshToken = await decryptToken(user.refresh_token);
  } catch (error) {
    throw new Error('Failed to decrypt refresh token');
  }

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: Deno.env.get('STRAVA_CLIENT_ID'),
      client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${data.message}`);
  }

  // SECURITY: Encrypt tokens before storing
  const encryptedAccessToken = await encryptToken(data.access_token);
  const encryptedRefreshToken = await encryptToken(data.refresh_token);

  // Update user's tokens
  await supabase
    .from('users')
    .update({
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: new Date(data.expires_at * 1000).toISOString(),
    })
    .eq('id', user.id);

  return data.access_token;
}
```

---

## 4. webhook-manager

**Function name:** `webhook-manager`
**JWT verification:** ✅ Enabled

### Code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID');
const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET');
const STRAVA_VERIFY_TOKEN = Deno.env.get('STRAVA_VERIFY_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

serve(async (req) => {
  try {
    const { action } = await req.json();

    if (action === 'list') {
      // List current webhook subscriptions
      const response = await fetch(
        `https://www.strava.com/api/v3/push_subscriptions?client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}`
      );

      const subscriptions = await response.json();

      return new Response(JSON.stringify({
        success: true,
        subscriptions,
        status: response.status
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create') {
      // Create new webhook subscription
      const callbackUrl = `${SUPABASE_URL}/functions/v1/smooth-responder`;

      const formData = new FormData();
      formData.append('client_id', STRAVA_CLIENT_ID!);
      formData.append('client_secret', STRAVA_CLIENT_SECRET!);
      formData.append('callback_url', callbackUrl);
      formData.append('verify_token', STRAVA_VERIFY_TOKEN!);

      const response = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      return new Response(JSON.stringify({
        success: response.ok,
        result,
        status: response.status,
        callbackUrl
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

---

## 5. user-settings

**Function name:** `user-settings`
**JWT verification:** ✅ Enabled

### Code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface UserSettingsUpdate {
  name?: string;
  goal_per_week?: number;
  message_style?: 'supportive' | 'snarky' | 'chaotic';
  send_day?: string;
  send_time?: string;
  timezone?: string;
  measurement_unit?: 'imperial' | 'metric';
  notification_enabled?: boolean;
  reminder_time?: string;
}

interface ContactData {
  name: string;
  phone_number: string;
  relationship?: string;
  notification_preference?: 'missed_goals' | 'weekly_summary' | 'both' | 'none';
  is_active?: boolean;
}

interface GoalData {
  goal_type: 'weekly_runs' | 'monthly_distance' | 'weekly_distance' | 'streak_days' | 'custom';
  target_value: number;
  target_unit: 'runs' | 'miles' | 'kilometers' | 'days' | 'minutes';
  activity_types?: string[];
  time_period: 'weekly' | 'monthly' | 'daily' | 'custom';
  start_date?: string;
  end_date?: string;
  description?: string;
  priority?: number;
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401 }
      );
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401 }
      );
    }

    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    switch (method) {
      case 'GET':
        return await handleGet(supabase, user.id, path);
      case 'POST':
        return await handlePost(supabase, user.id, path, req);
      case 'PUT':
        return await handlePut(supabase, user.id, path, req);
      case 'DELETE':
        return await handleDelete(supabase, user.id, path, req);
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Error in user-settings:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});

async function handleGet(supabase: any, userId: string, path?: string) {
  switch (path) {
    case 'profile':
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Remove sensitive data
      delete profile.access_token;
      delete profile.refresh_token;

      return new Response(JSON.stringify(profile), { status: 200 });

    case 'contacts':
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;
      return new Response(JSON.stringify(contacts), { status: 200 });

    case 'goals':
      const { data: goals, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (goalsError) throw goalsError;
      return new Response(JSON.stringify(goals), { status: 200 });

    case 'progress':
      // Get current week/month progress for all active goals
      const { data: progress, error: progressError } = await supabase
        .from('goal_progress')
        .select(`
          *,
          user_goals!inner(*)
        `)
        .eq('user_id', userId)
        .eq('user_goals.is_active', true)
        .gte('period_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('period_start', { ascending: false });

      if (progressError) throw progressError;
      return new Response(JSON.stringify(progress), { status: 200 });

    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        { status: 404 }
      );
  }
}

async function handlePost(supabase: any, userId: string, path?: string, req?: Request) {
  const body = await req?.json();

  switch (path) {
    case 'contacts':
      const contactData: ContactData = body;

      // Basic validation
      if (!contactData.name || !contactData.phone_number) {
        return new Response(
          JSON.stringify({ error: 'Name and phone number are required' }),
          { status: 400 }
        );
      }

      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          user_id: userId,
          ...contactData
        })
        .select()
        .single();

      if (contactError) throw contactError;
      return new Response(JSON.stringify(contact), { status: 201 });

    case 'goals':
      const goalData: GoalData = body;

      // Basic validation
      if (!goalData.goal_type || !goalData.target_value || !goalData.target_unit) {
        return new Response(
          JSON.stringify({ error: 'Goal type, target value, and unit are required' }),
          { status: 400 }
        );
      }

      const { data: goal, error: goalError } = await supabase
        .from('user_goals')
        .insert({
          user_id: userId,
          ...goalData
        })
        .select()
        .single();

      if (goalError) throw goalError;
      return new Response(JSON.stringify(goal), { status: 201 });

    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        { status: 404 }
      );
  }
}

async function handlePut(supabase: any, userId: string, path?: string, req?: Request) {
  const body = await req?.json();
  const url = new URL(req!.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  switch (path) {
    case 'profile':
      const userUpdates: UserSettingsUpdate = body;

      const { data: updatedUser, error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (userError) throw userError;

      // Remove sensitive data
      delete updatedUser.access_token;
      delete updatedUser.refresh_token;

      return new Response(JSON.stringify(updatedUser), { status: 200 });

    case 'contacts':
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Contact ID required' }),
          { status: 400 }
        );
      }

      const { data: updatedContact, error: contactError } = await supabase
        .from('contacts')
        .update(body)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (contactError) throw contactError;
      return new Response(JSON.stringify(updatedContact), { status: 200 });

    case 'goals':
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Goal ID required' }),
          { status: 400 }
        );
      }

      const { data: updatedGoal, error: goalError } = await supabase
        .from('user_goals')
        .update(body)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (goalError) throw goalError;
      return new Response(JSON.stringify(updatedGoal), { status: 200 });

    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        { status: 404 }
      );
  }
}

async function handleDelete(supabase: any, userId: string, path?: string, req?: Request) {
  const url = new URL(req!.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'ID required for deletion' }),
      { status: 400 }
    );
  }

  switch (path) {
    case 'contacts':
      // Soft delete by setting is_active to false
      const { error: contactError } = await supabase
        .from('contacts')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', userId);

      if (contactError) throw contactError;
      return new Response(JSON.stringify({ success: true }), { status: 200 });

    case 'goals':
      // Soft delete by setting is_active to false
      const { error: goalError } = await supabase
        .from('user_goals')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', userId);

      if (goalError) throw goalError;
      return new Response(JSON.stringify({ success: true }), { status: 200 });

    default:
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        { status: 404 }
      );
  }
}
```

---

## Required Environment Variables

Set these in your Supabase project → Settings → Edge Functions → Environment Variables:

```
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_VERIFY_TOKEN=your_random_verify_token (e.g., "rundown_webhook_2024")
TOKEN_ENCRYPTION_KEY=your_32_char_encryption_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Note**: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are usually auto-injected, but set them explicitly if you encounter issues.

---

## Post-Deployment Steps

1. ✅ **Verify all functions are deployed** - Check Edge Functions list
2. ⚠️ **Disable JWT on smooth-responder** - Critical for webhook to work!
3. 🔧 **Set environment variables** - All secrets configured
4. 🧪 **Test strava-auth** - Try connecting a Strava account
5. 🧪 **Test strava-sync** - Manually sync activities
6. 🪝 **Set up webhook** - Use webhook-manager to create subscription

---

## Testing Commands

```bash
# Test strava-sync (replace with your values)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/strava-sync \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# List webhook subscriptions
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/webhook-manager \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'

# Create webhook subscription
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/webhook-manager \
  -H "Content-Type: application/json" \
  -d '{"action": "create"}'
```

---

**Ready to sync with Strava!** 🚀
