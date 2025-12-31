-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  strava_id TEXT UNIQUE,
  access_token TEXT,
  push_token TEXT,
  goal_per_week INT NOT NULL DEFAULT 3,
  streak_count INT NOT NULL DEFAULT 0,
  message_style TEXT NOT NULL DEFAULT 'supportive',
  send_day TEXT NOT NULL DEFAULT 'Sunday',
  send_time TEXT NOT NULL DEFAULT '20:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT message_style_check CHECK (message_style IN ('supportive', 'snarky', 'chaotic'))
);

-- Create contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT,
  opt_out_token UUID DEFAULT uuid_generate_v4(),
  opted_out_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create run_logs table
CREATE TABLE run_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL UNIQUE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  distance FLOAT NOT NULL,
  duration FLOAT NOT NULL,
  type TEXT NOT NULL DEFAULT 'run',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  status TEXT NOT NULL DEFAULT 'pending',
  message_text TEXT NOT NULL,
  CONSTRAINT status_check CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Create indexes
CREATE INDEX idx_users_strava_id ON users(strava_id);
CREATE INDEX idx_run_logs_user_id_date ON run_logs(user_id, date);
CREATE INDEX idx_messages_user_id_sent_at ON messages(user_id, sent_at);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE TABLE buddy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
CREATE INDEX idx_buddy_events_user ON buddy_events(user_id);
CREATE INDEX idx_buddy_events_contact ON buddy_events(contact_id);
CREATE INDEX idx_contacts_opt_out_token ON contacts(opt_out_token);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can manage their own contacts
CREATE POLICY "Users can manage own contacts" ON contacts
  FOR ALL USING (auth.uid() = user_id);

-- Users can read and create their own run logs
CREATE POLICY "Users can manage own run logs" ON run_logs
  FOR ALL USING (auth.uid() = user_id);

-- Users can read their own messages
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id); 
