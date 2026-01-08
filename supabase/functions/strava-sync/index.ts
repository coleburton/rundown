import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const STRAVA_API_URL = 'https://www.strava.com/api/v3';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
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

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create client with ANON_KEY to validate user JWT
    const userClient = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!
    );

    console.log('Attempting to get user from JWT token');

    // Pass the token explicitly to getUser()
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    console.log('Auth result:', { hasUser: !!user, authError: authError?.message });

    if (authError || !user) {
      console.error('Invalid token:', authError?.message, authError);
      return new Response(
        JSON.stringify({
          error: 'Invalid token',
          details: authError?.message,
          code: authError?.code,
          status: authError?.status,
          authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : 'missing',
          anonKeyPresent: !!SUPABASE_ANON_KEY,
          urlPresent: !!SUPABASE_URL
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize service role client for database operations
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Looking up user in users table:', user.id);

    // Get user's Strava credentials - check both public.users and auth.users
    let { data: userData, error: userError } = await supabase
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

      const stravaClientId = Deno.env.get('STRAVA_CLIENT_ID');
      const stravaClientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

      console.log('Strava credentials check:', {
        hasClientId: !!stravaClientId,
        hasClientSecret: !!stravaClientSecret,
        hasRefreshToken: !!userData.refresh_token,
        refreshTokenPrefix: userData.refresh_token?.substring(0, 10) + '...'
      });

      if (!stravaClientId || !stravaClientSecret) {
        return new Response(
          JSON.stringify({
            error: 'Strava credentials not configured',
            details: 'STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET environment variable is missing'
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Refresh token
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: stravaClientId,
          client_secret: stravaClientSecret,
          refresh_token: userData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      console.log('Token refresh response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        console.error('Token refresh failed:', data);
        return new Response(
          JSON.stringify({
            error: 'Failed to refresh Strava token',
            stravaError: data,
            stravaStatus: response.status,
            hint: 'You may need to reconnect your Strava account'
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
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
        { onConflict: 'user_id,strava_activity_id' }
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