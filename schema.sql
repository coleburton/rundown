-- Rundown Mobile App Database Schema
-- This schema creates the necessary tables for a fitness accountability app
-- that integrates with Strava and sends messages to accountability contacts

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Users table: Core user information and preferences
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    strava_id VARCHAR(255) UNIQUE,
    access_token TEXT, -- Encrypted Strava access token
    push_token TEXT,
    goal_per_week INTEGER DEFAULT 3, -- Weekly running goal
    streak_count INTEGER DEFAULT 0, -- Current streak count
    message_style VARCHAR(20) DEFAULT 'supportive' CHECK (message_style IN ('supportive', 'snarky', 'chaotic')),
    send_day VARCHAR(10) DEFAULT 'Sunday', -- Day of week to send accountability messages
    send_time TIME DEFAULT '18:00:00', -- Time to send messages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table: User's accountability contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    relationship VARCHAR(100), -- e.g., 'friend', 'family', 'coach'
    opt_out_token UUID DEFAULT uuid_generate_v4(),
    opted_out_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Run logs table: Activity data from Strava or manual entry
CREATE TABLE run_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id VARCHAR(255) NOT NULL, -- Strava activity ID or generated ID for manual entries
    date DATE NOT NULL,
    distance DECIMAL(10,2) NOT NULL, -- Distance in meters
    duration INTEGER NOT NULL, -- Duration in seconds
    type VARCHAR(50) DEFAULT 'Run', -- Activity type (Run, Walk, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_id) -- Prevent duplicate activities
);

-- Messages table: Accountability messages sent to contacts
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_opt_out_token ON contacts(opt_out_token);
CREATE INDEX idx_run_logs_user_id ON run_logs(user_id);
CREATE INDEX idx_run_logs_date ON run_logs(date);
CREATE INDEX idx_run_logs_user_date ON run_logs(user_id, date);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Contacts policies
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON contacts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON contacts
    FOR DELETE USING (auth.uid() = user_id);

-- Run logs policies
CREATE POLICY "Users can view own run logs" ON run_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own run logs" ON run_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own run logs" ON run_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own run logs" ON run_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Create a view for weekly activity summaries
CREATE VIEW weekly_activity_summary AS
SELECT 
    user_id,
    DATE_TRUNC('week', date) as week_start,
    COUNT(*) as activity_count,
    SUM(distance) as total_distance,
    SUM(duration) as total_duration,
    AVG(distance) as avg_distance,
    AVG(duration) as avg_duration
FROM run_logs
GROUP BY user_id, DATE_TRUNC('week', date);

-- Grant access to the view
GRANT SELECT ON weekly_activity_summary TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can view own weekly summary" ON weekly_activity_summary
    FOR SELECT USING (auth.uid() = user_id);

-- Message scheduling and queue tables for load balancing
CREATE TABLE message_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    message_text TEXT NOT NULL,
    priority INTEGER DEFAULT 3, -- 1 = high, 2 = medium, 3 = low
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Message sending rate limits and load balancing
CREATE TABLE message_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_slot TIMESTAMP WITH TIME ZONE NOT NULL, -- Hour slots for rate limiting
    messages_sent INTEGER DEFAULT 0,
    max_messages_per_slot INTEGER DEFAULT 100, -- Twilio rate limit consideration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(time_slot)
);

-- Buddy events audit table
CREATE TABLE buddy_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_buddy_events_user ON buddy_events(user_id);
CREATE INDEX idx_buddy_events_contact ON buddy_events(contact_id);

-- User notification preferences (expanded)
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    send_day VARCHAR(10) DEFAULT 'Sunday',
    send_time TIME DEFAULT '18:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    send_if_goal_met BOOLEAN DEFAULT FALSE, -- Send congratulatory messages
    send_if_partial_goal BOOLEAN DEFAULT TRUE, -- Send encouragement for partial progress
    min_days_before_reminder INTEGER DEFAULT 1, -- Don't spam daily
    max_messages_per_week INTEGER DEFAULT 1,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for message queue operations
CREATE INDEX idx_message_queue_scheduled_for ON message_queue(scheduled_for);
CREATE INDEX idx_message_queue_status ON message_queue(status);
CREATE INDEX idx_message_queue_user_id ON message_queue(user_id);
CREATE INDEX idx_message_queue_priority_scheduled ON message_queue(priority, scheduled_for) WHERE status = 'queued';
CREATE INDEX idx_rate_limits_time_slot ON message_rate_limits(time_slot);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Add trigger for message_queue updated_at
CREATE TRIGGER update_message_queue_updated_at BEFORE UPDATE ON message_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for new tables
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own message queue" ON message_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage message queue" ON message_queue
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage rate limits" ON message_rate_limits
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Function to schedule accountability messages
CREATE OR REPLACE FUNCTION schedule_accountability_message(
    p_user_id UUID,
    p_contact_id UUID,
    p_message_text TEXT,
    p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_priority INTEGER DEFAULT 3
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
    scheduled_time TIMESTAMP WITH TIME ZONE;
    user_preferences RECORD;
BEGIN
    -- Get user's notification preferences
    SELECT * INTO user_preferences
    FROM notification_preferences
    WHERE user_id = p_user_id;
    
    -- If no preferences set, use defaults
    IF user_preferences IS NULL THEN
        INSERT INTO notification_preferences (user_id) VALUES (p_user_id);
        SELECT * INTO user_preferences FROM notification_preferences WHERE user_id = p_user_id;
    END IF;
    
    -- Calculate scheduled time if not provided
    IF p_scheduled_for IS NULL THEN
        scheduled_time := CURRENT_TIMESTAMP + INTERVAL '1 hour'; -- Default to 1 hour from now
    ELSE
        scheduled_time := p_scheduled_for;
    END IF;
    
    -- Insert message into queue
    INSERT INTO message_queue (
        user_id,
        contact_id,
        scheduled_for,
        message_text,
        priority
    ) VALUES (
        p_user_id,
        p_contact_id,
        scheduled_time,
        p_message_text,
        p_priority
    ) RETURNING id INTO message_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next batch of messages to send (with load balancing)
CREATE OR REPLACE FUNCTION get_messages_to_send(
    batch_size INTEGER DEFAULT 50,
    max_per_time_slot INTEGER DEFAULT 100
)
RETURNS TABLE(
    message_id UUID,
    user_id UUID,
    contact_id UUID,
    email VARCHAR(255),
    message_text TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    current_time_slot TIMESTAMP WITH TIME ZONE;
    messages_sent_this_slot INTEGER;
    available_slots INTEGER;
BEGIN
    -- Get current hour slot
    current_time_slot := DATE_TRUNC('hour', NOW());
    
    -- Check current rate limit usage
    SELECT COALESCE(messages_sent, 0) INTO messages_sent_this_slot
    FROM message_rate_limits
    WHERE time_slot = current_time_slot;
    
    -- Calculate available slots
    available_slots := LEAST(batch_size, max_per_time_slot - COALESCE(messages_sent_this_slot, 0));
    
    -- Return nothing if we've hit the rate limit
    IF available_slots <= 0 THEN
        RETURN;
    END IF;
    
    -- Get messages to send, prioritizing by priority and scheduled time
    RETURN QUERY
    SELECT 
        mq.id as message_id,
        mq.user_id,
        mq.contact_id,
        c.email,
        mq.message_text,
        mq.scheduled_for
    FROM message_queue mq
    JOIN contacts c ON mq.contact_id = c.id
    JOIN notification_preferences np ON mq.user_id = np.user_id
    WHERE mq.status = 'queued'
    AND mq.scheduled_for <= NOW()
    AND mq.attempts < mq.max_attempts
    AND np.enabled = TRUE
    ORDER BY mq.priority ASC, mq.scheduled_for ASC
    LIMIT available_slots;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark message as processing/sent/failed
CREATE OR REPLACE FUNCTION update_message_status(
    p_message_id UUID,
    p_status VARCHAR(20),
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_time_slot TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Update message status
    UPDATE message_queue
    SET 
        status = p_status,
        error_message = p_error_message,
        attempts = CASE 
            WHEN p_status = 'failed' THEN attempts + 1
            ELSE attempts
        END,
        sent_at = CASE 
            WHEN p_status = 'sent' THEN NOW()
            ELSE sent_at
        END,
        updated_at = NOW()
    WHERE id = p_message_id;
    
    -- Update rate limit counter for sent messages
    IF p_status = 'sent' THEN
        current_time_slot := DATE_TRUNC('hour', NOW());
        
        INSERT INTO message_rate_limits (time_slot, messages_sent)
        VALUES (current_time_slot, 1)
        ON CONFLICT (time_slot)
        DO UPDATE SET messages_sent = message_rate_limits.messages_sent + 1;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user streaks
CREATE OR REPLACE FUNCTION calculate_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    current_date DATE := CURRENT_DATE;
    goal_per_week INTEGER;
BEGIN
    -- Get user's weekly goal
    SELECT users.goal_per_week INTO goal_per_week 
    FROM users 
    WHERE id = user_uuid;
    
    -- If no goal set, return 0
    IF goal_per_week IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate streak by checking each week backwards
    LOOP
        -- Get the start of the current week (Monday)
        DECLARE
            week_start DATE := DATE_TRUNC('week', current_date)::DATE;
            week_end DATE := week_start + INTERVAL '6 days';
            activities_this_week INTEGER;
        BEGIN
            -- Count activities for this week
            SELECT COUNT(*) INTO activities_this_week
            FROM run_logs
            WHERE user_id = user_uuid 
            AND date >= week_start 
            AND date <= week_end;
            
            -- If goal met, increment streak and go to previous week
            IF activities_this_week >= goal_per_week THEN
                streak_count := streak_count + 1;
                current_date := week_start - INTERVAL '1 day'; -- Go to previous week
            ELSE
                -- Streak broken, exit loop
                EXIT;
            END IF;
        END;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION schedule_accountability_message(UUID, UUID, TEXT, TIMESTAMP WITH TIME ZONE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_messages_to_send(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION update_message_status(UUID, VARCHAR, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION calculate_user_streak(UUID) TO authenticated;
