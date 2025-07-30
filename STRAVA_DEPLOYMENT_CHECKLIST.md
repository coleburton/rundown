# Strava Webhook Deployment Checklist

## Overview
This document outlines the remaining steps needed to receive Strava webhook events in production. All webhook handling code is already implemented - only deployment and configuration remain.

## ✅ Already Implemented
- [x] Webhook endpoints (`/api/webhooks/strava`)
- [x] Event processing logic (activity/athlete events)
- [x] Database schema (strava_webhook_events table)
- [x] Webhook validation (hub.challenge response)
- [x] Subscription management endpoints
- [x] OAuth 2.0 authentication flow
- [x] Token management with auto-refresh
- [x] Frontend authentication screens

## ❌ Still Needed for Production

### 1. Database Setup
- [ ] **Set up PostgreSQL database**
  - Create production database instance
  - Run existing schema migrations
  - Configure connection string in `.env`
  - Test database connectivity

### 2. Server Deployment
- [ ] **Deploy Go backend to public server**
  - Choose hosting platform (Railway, Render, Fly.io, etc.)
  - Configure environment variables
  - Ensure server runs on public HTTPS URL
  - Test health endpoint accessibility

### 3. Webhook Configuration
- [ ] **Configure webhook callback URL**
  - Update `WEBHOOK_CALLBACK_URL` in environment
  - Format: `https://yourdomain.com/api/webhooks/strava`
  - Must be publicly accessible over HTTPS

### 4. Strava App Configuration
- [ ] **Update Strava app settings**
  - Go to https://www.strava.com/settings/api
  - Set Authorization Callback Domain for OAuth
  - Note down Client ID and Client Secret

### 5. Create Webhook Subscription
- [ ] **Subscribe to Strava webhooks**
  - Call your `/api/webhooks/strava/subscribe` endpoint
  - Or use Strava's API directly:
    ```bash
    curl -X POST https://www.strava.com/api/v3/push_subscriptions \
      -F client_id=YOUR_CLIENT_ID \
      -F client_secret=YOUR_CLIENT_SECRET \
      -F callback_url=https://yourdomain.com/api/webhooks/strava \
      -F verify_token=rundown_strava_webhook_2024
    ```

### 6. Environment Variables
Ensure these are set in production:
```bash
# Strava Configuration
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=rundown_strava_webhook_2024

# Database
DATABASE_URL=postgres://user:pass@host:port/database

# Webhook
WEBHOOK_CALLBACK_URL=https://yourdomain.com/api/webhooks/strava

# Server
PORT=8080
```

## Testing Checklist

### Pre-deployment Testing
- [ ] Test webhook validation endpoint locally
- [ ] Verify database operations work
- [ ] Test OAuth flow with real Strava credentials

### Post-deployment Testing
- [ ] Verify webhook endpoint responds to validation
- [ ] Test full OAuth flow from mobile app
- [ ] Create test activity in Strava to verify webhook delivery
- [ ] Check database for received webhook events

## Webhook Event Flow (Once Deployed)

1. **User authenticates** → Tokens stored in database
2. **User creates/updates activity in Strava** → Strava sends webhook
3. **Your server receives webhook** → Event stored in `strava_webhook_events`
4. **Event processed** → Application logic handles the activity data

## Expected Webhook Events

### Activity Events
- `create` - New activity uploaded
- `update` - Activity modified (title, type, privacy)
- `delete` - Activity removed

### Athlete Events  
- `update` with `authorized: false` - User deauthorized app

## Monitoring & Maintenance

### Once Live
- [ ] Monitor webhook delivery success rates
- [ ] Set up logging for failed webhook processing
- [ ] Monitor database growth and performance
- [ ] Handle token refresh for expired access tokens

### Error Handling
- Webhook delivery failures (Strava retries for 24 hours)
- Database connectivity issues
- Token expiration and refresh failures
- Rate limiting from Strava API

## File Locations

### Backend Code
- Main server: `backend/main.go`
- Webhook handlers: Lines 463-655 in `main.go`

### Frontend Code  
- Auth screen: `src/screens/fitness-app-connect-screen.tsx`
- Auth service: `src/services/strava-auth.ts`
- Connection component: `src/components/StravaConnectionStatus.tsx`

### Database Schema
- Webhook events table: `strava_webhook_events` (auto-created)
- User tokens table: `strava_users` (auto-created)

## Success Criteria

✅ **System working when:**
- Users can authenticate with Strava from mobile app
- Webhook validation passes Strava's verification
- Activity events appear in database within seconds of Strava changes
- Token refresh happens automatically before expiration
- Users can disconnect and reconnect seamlessly

---

*This checklist assumes all implementation is complete and only deployment/configuration remains.*