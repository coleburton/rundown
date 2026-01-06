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
      // Create new webhook subscription targeting the deployed webhook function
      const callbackUrl = `${SUPABASE_URL}/functions/v1/strava-webhook`;
      
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
