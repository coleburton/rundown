-- Migration: Add user evaluation queue for simplified accountability system
-- This enables a 3x/day scheduler approach with efficient batch processing

-- Create user evaluation queue table
CREATE TABLE IF NOT EXISTS user_evaluation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('morning', 'afternoon', 'evening')),
  priority INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

  -- Prevent duplicate queue entries for same user
  UNIQUE(user_id, period, created_at::date)
);

-- Add index for efficient queue processing
CREATE INDEX idx_user_evaluation_queue_status_priority
  ON user_evaluation_queue(status, priority, created_at)
  WHERE status = 'queued';

-- Add RLS policies
ALTER TABLE user_evaluation_queue ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access queue
CREATE POLICY "Service role can manage queue" ON user_evaluation_queue
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to efficiently queue multiple users
CREATE OR REPLACE FUNCTION queue_users_for_accountability_check(
  user_ids UUID[],
  scheduled_period TEXT,
  priority INTEGER DEFAULT 3
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  queued_count INTEGER := 0;
  user_id UUID;
BEGIN
  -- Loop through user IDs and insert queue entries
  FOREACH user_id IN ARRAY user_ids
  LOOP
    INSERT INTO user_evaluation_queue (user_id, period, priority)
    VALUES (user_id, scheduled_period, priority)
    ON CONFLICT (user_id, period, (created_at::date)) DO NOTHING;

    queued_count := queued_count + 1;
  END LOOP;

  RETURN queued_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION queue_users_for_accountability_check TO service_role;

-- Add comment
COMMENT ON TABLE user_evaluation_queue IS
  'Queue for users who need their weekly progress evaluated and accountability messages sent. Processed by accountability-processor function.';

COMMENT ON FUNCTION queue_users_for_accountability_check IS
  'Efficiently queues multiple users for accountability evaluation. Called by accountability-scheduler 3x/day (morning/afternoon/evening).';
