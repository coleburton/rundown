# Rundown Mobile - Message System Design

## Overview

This document outlines the messaging system design for the Rundown fitness accountability app, including user preferences, scheduling, load balancing, and Twilio integration.

## System Architecture

### 1. User Preference System

Users can configure when and how they want accountability messages sent through the `notification_preferences` table:

- **send_day**: Day of the week (e.g., "Sunday")
- **send_time**: Time of day (e.g., "18:00:00")
- **timezone**: User's timezone (default: "UTC")
- **send_if_goal_met**: Send congratulatory messages when goals are achieved
- **send_if_partial_goal**: Send encouragement for partial progress
- **max_messages_per_week**: Limit frequency (default: 1)
- **enabled**: Global toggle for notifications

### 2. Message Queue System

The `message_queue` table serves as a centralized queue for all outbound messages:

- **Queued messages**: Scheduled for future delivery
- **Priority system**: 1 (high), 2 (medium), 3 (low)
- **Retry logic**: Failed messages are retried up to `max_attempts`
- **Status tracking**: queued → processing → sent/failed

### 3. Load Balancing Strategy

#### Rate Limiting
- `message_rate_limits` table tracks messages sent per hour
- Configurable limits (default: 100 messages/hour) based on Twilio plan
- Prevents overwhelming Twilio API and avoid rate limit errors

#### Time Distribution
- Messages scheduled throughout the day based on user preferences
- Automatic spreading for high-volume days (e.g., Sunday evening)
- Priority-based processing (coaches get higher priority)

#### Batch Processing
- Messages processed in batches of 50
- Parallel processing with controlled concurrency
- Graceful error handling and retry logic

## Workflow

### 1. Message Scheduling (Daily Cron Job)

The `message-scheduler` function runs daily and:

1. **Identifies users** with notifications enabled for the current day
2. **Evaluates progress** against weekly goals
3. **Determines message type**:
   - Accountability (missed goals)
   - Congratulatory (goals achieved)
4. **Schedules messages** in the queue with appropriate timing and priority

### 2. Message Processing (Frequent Cron Job)

The `message-sender` function runs every 5-10 minutes and:

1. **Fetches queued messages** respecting rate limits
2. **Sends SMS** via Twilio API
3. **Updates status** and logs results
4. **Handles retries** for transient failures

## Database Schema

### Core Tables

```sql
-- Message queue with load balancing
CREATE TABLE message_queue (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    contact_id UUID REFERENCES contacts(id),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    message_text TEXT,
    priority INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'queued',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3
);

-- Rate limiting
CREATE TABLE message_rate_limits (
    time_slot TIMESTAMP WITH TIME ZONE UNIQUE,
    messages_sent INTEGER DEFAULT 0,
    max_messages_per_slot INTEGER DEFAULT 100
);

-- User preferences
CREATE TABLE notification_preferences (
    user_id UUID REFERENCES users(id),
    send_day VARCHAR(10) DEFAULT 'Sunday',
    send_time TIME DEFAULT '18:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    send_if_goal_met BOOLEAN DEFAULT FALSE,
    max_messages_per_week INTEGER DEFAULT 1,
    enabled BOOLEAN DEFAULT TRUE
);
```

### Key Functions

- `schedule_accountability_message()`: Adds messages to queue
- `get_messages_to_send()`: Fetches next batch with rate limiting
- `update_message_status()`: Updates message status and rate counters

## Load Balancing Features

### 1. Time-Based Distribution
- Users can select preferred send times
- Automatic spreading when too many users choose the same time
- Priority queuing (coaches > friends/family)

### 2. Rate Limiting
- Hourly message caps based on Twilio plan
- Dynamic adjustment based on current usage
- Queuing overflow for high-volume periods

### 3. Retry Logic
- Automatic retries for transient failures
- Exponential backoff for rate limit errors
- Permanent failure detection (invalid numbers, etc.)

### 4. Priority System
- **High (1)**: Messages to coaches
- **Medium (2)**: Congratulatory messages
- **Low (3)**: Standard accountability messages

## Twilio Integration

### Environment Variables Required
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### Message Templates

Three message styles supported:
- **Supportive**: Encouraging and positive
- **Snarky**: Playfully teasing
- **Chaotic**: Energetic and dramatic

Each style has both accountability and congratulatory variants.

## Deployment

### Supabase Edge Functions

1. **message-scheduler**: Deploy as daily cron job
2. **message-sender**: Deploy as frequent cron job (every 5-10 minutes)

### Cron Job Configuration

```bash
# Schedule message evaluation (daily at 6 AM UTC)
0 6 * * * curl -X POST https://your-project.supabase.co/functions/v1/message-scheduler

# Process message queue (every 10 minutes)
*/10 * * * * curl -X POST https://your-project.supabase.co/functions/v1/message-sender
```

## Monitoring & Analytics

### Key Metrics to Track
- Messages sent per day/hour
- Delivery success rates
- User engagement with notifications
- Queue depth and processing times
- Rate limit utilization

### Dashboard Queries
```sql
-- Daily message volume
SELECT DATE(sent_at), COUNT(*) 
FROM messages 
WHERE status = 'sent' 
GROUP BY DATE(sent_at);

-- Success rates by message style
SELECT u.message_style, 
       COUNT(CASE WHEN m.status = 'sent' THEN 1 END) as sent,
       COUNT(CASE WHEN m.status = 'failed' THEN 1 END) as failed
FROM messages m
JOIN users u ON m.user_id = u.id
GROUP BY u.message_style;
```

## Future Enhancements

1. **Smart Scheduling**: ML-based optimization of send times
2. **A/B Testing**: Test different message templates
3. **User Feedback**: Allow users to rate message effectiveness
4. **Multi-Channel**: Add email/push notification options
5. **Advanced Analytics**: Delivery tracking and user engagement metrics