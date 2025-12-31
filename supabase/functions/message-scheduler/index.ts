import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface MessageTemplate {
  supportive: string[];
  snarky: string[];
  chaotic: string[];
}

const MESSAGE_TEMPLATES: MessageTemplate = {
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
};

const CONGRATULATORY_TEMPLATES: MessageTemplate = {
  supportive: [
    "Great news {contact}! {user} crushed their running goal this week! 🎉",
    "{contact}, {user} is absolutely killing it with their runs! Show them some love! ❤️",
    "Hey {contact}, {user} hit their weekly goal! They're on fire! 🔥",
  ],
  snarky: [
    "Shock alert {contact}: {user} actually ran this week! Quick, celebrate before it's too late! 🎊",
    "{contact}, {user} proved us wrong and hit their goal. I'm honestly impressed. 😱",
    "Breaking: {contact}, {user} found their running shoes AND used them! Miraculous! ✨",
  ],
  chaotic: [
    "🎉 CELEBRATION MODE ACTIVATED {contact}! {user} CONQUERED THEIR RUNNING GOALS! 🏆",
    "ALERT {contact}: {user} IS OFFICIALLY A RUNNING MACHINE! BEEP BEEP! 🤖",
    "🚨 SUCCESS DETECTED {contact}! {user} HAS ACHIEVED LEGENDARY STATUS! 🦸‍♂️",
  ],
};

serve(async (req) => {
  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // This function should be called by a cron job or scheduled trigger
    // It evaluates all users and schedules appropriate messages

    const today = new Date();
    const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Get all users with notification preferences for today
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        goal_per_week,
        message_style,
        notification_preferences!inner (
          send_day,
          send_time,
          timezone,
          send_if_goal_met,
          send_if_partial_goal,
          enabled,
          max_messages_per_week
        ),
        contacts (
          id,
          name,
          email,
          relationship
        )
      `)
      .eq('notification_preferences.send_day', currentDay)
      .eq('notification_preferences.enabled', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`Found ${users.length} users to process for ${currentDay}`);

    const schedulingPromises = users.map(async (user) => {
      try {
        // Get this week's runs for the user
        const monday = new Date();
        monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
        monday.setHours(0, 0, 0, 0);

        const { data: runs, error: runsError } = await supabase
          .from('run_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', monday.toISOString().split('T')[0]);

        if (runsError) {
          console.error(`Error fetching runs for user ${user.id}:`, runsError);
          return;
        }

        const runCount = runs?.length || 0;
        const goalMet = runCount >= user.goal_per_week;
        const partialProgress = runCount > 0 && runCount < user.goal_per_week;
        
        const preferences = user.notification_preferences[0];
        
        // Determine if we should send a message
        let shouldSend = false;
        let messageType: 'accountability' | 'congratulatory' = 'accountability';
        
        if (goalMet && preferences.send_if_goal_met) {
          shouldSend = true;
          messageType = 'congratulatory';
        } else if (!goalMet && (partialProgress ? preferences.send_if_partial_goal : true)) {
          shouldSend = true;
          messageType = 'accountability';
        }

        if (!shouldSend || user.contacts.length === 0) {
          console.log(`Skipping user ${user.email}: shouldSend=${shouldSend}, contacts=${user.contacts.length}`);
          return;
        }

        // Check if we've already sent the max messages this week
        const weekStart = new Date(monday);
        const { data: recentMessages } = await supabase
          .from('message_queue')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', weekStart.toISOString())
          .in('status', ['sent', 'queued', 'processing']);

        if (recentMessages && recentMessages.length >= preferences.max_messages_per_week) {
          console.log(`User ${user.email} has reached max messages per week (${preferences.max_messages_per_week})`);
          return;
        }

        // Calculate scheduled time (user's timezone + preferred time)
        const [hours, minutes] = preferences.send_time.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If the time has already passed today, schedule for the same time next week
        if (scheduledTime <= new Date()) {
          scheduledTime.setDate(scheduledTime.getDate() + 7);
        }

        // Choose appropriate message template
        const templates = messageType === 'congratulatory' 
          ? CONGRATULATORY_TEMPLATES[user.message_style as keyof MessageTemplate]
          : MESSAGE_TEMPLATES[user.message_style as keyof MessageTemplate];
        
        if (!templates) {
          console.error(`Unknown message style: ${user.message_style}`);
          return;
        }

        const template = templates[Math.floor(Math.random() * templates.length)];

        // Schedule messages for each contact
        const contactPromises = user.contacts.map(async (contact) => {
          const message = template
            .replace(/\{contact\}/g, contact.name)
            .replace(/\{user\}/g, user.name || user.email.split('@')[0]);

          // Determine priority based on message type and relationship
          let priority = 3; // default low
          if (messageType === 'congratulatory') priority = 2; // medium
          if (contact.relationship === 'coach') priority = 1; // high

          const { error: scheduleError } = await supabase.rpc(
            'schedule_accountability_message',
            {
              p_user_id: user.id,
              p_contact_id: contact.id,
              p_message_text: message,
              p_scheduled_for: scheduledTime.toISOString(),
              p_priority: priority
            }
          );

          if (scheduleError) {
            console.error(`Error scheduling message for user ${user.id}, contact ${contact.id}:`, scheduleError);
          } else {
            console.log(`Scheduled ${messageType} message for ${user.email} -> ${contact.name} at ${scheduledTime.toISOString()}`);
          }
        });

        await Promise.all(contactPromises);
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    });

    await Promise.all(schedulingPromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: users.length,
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
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});