import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

type TimePeriod = 'morning' | 'afternoon' | 'evening';

/**
 * Simplified Accountability Scheduler
 *
 * Runs 3x/day (morning/afternoon/evening) to queue users for message evaluation.
 * Fast execution (~5-10 seconds) with no timeout risk.
 *
 * Schedule:
 * - Morning: 9 AM UTC
 * - Afternoon: 3 PM UTC
 * - Evening: 9 PM UTC
 */
serve(async (req) => {
  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get period from request body or query param
    const url = new URL(req.url);
    const queryPeriod = url.searchParams.get('period');

    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const period: TimePeriod = (body.period || queryPeriod || 'evening') as TimePeriod;

    console.log(`Running accountability scheduler for period: ${period}`);

    // Get current day of week
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }); // "Monday", "Tuesday", etc.

    console.log(`Today is ${dayOfWeek}, scheduling for ${period} batch`);

    // Find all users who:
    // 1. Have this day as their message day (or legacy send_day)
    // 2. Have this time period (or are using legacy system)
    // 3. Have notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        message_day,
        message_time_period,
        send_day,
        notification_enabled
      `)
      .eq('notification_enabled', true)
      .or(`message_day.eq.${dayOfWeek},send_day.eq.${dayOfWeek}`)
      .or(`message_time_period.eq.${period},message_time_period.is.null`);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log(`No users found for ${dayOfWeek} ${period}`);
      return new Response(
        JSON.stringify({
          success: true,
          period,
          day: dayOfWeek,
          queued: 0,
          message: 'No users to process'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${users.length} users for ${dayOfWeek} ${period}`);

    // For each user, create a queue entry for evaluation
    // We'll use a database function to do this efficiently
    const { data: queuedUsers, error: queueError } = await supabase.rpc(
      'queue_users_for_accountability_check',
      {
        user_ids: users.map(u => u.id),
        scheduled_period: period,
        priority: period === 'morning' ? 1 : (period === 'afternoon' ? 2 : 3)
      }
    );

    if (queueError) {
      // If the RPC doesn't exist, fall back to individual inserts
      console.warn('RPC queue_users_for_accountability_check not found, using fallback');

      const insertPromises = users.map(async (user) => {
        // Insert a placeholder record indicating this user needs evaluation
        return supabase.from('user_evaluation_queue').insert({
          user_id: user.id,
          scheduled_for: new Date().toISOString(),
          period,
          priority: period === 'morning' ? 1 : (period === 'afternoon' ? 2 : 3),
          status: 'queued'
        });
      });

      await Promise.all(insertPromises);

      console.log(`Queued ${users.length} users for evaluation (fallback method)`);
    } else {
      console.log(`Queued ${queuedUsers || users.length} users for evaluation (RPC method)`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        period,
        day: dayOfWeek,
        queued: users.length,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Scheduler error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
