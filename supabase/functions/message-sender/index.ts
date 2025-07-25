import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Twilio } from 'https://esm.sh/twilio@4.19.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

// Initialize Twilio client
const twilio = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
  ? new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

serve(async (req) => {
  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // This function should be called frequently (every 5-10 minutes) by a cron job
    // It processes queued messages with load balancing

    if (!twilio) {
      console.log('Twilio not configured - running in mock mode');
    }

    // Get batch of messages to send (respects rate limits)
    const { data: messages, error: messagesError } = await supabase.rpc(
      'get_messages_to_send',
      {
        batch_size: 50, // Process up to 50 messages at a time
        max_per_time_slot: 100 // Respect Twilio rate limits (adjust based on your plan)
      }
    );

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    if (!messages || messages.length === 0) {
      console.log('No messages to send at this time');
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0,
          message: 'No messages to send'
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing ${messages.length} messages`);

    // Process messages in parallel with controlled concurrency
    const sendingPromises = messages.map(async (message) => {
      try {
        // Mark message as processing
        await supabase.rpc('update_message_status', {
          p_message_id: message.message_id,
          p_status: 'processing'
        });

        if (twilio && TWILIO_PHONE_NUMBER) {
          // Send actual SMS via Twilio
          await twilio.messages.create({
            body: message.message_text,
            to: message.phone_number,
            from: TWILIO_PHONE_NUMBER,
          });

          console.log(`SMS sent to ${message.phone_number}`);
        } else {
          // Mock mode - simulate delay
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log(`[MOCK] Would send SMS to ${message.phone_number}: ${message.message_text}`);
        }

        // Mark message as sent
        await supabase.rpc('update_message_status', {
          p_message_id: message.message_id,
          p_status: 'sent'
        });

        // Log successful message in the messages table for user visibility
        await supabase.from('messages').insert({
          user_id: message.user_id,
          contact_id: message.contact_id,
          message_text: message.message_text,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

        return { success: true, message_id: message.message_id };

      } catch (error) {
        console.error(`Failed to send message ${message.message_id}:`, error);

        // Determine if this is a retryable error
        const isRetryable = error.code !== 21211 && // Invalid phone number
                           error.code !== 21614 && // Unsubscribed number
                           error.status !== 400;   // Bad request

        let errorMessage = error.message;
        let status = 'failed';

        // If it's a retryable error and we haven't exceeded max attempts, keep it queued
        const { data: currentMessage } = await supabase
          .from('message_queue')
          .select('attempts, max_attempts')
          .eq('id', message.message_id)
          .single();

        if (isRetryable && currentMessage && currentMessage.attempts < currentMessage.max_attempts - 1) {
          status = 'queued'; // Will be retried
          errorMessage = `Retryable error (attempt ${currentMessage.attempts + 1}): ${error.message}`;
        }

        await supabase.rpc('update_message_status', {
          p_message_id: message.message_id,
          p_status: status,
          p_error_message: errorMessage
        });

        // Log failed message in the messages table
        await supabase.from('messages').insert({
          user_id: message.user_id,
          contact_id: message.contact_id,
          message_text: message.message_text,
          status: 'failed',
          sent_at: new Date().toISOString()
        });

        return { success: false, message_id: message.message_id, error: errorMessage };
      }
    });

    // Wait for all messages to be processed
    const results = await Promise.all(sendingPromises);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Message processing complete: ${successCount} sent, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: messages.length,
        sent: successCount,
        failed: failureCount,
        timestamp: new Date().toISOString(),
        results: results
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Message sender error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});