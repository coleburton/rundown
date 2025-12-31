import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'notifications@rundownapp.com';

// Initialize Resend client
const resend = RESEND_API_KEY
  ? new Resend(RESEND_API_KEY)
  : null;

/**
 * Extract or generate email subject from message text
 */
function getEmailSubject(messageText: string): string {
  // Try to extract first sentence as subject
  const firstSentence = messageText.split(/[.!?]/)[0];

  // If too long, use generic subject
  if (firstSentence.length > 60) {
    return 'Accountability Check-In';
  }

  return firstSentence.trim();
}

/**
 * Convert plain text message to HTML email format
 */
function formatEmailHtml(messageText: string): string {
  // Split by paragraphs (double line breaks)
  const paragraphs = messageText.split('\n\n').filter(p => p.trim());

  // Convert to HTML paragraphs
  const htmlParagraphs = paragraphs.map(p => {
    // Convert single line breaks to <br>
    const withBreaks = p.replace(/\n/g, '<br>');
    return `<p style="margin: 16px 0; line-height: 1.5;">${withBreaks}</p>`;
  }).join('');

  // Return complete HTML email
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

      <div style="color: #374151; font-size: 16px;">
        ${htmlParagraphs}
      </div>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
          This is an automated accountability message from Rundown. Your friend signed up to receive these check-ins to help them stay on track with their fitness goals.
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

serve(async (req) => {
  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // This function should be called frequently (every 5-10 minutes) by a cron job
    // It processes queued messages with load balancing

    if (!resend) {
      console.log('Resend not configured - running in mock mode');
    }

    // Get batch of messages to send (respects rate limits)
    const { data: messages, error: messagesError } = await supabase.rpc(
      'get_messages_to_send',
      {
        batch_size: 50, // Process up to 50 messages at a time
        max_per_time_slot: 100 // Respect Resend rate limits (adjust based on your plan)
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

        if (resend) {
          // Send actual email via Resend
          await resend.emails.send({
            from: FROM_EMAIL,
            to: message.email,
            subject: getEmailSubject(message.message_text),
            html: formatEmailHtml(message.message_text),
          });

          console.log(`Email sent to ${message.email}`);
        } else {
          // Mock mode - simulate delay
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log(`[MOCK] Would send email to ${message.email}: ${message.message_text}`);
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

        // Email-specific error handling
        const isRetryable = error.statusCode !== 400 &&  // Bad request
                           error.statusCode !== 422;     // Invalid email

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
