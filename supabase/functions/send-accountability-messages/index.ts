import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Twilio } from 'https://esm.sh/twilio@4.19.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

const twilio = new Twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);

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

serve(async (req) => {
  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all users who need accountability messages
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        goal_per_week,
        message_style,
        contacts (
          id,
          name,
          phone_number
        )
      `)
      .eq('send_day', new Date().toLocaleDateString('en-US', { weekday: 'long' }))
      .eq('send_time', new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));

    if (usersError) throw usersError;

    const messagePromises = users.flatMap(async (user) => {
      // Get this week's runs
      const monday = new Date();
      monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);

      const { data: runs } = await supabase
        .from('run_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monday.toISOString());

      // Only send messages if user didn't meet their goal
      if (runs && runs.length >= user.goal_per_week) {
        return [];
      }

      // Get random message template
      const templates = MESSAGE_TEMPLATES[user.message_style as keyof MessageTemplate];
      const template = templates[Math.floor(Math.random() * templates.length)];

      // Send message to each contact
      return user.contacts.map(async (contact) => {
        const message = template
          .replace('{contact}', contact.name)
          .replace('{user}', user.name || 'your friend');

        try {
          // Send message via Twilio
          await twilio.messages.create({
            body: message,
            to: contact.phone_number,
            from: TWILIO_PHONE_NUMBER,
          });

          // Log message in database
          await supabase.from('messages').insert({
            user_id: user.id,
            contact_id: contact.id,
            message_text: message,
            status: 'sent',
          });
        } catch (error) {
          console.error('Failed to send message:', error);

          // Log failed message
          await supabase.from('messages').insert({
            user_id: user.id,
            contact_id: contact.id,
            message_text: message,
            status: 'failed',
          });
        }
      });
    });

    await Promise.all(messagePromises.flat());

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}); 