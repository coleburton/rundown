import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'notifications@rundownapp.com';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://app.rundownapp.com';
const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') ?? 'support@rundownapp.com';

const projectMatch = SUPABASE_URL?.match(/^https:\/\/([^.]+)\.supabase\.co$/);
let inferredFunctionUrl: string | null = null;
if (projectMatch) {
  inferredFunctionUrl = `https://${projectMatch[1]}.functions.supabase.co/buddy-management`;
} else if (SUPABASE_URL && SUPABASE_URL.startsWith('http://')) {
  const sanitized = SUPABASE_URL.replace(/\/$/, '');
  inferredFunctionUrl = `${sanitized}/functions/v1/buddy-management`;
}
const FUNCTION_BASE_URL = Deno.env.get('BUDDY_MANAGEMENT_BASE_URL') ?? inferredFunctionUrl ?? '';
const OPT_OUT_REDIRECT_URL = Deno.env.get('BUDDY_OPT_OUT_REDIRECT_URL') ?? `${APP_URL}/accountability/opt-out-success`;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials for buddy-management function');
}

if (!RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY for buddy-management function');
}

if (!FUNCTION_BASE_URL) {
  throw new Error('Set BUDDY_MANAGEMENT_BASE_URL or SUPABASE_URL env variable so opt-out links can be generated.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);
const templateCache = new Map<string, string>();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    if (req.method === 'GET' && url.searchParams.get('action') === 'opt-out') {
      const token = url.searchParams.get('token');
      return await handleOptOut(token);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const action = body?.action;

      switch (action) {
        case 'invite':
          return await handleInvite(body?.contact_id);
        default:
          return jsonResponse({ error: 'Unsupported action' }, 400);
      }
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (error) {
    console.error('buddy-management error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

async function handleInvite(contactId?: string) {
  if (!contactId) {
    return jsonResponse({ error: 'contact_id is required' }, 400);
  }

  const { data: contact, error } = await supabase
    .from('contacts')
    .select(`
      id,
      name,
      email,
      relationship,
      opt_out_token,
      opted_out_at,
      user_id,
      users!inner (
        id,
        email,
        first_name,
        name,
        push_token
      )
    `)
    .eq('id', contactId)
    .single();

  if (error || !contact) {
    console.error('Failed to load contact for invite:', error);
    return jsonResponse({ error: 'Contact not found' }, 404);
  }

  const user = contact.users;
  if (!user) {
    return jsonResponse({ error: 'Contact missing owner' }, 400);
  }

  if (contact.opted_out_at) {
    return jsonResponse({ error: 'Contact has already opted out' }, 409);
  }

  let optOutToken = contact.opt_out_token;
  if (!optOutToken) {
    const { data: updated, error: updateError } = await supabase
      .from('contacts')
      .update({ opt_out_token: crypto.randomUUID() })
      .eq('id', contact.id)
      .select('opt_out_token')
      .single();

    if (updateError || !updated?.opt_out_token) {
      console.error('Failed to mint opt-out token:', updateError);
      return jsonResponse({ error: 'Unable to prepare invite' }, 500);
    }
    optOutToken = updated.opt_out_token;
  }

  const optOutUrl = `${FUNCTION_BASE_URL}?action=opt-out&token=${optOutToken}`;
  const learnMoreUrl = `${APP_URL}/accountability`;
  const userDisplayName = deriveUserDisplayName(user);
  const template = await getTemplate('buddy-invite');
  const html = compileTemplate(template, {
    userName: userDisplayName,
    contactName: contact.name ?? 'Accountability Buddy',
    learnMoreUrl,
    optOutUrl,
    supportEmail: SUPPORT_EMAIL,
  });

  const text = [
    `Hey ${contact.name ?? 'there'},`,
    `${userDisplayName} is using Rundown to stay consistent and listed you as their accountability buddy.`,
    `You'll get an email if they miss a weekly goal so you can nudge them.`,
    `Need to stop? Opt out anytime: ${optOutUrl}`,
  ].join('\n\n');

  await resend.emails.send({
    from: FROM_EMAIL,
    to: contact.email,
    subject: `${userDisplayName} invited you to keep them accountable`,
    html,
    text,
    headers: {
      'X-Entity-Ref-ID': optOutToken,
    },
  });

  await supabase.from('buddy_events').insert({
    user_id: user.id,
    contact_id: contact.id,
    event_type: 'contact_invited',
    metadata: { relationship: contact.relationship ?? null },
  });

  return jsonResponse({ success: true }, 200);
}

async function handleOptOut(token: string | null) {
  if (!token) {
    return renderOptOutPage({
      heading: 'Missing link',
      body: 'This opt-out link is invalid. Please contact support if you need help.',
      success: false,
    });
  }

  const { data: contact, error } = await supabase
    .from('contacts')
    .select(`
      *,
      users!inner (
        id,
        email,
        first_name,
        name,
        push_token
      )
    `)
    .eq('opt_out_token', token)
    .single();

  if (error || !contact) {
    return renderOptOutPage({
      heading: 'Link expired',
      body: 'We could not find this contact. The link may have already been used.',
      success: false,
    });
  }

  if (contact.opted_out_at) {
    return renderOptOutPage({
      heading: 'Already opted out',
      body: 'You have already removed yourself from these updates. No further action is needed.',
      success: true,
    });
  }

  await supabase
    .from('contacts')
    .update({ is_active: false, opted_out_at: new Date().toISOString() })
    .eq('id', contact.id);

  await supabase.from('buddy_events').insert({
    user_id: contact.user_id,
    contact_id: contact.id,
    event_type: 'contact_opted_out',
    metadata: { via: 'email_link' },
  });

  await notifyOwnerOfOptOut(contact);

  return renderOptOutPage({
    heading: 'You’re all set',
    body: 'We will no longer send you accountability updates. Thanks for supporting your buddy.',
    success: true,
  });
}

async function notifyOwnerOfOptOut(contact: any) {
  const user = contact.users;
  if (!user) return;

  const contactName = contact.name ?? 'Your contact';
  const template = await getTemplate('buddy-opt-out-user');
  const optOutTime = new Date().toLocaleString('en-US', { timeZone: 'UTC', hour12: true });
  const manageContactsUrl = `${APP_URL}/settings/accountability`;

  const html = compileTemplate(template, {
    contactName,
    optOutTime,
    manageContactsUrl,
    supportEmail: SUPPORT_EMAIL,
  });

  const text = [
    `${contactName} opted out of accountability emails.`,
    'We stopped sending them updates immediately.',
    `Add another buddy inside the app: ${manageContactsUrl}`,
  ].join('\n\n');

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `${contactName} opted out of Rundown reminders`,
      html,
      text,
    });
  } catch (error) {
    console.error('Failed to send owner notification email:', error);
  }

  try {
    await sendPushNotification(user.push_token, {
      title: `${contactName} opted out`,
      body: 'Add a new accountability buddy so we keep someone in the loop each week.',
      data: {
        type: 'buddy_opt_out',
        contact_id: contact.id,
      },
    });
  } catch (pushError) {
    console.error('Failed to send push notification:', pushError);
  }
}

async function sendPushNotification(
  pushToken: string | null,
  payload: { title: string; body: string; data?: Record<string, unknown> },
) {
  if (!pushToken) {
    console.warn('User has no push token; skipping push notification.');
    return;
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: pushToken,
      title: payload.title,
      body: payload.body,
      sound: 'default',
      priority: 'high',
      data: payload.data ?? {},
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push error: ${text}`);
  }
}

function deriveUserDisplayName(user: any) {
  return user?.first_name || user?.name || user?.email?.split('@')[0] || 'your friend';
}

async function getTemplate(name: string): Promise<string> {
  if (templateCache.has(name)) {
    return templateCache.get(name)!;
  }

  const fileUrl = new URL(`./templates/${name}.html`, import.meta.url);
  const contents = await Deno.readTextFile(fileUrl);
  templateCache.set(name, contents);
  return contents;
}

function compileTemplate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value ?? ''),
    template,
  );
}

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function renderOptOutPage({
  heading,
  body,
  success,
}: {
  heading: string;
  body: string;
  success: boolean;
}) {
  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Rundown Opt-Out</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        margin: 0;
        background-color: ${success ? '#f8fafc' : '#fff1f2'};
        color: #0f172a;
      }
      .wrapper {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px;
      }
      .card {
        max-width: 420px;
        background-color: #ffffff;
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
        text-align: center;
      }
      h1 {
        font-size: 24px;
        margin-bottom: 12px;
      }
      p {
        color: #475569;
        line-height: 1.6;
      }
      a.button {
        display: inline-block;
        margin-top: 24px;
        padding: 12px 28px;
        border-radius: 999px;
        background-color: #0f172a;
        color: #ffffff;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <h1>${heading}</h1>
        <p>${body}</p>
        <a class="button" href="${OPT_OUT_REDIRECT_URL}" target="_blank" rel="noopener">
          Return to Rundown
        </a>
      </div>
    </div>
  </body>
</html>
  `.trim();

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
