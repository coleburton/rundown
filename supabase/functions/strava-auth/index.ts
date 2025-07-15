import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID');
const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400 }
      );
    }

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

    const stravaData = (await tokenResponse.json()) as StravaTokenResponse;

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('strava_id', stravaData.athlete.id.toString())
      .single();

    if (existingUser) {
      // Update existing user
      await supabase
        .from('users')
        .update({
          access_token: stravaData.access_token,
          refresh_token: stravaData.refresh_token,
          token_expires_at: new Date(stravaData.expires_at * 1000).toISOString(),
        })
        .eq('id', existingUser.id);

      return new Response(
        JSON.stringify({
          email: existingUser.email,
          token: stravaData.access_token,
        }),
        { status: 200 }
      );
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: stravaData.athlete.email,
        strava_id: stravaData.athlete.id.toString(),
        access_token: stravaData.access_token,
        refresh_token: stravaData.refresh_token,
        token_expires_at: new Date(stravaData.expires_at * 1000).toISOString(),
        name: `${stravaData.athlete.firstname} ${stravaData.athlete.lastname}`,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return new Response(
      JSON.stringify({
        email: newUser.email,
        token: stravaData.access_token,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}); 