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