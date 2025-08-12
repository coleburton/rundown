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