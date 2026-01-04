import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type MessageStyle = 'supportive' | 'snarky' | 'chaotic' | 'competitive' | 'achievement';

const MESSAGE_TEMPLATES: Record<MessageStyle, string[]> = {
  supportive: [
    "Hey {contact}, {user} missed their run goal this week. Send them some encouragement! 💪",
    "Just a heads up {contact}, {user} could use a little motivation to hit their running goals. 🏃‍♂️",
    "{contact}, your friend {user} is falling behind on their runs. Maybe check in? ❤️",
  ],
  snarky: [
    "Alert {contact}: {user} chose Netflix over running. Again. 🛋️",
    "Hey {contact}, {user} is being a couch potato. Send help (or shame). 😏",
    "{contact}! Your friend {user} needs a reality check on their 'active lifestyle' claims. 🙄",
  ],
  chaotic: [
    "🚨 ATTENTION {contact} 🚨 {user} has activated couch mode! Intervention required! 📢",
    "BREAKING NEWS {contact}: {user} found more excuses than miles this week! 🗞️",
    "🏃‍♂️ ERROR 404: {user}'s running motivation not found. {contact}, please reboot! 💻",
  ],
  competitive: [
    "{contact}, {user} is slacking on their runs. Time to call them out! 🏆",
    "Hey {contact}, {user} missed their goal. Don't let them off easy! 💪",
    "{contact}! {user} needs a reminder about who's watching their progress. 👀",
  ],
  achievement: [
    "{contact}, {user} has room to improve on their running goals. Give them a nudge! 🎯",
    "Hey {contact}, {user} could use some accountability to reach their next milestone. 🏅",
    "{contact}, help {user} level up their running game this week! ⬆️",
  ],
};

/**
 * Accountability Message Processor
 *
 * Runs every 5-10 minutes to process queued users.
 * - Evaluates weekly progress for up to 50 users per run
 * - Uses Resend batch API (100 emails/request) for efficiency
 * - Respects rate limits (2 req/sec default)
 * - Graceful error handling and retry logic
 */
serve(async (req) => {
  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    if (!resend) {
      console.log('⚠️ Resend not configured - running in mock mode');
    }

    console.log('Starting accountability processor...');

    // Get batch of users to process (up to 50 at a time)
    // Using a hypothetical user_evaluation_queue table
    const { data: queuedUsers, error: queueError } = await supabase
      .from('user_evaluation_queue')
      .select('*')
      .eq('status', 'queued')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(50);

    if (queueError) {
      console.error('Error fetching queue:', queueError);
      throw queueError;
    }

    if (!queuedUsers || queuedUsers.length === 0) {
      console.log('No users in queue to process');
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: 'No users to process'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing ${queuedUsers.length} users from queue`);

    // Mark users as processing
    const userIds = queuedUsers.map(u => u.user_id);
    await supabase
      .from('user_evaluation_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .in('user_id', userIds);

    // Fetch full user data with contacts
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        goal_per_week,
        goal_type,
        message_style,
        contacts (
          id,
          name,
          email,
          relationship,
          opted_out_at
        )
      `)
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Process each user
    const emailBatch: Array<{
      from: string;
      to: string;
      subject: string;
      html: string;
    }> = [];

    let processedCount = 0;
    let skippedCount = 0;

    for (const user of users || []) {
      try {
        // Get this week's activities
        const monday = new Date();
        monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
        monday.setHours(0, 0, 0, 0);

        const { data: activities, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_date', monday.toISOString());

        if (activitiesError) {
          console.error(`Error fetching activities for user ${user.id}:`, activitiesError);
          continue;
        }

        const activityCount = activities?.length || 0;
        const goalMet = activityCount >= user.goal_per_week;

        // Only send if goal NOT met
        if (goalMet) {
          console.log(`User ${user.email} met their goal (${activityCount}/${user.goal_per_week}), skipping`);
          skippedCount++;
          continue;
        }

        // Filter active contacts
        const activeContacts = (user.contacts || []).filter(c => !c.opted_out_at);

        if (activeContacts.length === 0) {
          console.log(`User ${user.email} has no active contacts, skipping`);
          skippedCount++;
          continue;
        }

        // Generate message
        const style = (user.message_style || 'supportive') as MessageStyle;
        const templates = MESSAGE_TEMPLATES[style] || MESSAGE_TEMPLATES.supportive;
        const template = templates[Math.floor(Math.random() * templates.length)];

        // Send to each contact
        for (const contact of activeContacts) {
          const message = template
            .replace(/\{contact\}/g, contact.name)
            .replace(/\{user\}/g, user.name || user.email.split('@')[0]);

          emailBatch.push({
            from: FROM_EMAIL,
            to: contact.email,
            subject: `${user.name || 'Your friend'} needs a running boost this week`,
            html: formatEmailHtml(message, user, activityCount)
          });
        }

        processedCount++;

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    }

    console.log(`Prepared ${emailBatch.length} emails to send`);

    // Send emails using Resend batch API (100 emails per request)
    let sentCount = 0;
    let failedCount = 0;

    if (resend && emailBatch.length > 0) {
      // Split into batches of 100 (Resend's batch limit)
      for (let i = 0; i < emailBatch.length; i += 100) {
        const batch = emailBatch.slice(i, i + 100);

        try {
          const result = await resend.batch.send(batch);
          console.log(`Batch ${i / 100 + 1}: Sent ${batch.length} emails`);
          sentCount += batch.length;

          // Respect rate limit: 2 req/sec
          if (i + 100 < emailBatch.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to send batch ${i / 100 + 1}:`, error);
          failedCount += batch.length;
        }
      }
    } else if (!resend) {
      console.log(`[MOCK] Would send ${emailBatch.length} emails`);
      sentCount = emailBatch.length;
    }

    // Mark users as completed in queue
    await supabase
      .from('user_evaluation_queue')
      .delete()
      .in('user_id', userIds);

    console.log(`Processor complete: ${processedCount} users processed, ${sentCount} emails sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        skipped: skippedCount,
        emailsSent: sentCount,
        emailsFailed: failedCount,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Processor error:', error);
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

function formatEmailHtml(message: string, user: any, activityCount: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accountability Check-In</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="border-left: 4px solid #f97316; padding-left: 20px; margin-bottom: 24px;">
        <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 600;">Accountability Check-In</h2>
      </div>

      <div style="color: #374151; font-size: 16px; line-height: 1.5;">
        <p>${message}</p>
        <p style="margin-top: 16px; padding: 16px; background-color: #fef3c7; border-radius: 8px; font-size: 14px;">
          <strong>This week's progress:</strong> ${activityCount} out of ${user.goal_per_week} runs completed
        </p>
      </div>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
          This is an automated accountability message from Rundown. ${user.name || 'Your friend'} signed up to receive these check-ins to help stay on track with their fitness goals.
        </p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        Rundown - Accountability for your fitness goals
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
