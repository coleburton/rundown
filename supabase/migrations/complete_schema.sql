-- =====================================================
-- Rundown Mobile - Complete Database Schema
-- Generated from TypeScript types and edge function requirements
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extended with all fields from TypeScript types)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  first_name TEXT,
  last_name TEXT,

  -- Strava integration
  strava_id TEXT UNIQUE,
  access_token TEXT, -- Encrypted in edge functions before storage
  refresh_token TEXT, -- Encrypted in edge functions before storage
  token_expires_at TIMESTAMP WITH TIME ZONE,
  push_token TEXT,
  -- SECURITY NOTE: Tokens are encrypted using AES-GCM in edge functions
  -- Consider migrating to Supabase Vault for enhanced security in future

  -- User preferences
  birthday TEXT,
  timezone TEXT,
  measurement_unit TEXT,
  fitness_level TEXT,
  primary_goal TEXT,

  -- Goal settings
  goal_per_week INT NOT NULL DEFAULT 3,
  goal_type TEXT,
  goal_value NUMERIC,
  streak_count INT NOT NULL DEFAULT 0,

  -- Message settings
  message_style TEXT NOT NULL DEFAULT 'supportive',
  message_day TEXT,
  message_time_period TEXT,
  send_day TEXT NOT NULL DEFAULT 'Sunday',
  send_time TEXT NOT NULL DEFAULT '20:00',
  reminder_time TEXT,
  notification_enabled BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Contacts table (accountability partners)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT,
  opt_out_token UUID DEFAULT uuid_generate_v4(),
  opted_out_at TIMESTAMP WITH TIME ZONE,

  -- Verification
  verification_code TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Notification settings
  notification_preference TEXT,
  last_notified_at TIMESTAMP WITH TIME ZONE,

  -- Soft delete
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Activities table (Strava activity data)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strava_activity_id BIGINT NOT NULL UNIQUE,

  -- Basic info
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  sport_type TEXT NOT NULL,

  -- Timing
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date_local TIMESTAMP WITH TIME ZONE NOT NULL,
  moving_time NUMERIC,
  elapsed_time NUMERIC,

  -- Distance and elevation
  distance NUMERIC,
  total_elevation_gain NUMERIC,

  -- Speed
  average_speed NUMERIC,
  max_speed NUMERIC,

  -- Heart rate
  average_heartrate NUMERIC,
  max_heartrate NUMERIC,

  -- Social
  kudos_count NUMERIC,
  achievement_count NUMERIC,

  -- Full raw data from Strava
  raw_data JSONB,

  -- Sync tracking
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- User goals table (flexible goal system)
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Goal definition
  goal_type TEXT NOT NULL, -- weekly_runs, monthly_distance, etc.
  target_value NUMERIC NOT NULL,
  target_unit TEXT NOT NULL, -- runs, miles, km, etc.
  time_period TEXT NOT NULL, -- weekly, monthly, daily, custom

  -- Optional constraints
  activity_types TEXT[], -- ['Run', 'Ride'] or null for all
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,

  -- Metadata
  description TEXT,
  priority INT DEFAULT 3, -- 1=high, 2=medium, 3=low
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Goal progress table (tracks progress toward goals)
CREATE TABLE IF NOT EXISTS goal_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,

  -- Period tracking
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Progress
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  progress_percentage NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN target_value > 0 THEN (current_value / target_value * 100)
      ELSE 0
    END
  ) STORED,
  is_achieved BOOLEAN DEFAULT false,

  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Goal history table (tracks goal changes over time)
CREATE TABLE IF NOT EXISTS goal_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  goal_value NUMERIC NOT NULL,
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Messages table (log of sent messages)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),

  CONSTRAINT status_check CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Message queue table (for scheduled messages with rate limiting)
CREATE TABLE IF NOT EXISTS message_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Message content
  message_text TEXT NOT NULL,
  message_type TEXT, -- accountability, congratulatory, reminder

  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INT DEFAULT 3, -- 1=high, 2=medium, 3=low

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued', -- queued, processing, sent, failed
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error_message TEXT,

  -- Rate limiting (track messages sent in current time slot)
  sent_at TIMESTAMP WITH TIME ZONE,

  -- Deduplication (prevent same message to same contact too frequently)
  message_hash TEXT, -- hash of message_text for deduplication

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

  CONSTRAINT queue_status_check CHECK (status IN ('queued', 'processing', 'sent', 'failed'))
);

-- Strava webhook events table (audit log)
CREATE TABLE IF NOT EXISTS strava_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_type TEXT NOT NULL, -- activity, athlete
  object_id BIGINT NOT NULL,
  aspect_type TEXT NOT NULL, -- create, update, delete
  owner_id BIGINT NOT NULL,
  subscription_id BIGINT,
  event_time BIGINT NOT NULL,
  updates JSONB,
  raw_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Sync status table (tracks last sync per user)
CREATE TABLE IF NOT EXISTS sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  sync_errors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Run logs table - DEPRECATED
-- This table is redundant with the activities table.
-- Kept only if needed for migration - consider dropping after verification.
-- Uncomment below if you need it for backward compatibility:
/*
CREATE TABLE IF NOT EXISTS run_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL UNIQUE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  distance FLOAT NOT NULL,
  duration FLOAT NOT NULL,
  type TEXT NOT NULL DEFAULT 'run',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
CREATE INDEX IF NOT EXISTS idx_run_logs_user_id_date ON run_logs(user_id, date DESC);
ALTER TABLE run_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own run logs" ON run_logs FOR ALL USING (auth.uid() = user_id);
*/

-- =====================================================
-- INDEXES (for performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_strava_id ON users(strava_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_opt_out_token ON contacts(opt_out_token);

-- Buddy event audit trail
CREATE TABLE IF NOT EXISTS buddy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_buddy_events_user ON buddy_events(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_events_contact ON buddy_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_active ON contacts(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_strava_id ON activities(strava_activity_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(user_id, type, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON user_goals(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_goal_progress_user_id ON goal_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_id ON goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_period ON goal_progress(user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_messages_user_id_sent_at ON messages(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);

CREATE INDEX IF NOT EXISTS idx_message_queue_status_priority ON message_queue(status, priority, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_message_queue_user_id ON message_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_scheduled ON message_queue(scheduled_for) WHERE status = 'queued';

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activities_user_type_date ON activities(user_id, sport_type, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_goal_progress_user_period ON goal_progress(user_id, period_start DESC, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_message_queue_user_contact ON message_queue(user_id, contact_id, scheduled_for DESC);
CREATE INDEX IF NOT EXISTS idx_message_queue_hash ON message_queue(contact_id, message_hash, created_at DESC) WHERE status = 'sent';

CREATE INDEX IF NOT EXISTS idx_webhook_events_owner ON strava_webhook_events(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON strava_webhook_events(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_sync_status_user ON sync_status(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE strava_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Contacts policies
CREATE POLICY "Users can manage own contacts" ON contacts
  FOR ALL USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can read own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

-- User goals policies
CREATE POLICY "Users can manage own goals" ON user_goals
  FOR ALL USING (auth.uid() = user_id);

-- Goal progress policies
CREATE POLICY "Users can read own progress" ON goal_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON goal_progress
  FOR ALL USING (auth.uid() = user_id);

-- Goal history policies
CREATE POLICY "Users can read own goal history" ON goal_history
  FOR SELECT USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Message queue policies (restrictive - managed by edge functions)
CREATE POLICY "Users can read own queued messages" ON message_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Webhook events policies (read-only for authenticated users)
CREATE POLICY "Allow read webhook events" ON strava_webhook_events
  FOR SELECT USING (true);

-- Sync status policies
CREATE POLICY "Users can read own sync status" ON sync_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sync status" ON sync_status
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function: Get goal for a specific week
CREATE OR REPLACE FUNCTION get_goal_for_week(
  p_user_id UUID,
  p_week_start TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(goal_type TEXT, goal_value NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First try to get from user_goals for the specified period
  RETURN QUERY
  SELECT
    ug.goal_type,
    ug.target_value as goal_value
  FROM user_goals ug
  WHERE ug.user_id = p_user_id
    AND ug.is_active = true
    AND ug.time_period IN ('weekly', 'custom')
    AND (ug.start_date IS NULL OR ug.start_date <= p_week_start)
    AND (ug.end_date IS NULL OR ug.end_date >= p_week_start)
  ORDER BY ug.priority ASC
  LIMIT 1;

  -- If no goal found, fall back to user's default goal_per_week
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      'weekly_runs'::TEXT as goal_type,
      u.goal_per_week::NUMERIC as goal_value
    FROM users u
    WHERE u.id = p_user_id;
  END IF;
END;
$$;

-- Function: Get messages to send (with rate limiting)
CREATE OR REPLACE FUNCTION get_messages_to_send(
  batch_size INT DEFAULT 50,
  max_per_time_slot INT DEFAULT 100
)
RETURNS TABLE(
  message_id UUID,
  user_id UUID,
  contact_id UUID,
  email TEXT,
  message_text TEXT,
  priority INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_time_slot TIMESTAMP WITH TIME ZONE;
  sent_in_slot INT;
BEGIN
  -- Define current time slot (hourly)
  current_time_slot := date_trunc('hour', NOW());

  -- Count messages sent in current time slot
  SELECT COUNT(*) INTO sent_in_slot
  FROM message_queue
  WHERE status = 'sent'
    AND sent_at >= current_time_slot
    AND sent_at < current_time_slot + INTERVAL '1 hour';

  -- If we've hit the rate limit, return empty
  IF sent_in_slot >= max_per_time_slot THEN
    RETURN;
  END IF;

  -- Return queued messages that are due, respecting batch size and remaining quota
  RETURN QUERY
  SELECT
    mq.id as message_id,
    mq.user_id,
    mq.contact_id,
    c.email,
    mq.message_text,
    mq.priority
  FROM message_queue mq
  JOIN contacts c ON c.id = mq.contact_id
  WHERE mq.status = 'queued'
    AND mq.scheduled_for <= NOW()
    AND mq.attempts < mq.max_attempts
    AND c.is_active = true
  ORDER BY mq.priority ASC, mq.scheduled_for ASC
  LIMIT LEAST(batch_size, max_per_time_slot - sent_in_slot);
END;
$$;

-- Function: Update message status
CREATE OR REPLACE FUNCTION update_message_status(
  p_message_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE message_queue
  SET
    status = p_status,
    attempts = attempts + 1,
    error_message = COALESCE(p_error_message, error_message),
    sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
    updated_at = NOW()
  WHERE id = p_message_id;
END;
$$;

-- Function: Schedule accountability message (with deduplication)
CREATE OR REPLACE FUNCTION schedule_accountability_message(
  p_user_id UUID,
  p_contact_id UUID,
  p_message_text TEXT,
  p_scheduled_for TIMESTAMP WITH TIME ZONE,
  p_priority INT DEFAULT 3
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_message_id UUID;
  msg_hash TEXT;
BEGIN
  -- Generate hash for deduplication
  msg_hash := generate_message_hash(p_message_text);

  -- Check if similar message was recently sent (within 14 days)
  IF was_message_recently_sent(p_contact_id, msg_hash, 14) THEN
    -- Skip scheduling duplicate message, return NULL
    RAISE NOTICE 'Skipping duplicate message to contact % (sent within 14 days)', p_contact_id;
    RETURN NULL;
  END IF;

  -- Insert new message
  INSERT INTO message_queue (
    user_id,
    contact_id,
    message_text,
    message_type,
    scheduled_for,
    priority,
    status,
    message_hash
  ) VALUES (
    p_user_id,
    p_contact_id,
    p_message_text,
    'accountability',
    p_scheduled_for,
    p_priority,
    'queued',
    msg_hash
  )
  RETURNING id INTO new_message_id;

  RETURN new_message_id;
END;
$$;

-- =====================================================
-- TRIGGERS (for updated_at timestamps)
-- =====================================================

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_status_updated_at BEFORE UPDATE ON sync_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_queue_updated_at BEFORE UPDATE ON message_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Generate message hash for deduplication
CREATE OR REPLACE FUNCTION generate_message_hash(message_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN encode(digest(message_text, 'sha256'), 'hex');
END;
$$;

-- Function: Check if similar message was recently sent
CREATE OR REPLACE FUNCTION was_message_recently_sent(
  p_contact_id UUID,
  p_message_hash TEXT,
  p_days_threshold INT DEFAULT 14
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM message_queue
  WHERE contact_id = p_contact_id
    AND message_hash = p_message_hash
    AND status = 'sent'
    AND created_at > NOW() - (p_days_threshold || ' days')::INTERVAL;

  RETURN recent_count > 0;
END;
$$;

-- =====================================================
-- COMPLETE - Optimized schema ready for Strava sync!
-- =====================================================

-- Verify tables created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
