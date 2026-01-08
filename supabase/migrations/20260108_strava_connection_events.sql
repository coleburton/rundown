-- Create audit table for Strava connection events
-- This provides a complete history of connection/disconnection events for debugging

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

-- Create index for efficient user event lookups (most recent first)
CREATE INDEX IF NOT EXISTS idx_connection_events_user
  ON strava_connection_events(user_id, created_at DESC);

-- Create index for event type queries
CREATE INDEX IF NOT EXISTS idx_connection_events_type
  ON strava_connection_events(event_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE strava_connection_events ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own connection events
CREATE POLICY "Users can read own connection events"
  ON strava_connection_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to insert events (edge functions use service role)
CREATE POLICY "Service role can insert connection events"
  ON strava_connection_events
  FOR INSERT
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE strava_connection_events IS
  'Audit trail of all Strava connection events for debugging and monitoring';

COMMENT ON COLUMN strava_connection_events.event_type IS
  'Type of connection event:
   - connected: Initial Strava connection
   - disconnected: User manually disconnected
   - token_refreshed: Tokens successfully refreshed
   - refresh_failed: Token refresh failed
   - auth_failed: Authentication failed (requires reconnection)
   - reconnected: User reconnected after being disconnected';

COMMENT ON COLUMN strava_connection_events.metadata IS
  'JSON metadata about the event (error details, token info, etc.)';
