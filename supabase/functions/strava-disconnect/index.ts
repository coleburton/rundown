import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  try {
    console.log('Strava disconnect function called');

    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract and validate JWT token
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Invalid or expired token:', authError);
      return new Response(
        JSON.stringify({
          error: 'Invalid token',
          details: authError?.message
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Create service role client for database operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get current Strava tokens before clearing
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('access_token, strava_id')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch user data',
          details: fetchError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Attempt to revoke token with Strava API (optional - continue even if fails)
    if (userData?.access_token) {
      try {
        console.log('Attempting to revoke Strava token');
        const revokeResponse = await fetch('https://www.strava.com/oauth/deauthorize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userData.access_token}`,
          },
        });

        if (revokeResponse.ok) {
          console.log('Successfully revoked token with Strava');
        } else {
          const revokeData = await revokeResponse.text();
          console.warn('Failed to revoke token with Strava:', revokeResponse.status, revokeData);
          // Continue with disconnect even if revocation fails
        }
      } catch (revokeError) {
        console.error('Error revoking token with Strava:', revokeError);
        // Continue with disconnect even if revocation fails
      }
    }

    // Clear ALL Strava-related fields in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        strava_id: null,
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        strava_connection_status: 'disconnected',
        strava_disconnected_at: new Date().toISOString(),
        strava_disconnection_reason: 'user_action',
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to disconnect Strava',
          details: updateError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert audit event
    try {
      await supabase
        .from('strava_connection_events')
        .insert({
          user_id: user.id,
          event_type: 'disconnected',
          metadata: {
            strava_id: userData?.strava_id,
            disconnected_by: 'user_action'
          }
        });
    } catch (eventError) {
      // Log but don't fail the disconnect if audit insertion fails
      console.error('Failed to insert audit event:', eventError);
    }

    console.log('Successfully disconnected Strava for user:', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Strava disconnected successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in strava-disconnect:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
