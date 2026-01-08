-- Apply Strava connection status tracking migrations
-- This can be run manually via Supabase SQL Editor

-- Migration 1: Add connection status columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS strava_connection_status TEXT DEFAULT 'disconnected'
    CHECK (strava_connection_status IN ('connected', 'disconnected', 'auth_failed', 'token_expired')),
  ADD COLUMN IF NOT EXISTS strava_disconnected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS strava_disconnection_reason TEXT,
  ADD COLUMN IF NOT EXISTS strava_last_validated_at TIMESTAMP WITH TIME ZONE;

-- Backfill existing users
UPDATE users
SET strava_connection_status = 'connected',
    strava_last_validated_at = NOW()
WHERE strava_id IS NOT NULL
  AND access_token IS NOT NULL
  AND strava_connection_status = 'disconnected';

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_connection_status ON users(strava_connection_status);

-- Migration 2: Create connection events audit table
CREATE TABLE IF NOT EXISTS strava_connection_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'connected',
    'disconnected',
    'token_refreshed',
    'refresh_failed',
    'auth_failed',
    'reconnected'
  )),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_connection_events_user
  ON strava_connection_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connection_events_type
  ON strava_connection_events(event_type, created_at DESC);

-- Enable RLS
ALTER TABLE strava_connection_events ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'strava_connection_events'
    AND policyname = 'Users can read own connection events'
  ) THEN
    CREATE POLICY "Users can read own connection events"
      ON strava_connection_events
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'strava_connection_events'
    AND policyname = 'Service role can insert connection events'
  ) THEN
    CREATE POLICY "Service role can insert connection events"
      ON strava_connection_events
      FOR INSERT
      WITH CHECK (true);
  END IF;
END$$;
