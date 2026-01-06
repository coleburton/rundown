-- Create debug messages table to store email content for testing
-- Instead of sending emails, we'll log what would have been sent

CREATE TABLE IF NOT EXISTS debug_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  contact_email text NOT NULL,
  contact_name text,
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text NOT NULL,
  message_type text, -- 'missed-goal', 'weekly-summary', etc.
  message_style text, -- 'supportive', 'snarky', etc.
  metadata jsonb -- for any additional context
);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_debug_messages_user_id ON debug_messages(user_id);

-- Index for querying by contact
CREATE INDEX IF NOT EXISTS idx_debug_messages_contact_id ON debug_messages(contact_id);

-- Index for querying by created date
CREATE INDEX IF NOT EXISTS idx_debug_messages_created_at ON debug_messages(created_at DESC);

-- Add RLS policies
ALTER TABLE debug_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own debug messages
CREATE POLICY "Users can view their own debug messages"
  ON debug_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do anything (for the Edge Function)
CREATE POLICY "Service role can manage debug messages"
  ON debug_messages
  FOR ALL
  USING (auth.role() = 'service_role');
