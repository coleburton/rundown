-- Migration: Replace phone_number with email in contacts table
-- Replace phone number collection with email collection for accountability buddies

-- Step 1: Rename phone_number column to email
ALTER TABLE contacts
  RENAME COLUMN phone_number TO email;

-- Step 2: Add email validation constraint
ALTER TABLE contacts
  ADD CONSTRAINT valid_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Step 3: Update database function: get_messages_to_send
CREATE OR REPLACE FUNCTION get_messages_to_send(
  batch_size INT DEFAULT 50,
  max_per_time_slot INT DEFAULT 100
)
RETURNS TABLE(
  message_id UUID,
  user_id UUID,
  contact_id UUID,
  email TEXT,  -- CHANGED FROM phone_number
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
    c.email,  -- CHANGED FROM c.phone_number
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
