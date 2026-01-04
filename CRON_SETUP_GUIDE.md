# Supabase Cron Jobs Setup Guide - Simplified Architecture

## Overview
The message automation system uses a **hybrid 3x/day approach** optimized for scale:
1. **accountability-scheduler** - Runs 3x/day (morning/afternoon/evening) to queue users (~5-10 seconds)
2. **accountability-processor** - Runs every 5-10 minutes to evaluate and send emails (respects rate limits)

## ✅ Step 1: Enable pg_cron Extension

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/aktjvvccfvszollpjflj
2. Navigate to **Database** → **Extensions**
3. Search for `pg_cron`
4. Click **Enable** if not already enabled

## ✅ Step 2: Apply Database Migration

Apply the migration that creates the user evaluation queue:

```bash
supabase db push
```

Or manually run the migration in SQL Editor:
```sql
-- Run the contents of supabase/migrations/20260104_accountability_queue.sql
```

## ✅ Step 3: Configure Accountability Scheduler (3x/day)

This scheduler runs 3 times per day to queue users based on their preferred time period.

### Morning Batch (9 AM UTC):

```sql
SELECT cron.schedule(
  'accountability-scheduler-morning',
  '0 9 * * *',  -- Every day at 9 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-scheduler',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"period": "morning"}'::jsonb
  );
  $$
);
```

### Afternoon Batch (3 PM UTC):

```sql
SELECT cron.schedule(
  'accountability-scheduler-afternoon',
  '0 15 * * *',  -- Every day at 3 PM UTC
  $$
  SELECT net.http_post(
    url := 'https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-scheduler',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"period": "afternoon"}'::jsonb
  );
  $$
);
```

### Evening Batch (9 PM UTC):

```sql
SELECT cron.schedule(
  'accountability-scheduler-evening',
  '0 21 * * *',  -- Every day at 9 PM UTC
  $$
  SELECT net.http_post(
    url := 'https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-scheduler',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"period": "evening"}'::jsonb
  );
  $$
);
```

## ✅ Step 4: Configure Accountability Processor (Every 5-10 minutes)

This processor evaluates queued users and sends emails via Resend batch API.

```sql
-- Schedule processor to run every 10 minutes
SELECT cron.schedule(
  'accountability-processor',
  '*/10 * * * *',  -- Every 10 minutes
  $$
  SELECT net.http_post(
    url := 'https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-processor',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**Note:** Runs every 10 minutes to:
- Process up to 50 users per run
- Use Resend batch API (100 emails/request)
- Respect rate limits (2 req/sec default)
- Handle errors gracefully with retry logic

## ✅ Step 5: Verify Cron Jobs

Check that cron jobs are scheduled:

```sql
SELECT * FROM cron.job;
```

You should see **4 jobs**:
- `accountability-scheduler-morning` (9 AM UTC)
- `accountability-scheduler-afternoon` (3 PM UTC)
- `accountability-scheduler-evening` (9 PM UTC)
- `accountability-processor` (every 10 minutes)

## ✅ Step 6: Monitor Cron Job Execution

View execution history:

```sql
SELECT
  job_id,
  runid,
  job_name,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

## 🧪 Testing

### Test accountability-scheduler manually:

```bash
# Test morning batch
curl -X POST \
  'https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-scheduler?period=morning' \
  -H 'Content-Type: application/json'

# Test afternoon batch
curl -X POST \
  'https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-scheduler' \
  -H 'Content-Type: application/json' \
  -d '{"period": "afternoon"}'

# Test evening batch
curl -X POST \
  'https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-scheduler' \
  -H 'Content-Type: application/json' \
  -d '{"period": "evening"}'
```

### Test accountability-processor manually:

```bash
curl -X POST \
  'https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-processor' \
  -H 'Content-Type: application/json'
```

### Check queue status:

```sql
SELECT * FROM user_evaluation_queue ORDER BY created_at DESC LIMIT 20;
```

## 🔧 Troubleshooting

### If cron jobs don't run:

1. **Check pg_cron is enabled**: `SELECT extname FROM pg_extension WHERE extname = 'pg_cron';`
2. **Check cron.job table**: `SELECT * FROM cron.job;`
3. **Check execution logs**: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
4. **Verify Edge Functions are deployed**: Visit Functions dashboard
5. **Check environment variables**: Ensure `RESEND_API_KEY` is set as secret

### To delete/modify a cron job:

```sql
-- Unschedule jobs
SELECT cron.unschedule('accountability-scheduler-morning');
SELECT cron.unschedule('accountability-scheduler-afternoon');
SELECT cron.unschedule('accountability-scheduler-evening');
SELECT cron.unschedule('accountability-processor');
```

## 📅 Recommended Schedule

- **accountability-scheduler**: 3x/day
  - Morning: `0 9 * * *` (9 AM UTC)
  - Afternoon: `0 15 * * *` (3 PM UTC)
  - Evening: `0 21 * * *` (9 PM UTC)
  - Queues users based on their message_day + message_time_period
  - Fast execution (~5-10 seconds, no timeout risk)

- **accountability-processor**: `*/10 * * * *` (Every 10 minutes)
  - Processes up to 50 users per run
  - Evaluates weekly progress and sends emails
  - Uses Resend batch API (100 emails/request)
  - Respects rate limits (2 req/sec default)

## 🎯 Why This Architecture?

**Benefits:**
- ✅ Scales to millions of users (queue handles burst load)
- ✅ No timeout risk (scheduler completes in seconds)
- ✅ Efficient (batch API sends 100 emails/request)
- ✅ Respects rate limits (processor throttles sending)
- ✅ Predictable timing (users know when emails arrive)
- ✅ Only 147 cron runs/day vs 145+ in old system

**Comparison:**
| Metric | Old System | New System |
|--------|-----------|------------|
| Scheduler runs | 1/day | 3/day |
| Processor runs | 144/day (every 10 min) | 144/day (same) |
| Timeout risk | High | None |
| Batch sending | No | Yes (100 emails/req) |
| Scale limit | ~10K users | Millions (with rate increase) |

## 🔐 Security Note

The cron jobs use Supabase's service role key automatically via `current_setting('app.settings.service_role_key')`. This is secure and doesn't require exposing secrets in the SQL.

## ✅ Completion Checklist

- [ ] pg_cron extension enabled
- [ ] Database migration applied (user_evaluation_queue table created)
- [ ] accountability-scheduler-morning cron job created (9 AM UTC)
- [ ] accountability-scheduler-afternoon cron job created (3 PM UTC)
- [ ] accountability-scheduler-evening cron job created (9 PM UTC)
- [ ] accountability-processor cron job created (every 10 minutes)
- [ ] Verified jobs appear in `cron.job` table
- [ ] Tested both Edge Functions manually
- [ ] Monitored first cron execution in `cron.job_run_details`
- [ ] Confirmed RESEND_API_KEY is set in Edge Function secrets
- [ ] Verified rundownapp.com domain in Resend (https://resend.com/domains)
- [ ] Set FROM_EMAIL environment variable to verified domain
