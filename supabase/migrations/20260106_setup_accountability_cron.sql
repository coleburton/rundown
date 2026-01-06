-- Setup cron jobs for accountability scheduler
-- Runs 3x daily: 9 AM, 3 PM, 9 PM UTC

-- Unschedule any existing accountability jobs (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('accountability-morning');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('accountability-afternoon');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('accountability-evening');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Morning check: 9 AM UTC every day
SELECT cron.schedule(
  'accountability-morning',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-scheduler?period=morning',
      headers:=jsonb_build_object('Content-Type', 'application/json'),
      body:=jsonb_build_object('period', 'morning')
    ) as request_id;
  $$
);

-- Afternoon check: 3 PM UTC every day
SELECT cron.schedule(
  'accountability-afternoon',
  '0 15 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-scheduler?period=afternoon',
      headers:=jsonb_build_object('Content-Type', 'application/json'),
      body:=jsonb_build_object('period', 'afternoon')
    ) as request_id;
  $$
);

-- Evening check: 9 PM UTC every day
SELECT cron.schedule(
  'accountability-evening',
  '0 21 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://aktjvvccfvszollpjflj.supabase.co/functions/v1/accountability-scheduler?period=evening',
      headers:=jsonb_build_object('Content-Type', 'application/json'),
      body:=jsonb_build_object('period', 'evening')
    ) as request_id;
  $$
);
