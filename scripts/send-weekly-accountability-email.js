'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const dotenv = require('dotenv');

dotenv.config();

const TEMPLATE_FILES = {
  'accountability-check-in': path.resolve(
    __dirname,
    '..',
    'email-templates',
    'accountability-check-in.html',
  ),
  'buddy-invite': path.resolve(
    __dirname,
    '..',
    'supabase',
    'functions',
    'buddy-management',
    'templates',
    'buddy-invite.html',
  ),
  'buddy-opt-out-user': path.resolve(
    __dirname,
    '..',
    'supabase',
    'functions',
    'buddy-management',
    'templates',
    'buddy-opt-out-user.html',
  ),
};

const TEMPLATE_BUILDERS = {
  'accountability-check-in': buildAccountabilityPayload,
  'buddy-invite': buildBuddyInvitePayload,
  'buddy-opt-out-user': buildBuddyOptOutPayload,
};

(async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const templateKey = normalizeTemplateKey(args.template);
    const templatePath = TEMPLATE_FILES[templateKey];

    if (!templatePath) {
      throw new Error(
        `Unsupported template "${args.template ?? ''}". Use one of: ${Object.keys(TEMPLATE_FILES).join(
          ', ',
        )}`,
      );
    }

    const config = buildBaseConfig(args);
    validateBaseConfig(config);

    const templateBuilder = TEMPLATE_BUILDERS[templateKey];
    const payload = templateBuilder(args);

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const html = compileTemplate(templateSource, payload.replacements);
    const text = payload.text ?? '';

    if (config.dryRun) {
      console.log('--- Dry run enabled; preview below ---');
      console.log(`Template: ${templateKey}`);
      console.log(`To: ${config.to.join(', ')}`);
      console.log(`Subject: ${payload.subject}`);
      if (text) {
        console.log('\nText preview:\n', text);
      }
      return;
    }

    const response = await sendResendEmail({
      from: config.from,
      to: config.to,
      subject: payload.subject,
      html,
      text,
      headers: config.optOutToken ? { 'X-Entity-Ref-ID': config.optOutToken } : undefined,
    });

    console.log('Email sent via Resend:', response);
  } catch (error) {
    console.error('Failed to send Resend email:', error.message);
    process.exitCode = 1;
  }
})();

function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    if (!arg.startsWith('--')) {
      return acc;
    }

    const [rawKey, ...valueParts] = arg.slice(2).split('=');
    const camelKey = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    acc[camelKey] = valueParts.length ? valueParts.join('=') : 'true';
    return acc;
  }, {});
}

function normalizeTemplateKey(rawTemplate) {
  const raw = (rawTemplate || 'accountability-check-in').toLowerCase();
  if (raw === 'accountability' || raw === 'accountability-check-in') {
    return 'accountability-check-in';
  }
  if (raw === 'buddy-invite' || raw === 'buddy-welcome') {
    return 'buddy-invite';
  }
  if (raw === 'buddy-opt-out-user' || raw === 'buddy-opt-out') {
    return 'buddy-opt-out-user';
  }
  return raw;
}

function buildBaseConfig(args) {
  const recipientInput = args.to || process.env.ACCOUNTABILITY_TEST_TO;
  return {
    to: recipientInput
      ? recipientInput
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : [],
    from:
      args.from ||
      process.env.EXPO_PUBLIC_FROM_EMAIL ||
      process.env.FROM_EMAIL ||
      'notifications@rundownapp.com',
    optOutToken: args.optOutToken || process.env.ACCOUNTABILITY_OPT_OUT_TOKEN,
    dryRun: args.dryRun === 'true' || args.dryRun === true,
  };
}

function validateBaseConfig(config) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in the environment.');
  }

  if (!config.to.length) {
    throw new Error('Provide a recipient with --to or ACCOUNTABILITY_TEST_TO.');
  }
}

function buildAccountabilityPayload(args) {
  const userName = args.userName || process.env.ACCOUNTABILITY_USER_NAME || 'Your friend';
  const contactName =
    args.contactName || process.env.ACCOUNTABILITY_CONTACT_NAME || 'Accountability buddy';
  const weeklyGoal = Number(args.weeklyGoal || process.env.ACCOUNTABILITY_WEEKLY_GOAL || 4);
  const actualActivities = Number(
    args.actualActivities ||
      args.actual ||
      process.env.ACCOUNTABILITY_ACTUAL_ACTIVITIES ||
      process.env.ACCOUNTABILITY_ACTUAL ||
      1,
  );
  const preferredDay = args.preferredDay || args.sendDay || process.env.ACCOUNTABILITY_SEND_DAY || 'Sunday';
  const sendTime = args.preferredTime || args.sendTime || process.env.ACCOUNTABILITY_SEND_TIME || '18:00';
  const timezone = args.timezone || process.env.ACCOUNTABILITY_TIMEZONE;
  const ctaUrl =
    args.ctaUrl || process.env.ACCOUNTABILITY_CTA_URL || 'https://app.rundownapp.com/accountability';
  const unsubscribeUrl =
    args.unsubscribeUrl ||
    process.env.ACCOUNTABILITY_UNSUBSCRIBE_URL ||
    process.env.ACCOUNTABILITY_OPT_OUT_URL ||
    'https://app.rundownapp.com/accountability/opt-out';

  if (!Number.isFinite(weeklyGoal) || weeklyGoal <= 0) {
    throw new Error('weeklyGoal must be a positive number.');
  }

  if (!Number.isFinite(actualActivities) || actualActivities < 0) {
    throw new Error('actualActivities must be zero or a positive number.');
  }

  const replacements = {
    userName,
    contactName,
    weeklyGoal: String(weeklyGoal),
    actualActivities: String(actualActivities),
    preferredDay: formatDay(preferredDay),
    preferredTime: formatPreferredTime(sendTime, timezone),
    ctaUrl,
    unsubscribeUrl,
  };

  return {
    subject: `${userName} could use a nudge this week`,
    replacements,
    text: createAccountabilityText({
      userName,
      contactName,
      actualActivities,
      weeklyGoal,
      preferredDay: replacements.preferredDay,
      preferredTime: replacements.preferredTime,
      ctaUrl,
      unsubscribeUrl,
    }),
  };
}

function buildBuddyInvitePayload(args) {
  const userName = args.userName || process.env.ACCOUNTABILITY_USER_NAME || 'Your friend';
  const contactName = args.contactName || 'there';
  const learnMoreUrl =
    args.learnMoreUrl || process.env.ACCOUNTABILITY_LEARN_MORE_URL || 'https://app.rundownapp.com/accountability';
  const optOutUrl =
    args.optOutUrl ||
    args.unsubscribeUrl ||
    process.env.ACCOUNTABILITY_OPT_OUT_URL ||
    'https://app.rundownapp.com/accountability/opt-out';
  const supportEmail = args.supportEmail || process.env.SUPPORT_EMAIL || 'support@rundownapp.com';

  const replacements = {
    userName,
    contactName,
    learnMoreUrl,
    optOutUrl,
    supportEmail,
  };

  const text = [
    `Hey ${contactName},`,
    `${userName} is using Rundown to stay consistent and listed you as their accountability buddy.`,
    `You'll get an email if they miss a weekly goal so you can nudge them.`,
    `Need to stop? Opt out anytime: ${optOutUrl}`,
  ].join('\n\n');

  return {
    subject: `${userName} invited you to keep them accountable`,
    replacements,
    text,
  };
}

function buildBuddyOptOutPayload(args) {
  const contactName = args.contactName || 'Your contact';
  const timezone = args.timezone || 'UTC';
  const optOutTime =
    args.optOutTime ||
    new Date().toLocaleString('en-US', { timeZone: timezone, hour12: true });
  const manageContactsUrl =
    args.manageContactsUrl ||
    process.env.ACCOUNTABILITY_MANAGE_CONTACTS_URL ||
    'https://app.rundownapp.com/settings/accountability';
  const supportEmail = args.supportEmail || process.env.SUPPORT_EMAIL || 'support@rundownapp.com';

  const replacements = {
    contactName,
    optOutTime,
    manageContactsUrl,
    supportEmail,
  };

  const text = [
    `${contactName} opted out of accountability emails.`,
    'We stopped sending them updates immediately.',
    `Add another buddy inside the app: ${manageContactsUrl}`,
  ].join('\n\n');

  return {
    subject: `${contactName} opted out of Rundown reminders`,
    replacements,
    text,
  };
}

function formatDay(day) {
  if (!day) return 'Sunday';
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatPreferredTime(time, timezone) {
  if (!time || typeof time !== 'string') {
    return '6:00 PM';
  }

  const [hoursRaw, minutesRaw = '00'] = time.split(':');
  let hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  const formatted = `${hours}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  if (timezone) {
    return `${formatted} (${timezone})`;
  }
  return formatted;
}

function compileTemplate(template, variables) {
  return Object.entries(variables).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value ?? ''),
    template,
  );
}

function createAccountabilityText({
  contactName,
  userName,
  actualActivities,
  weeklyGoal,
  preferredDay,
  preferredTime,
  ctaUrl,
  unsubscribeUrl,
}) {
  const shortfall = Math.max(weeklyGoal - actualActivities, 0);
  const needs =
    shortfall > 0
      ? `${shortfall} more ${shortfall === 1 ? 'activity' : 'activities'}`
      : 'a quick push to stay consistent';

  return [
    `Hey ${contactName},`,
    `${userName} only finished ${actualActivities}/${weeklyGoal} activities this week.`,
    `Their usual training window is ${preferredDay} around ${preferredTime}.`,
    `They're ${needs} away from their goal.`,
    `Send a quick note: ${ctaUrl}`,
    `Manage notifications: ${unsubscribeUrl}`,
  ].join('\n\n');
}

function sendResendEmail(payload) {
  const data = JSON.stringify(payload);

  const options = {
    hostname: 'api.resend.com',
    path: '/emails',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        } else {
          reject(new Error(`Resend responded with ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(data);
    req.end();
  });
}
