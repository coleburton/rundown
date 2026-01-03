import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const STRAVA_VERIFY_TOKEN = Deno.env.get('STRAVA_VERIFY_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface StravaWebhookEvent {
  object_type: string;
  object_id: number;
  aspect_type: string;
  updates: Record<string, unknown>;
  owner_id: number;
  subscription_id: number;
  event_time: number;
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  try {
    if (req.method === 'GET') {
      return verifyWebhook(url);
    }

    if (req.method === 'POST') {
      const event: StravaWebhookEvent = await req.json();
      await handleEvent(event);
      return new Response('OK', { status: 200 });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

if (import.meta.main) {
  serve(handleRequest);
}

function verifyWebhook(url: URL): Response {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === STRAVA_VERIFY_TOKEN) {
    return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Forbidden', { status: 403 });
}

async function handleEvent(event: StravaWebhookEvent) {
  console.log('Received Strava webhook event:', event);

  if (event.object_type !== 'activity') {
    return;
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, access_token, refresh_token, token_expires_at')
    .eq('strava_id', event.owner_id.toString())
    .single();

  if (userError || !user) {
    console.log('User not found for strava_id:', event.owner_id);
    return;
  }

  switch (event.aspect_type) {
    case 'create':
      await processNewActivity(supabase, user, event.object_id);
      break;
    case 'update':
      await processUpdatedActivity(supabase, user, event.object_id);
      break;
    case 'delete':
      await processDeletedActivity(supabase, user.id, event.object_id);
      break;
  }
}

export async function processNewActivity(
  supabase: any,
  user: any,
  activityId: number
) {
  try {
    let accessToken = user.access_token;
    if (!accessToken) {
      console.error('User missing Strava access token, cannot sync activity');
      return;
    }

    const expiresAt = new Date(user.token_expires_at);
    if (expiresAt <= new Date()) {
      accessToken = await refreshToken(supabase, user);
    }

    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch activity from Strava:', response.status);
      return;
    }

    const activity = await response.json();
    const { error } = await supabase.from('activities').upsert(
      {
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
        average_heartrate: activity.average_heartrate
          ? Math.round(Number(activity.average_heartrate))
          : null,
        max_heartrate: activity.max_heartrate
          ? Math.round(Number(activity.max_heartrate))
          : null,
        kudos_count: activity.kudos_count,
        achievement_count: activity.achievement_count,
        raw_data: activity,
        synced_at: new Date().toISOString()
      },
      { onConflict: 'user_id,strava_activity_id' }
    );

    if (error) {
      console.error('Database error storing activity:', error);
    }
  } catch (error) {
    console.error('Error processing new activity:', error);
  }
}

export async function processUpdatedActivity(
  supabase: any,
  user: any,
  activityId: number
) {
  await processNewActivity(supabase, user, activityId);
}

export async function processDeletedActivity(
  supabase: any,
  userId: string,
  activityId: number
) {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('user_id', userId)
      .eq('strava_activity_id', activityId);

    if (error) {
      console.error('Error deleting activity:', error);
    }
  } catch (error) {
    console.error('Error processing deleted activity:', error);
  }
}

export async function refreshToken(supabase: any, user: any): Promise<string> {
  if (!user.refresh_token) {
    throw new Error('User is missing a Strava refresh token');
  }

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('STRAVA_CLIENT_ID'),
      client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
      refresh_token: user.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${data.message}`);
  }

  await supabase
    .from('users')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_expires_at: new Date(data.expires_at * 1000).toISOString()
    })
    .eq('id', user.id);

  return data.access_token;
}
