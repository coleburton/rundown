-- Add Strava connection status tracking to users table
-- This enables proper differentiation between manual disconnect, auth failures, and active connections

-- Add columns to track Strava connection status
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS strava_connection_status TEXT DEFAULT 'disconnected'
    CHECK (strava_connection_status IN ('connected', 'disconnected', 'auth_failed', 'token_expired')),
  ADD COLUMN IF NOT EXISTS strava_disconnected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS strava_disconnection_reason TEXT,
  ADD COLUMN IF NOT EXISTS strava_last_validated_at TIMESTAMP WITH TIME ZONE;

-- Backfill existing users with strava_id to 'connected' status
UPDATE users
SET strava_connection_status = 'connected',
    strava_last_validated_at = NOW()
WHERE strava_id IS NOT NULL
  AND access_token IS NOT NULL
  AND strava_connection_status = 'disconnected';

-- Update users without strava_id to explicitly 'disconnected' (already default, but explicit is better)
UPDATE users
SET strava_connection_status = 'disconnected'
WHERE strava_id IS NULL
  AND strava_connection_status != 'disconnected';

-- Create index for efficient status lookups
CREATE INDEX IF NOT EXISTS idx_users_connection_status ON users(strava_connection_status);

-- Add helpful comment explaining the states
COMMENT ON COLUMN users.strava_connection_status IS
  'Tracks Strava connection state:
   - connected: Active Strava connection with valid tokens
   - disconnected: User manually disconnected or never connected
   - auth_failed: Token refresh failed, needs full OAuth reconnection
   - token_expired: Token expired but refresh not yet attempted';

COMMENT ON COLUMN users.strava_disconnected_at IS
  'Timestamp when Strava was disconnected (manual or auth failure)';

COMMENT ON COLUMN users.strava_disconnection_reason IS
  'Why the connection was lost: user_action, token_refresh_failed, token_revoked';

COMMENT ON COLUMN users.strava_last_validated_at IS
  'Last time we confirmed tokens work (successful sync or refresh)';
