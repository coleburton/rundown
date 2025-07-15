import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const STRAVA_API_URL = 'https://www.strava.com/api/v3';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface StravaActivity {
  id: number;
  type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  athlete: {
    id: number;
  };
}

serve(async (req) => {
  try {
    const { after } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401 }
      );
    }

    // Get user's Strava credentials
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('strava_id, access_token, refresh_token, token_expires_at')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(userData.token_expires_at);

    if (expiresAt <= now) {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

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

    // Fetch activities from Strava
    const activitiesResponse = await fetch(
      `${STRAVA_API_URL}/athlete/activities?after=${Math.floor(
        new Date(after).getTime() / 1000
      )}`,
      {
        headers: {
          Authorization: `Bearer ${userData.access_token}`,
        },
      }
    );

    if (!activitiesResponse.ok) {
      throw new Error('Failed to fetch activities from Strava');
    }

    const activities: StravaActivity[] = await activitiesResponse.json();

    // Filter for runs only
    const runs = activities.filter((activity) => activity.type === 'Run');

    // Upsert runs to database
    const { error: runsError } = await supabase.from('run_logs').upsert(
      runs.map((run) => ({
        user_id: user.id,
        activity_id: run.id.toString(),
        date: run.start_date,
        distance: run.distance,
        duration: run.moving_time,
        type: run.type.toLowerCase(),
      }))
    );

    if (runsError) {
      throw runsError;
    }

    return new Response(
      JSON.stringify({ success: true, count: runs.length }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}); 