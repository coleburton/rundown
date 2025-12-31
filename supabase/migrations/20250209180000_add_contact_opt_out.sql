-- Add opt-out + push notification support
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS opt_out_token UUID DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS opted_out_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_opt_out_token
  ON contacts(opt_out_token);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS push_token TEXT;

CREATE TABLE IF NOT EXISTS buddy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_buddy_events_user ON buddy_events(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_events_contact ON buddy_events(contact_id);
