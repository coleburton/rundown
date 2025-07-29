# Strava Integration Setup Guide

This guide explains how to set up Strava authentication for the Rundown mobile app.

## Required Keys and Configuration

### 1. Strava API Application Setup

You need to create a Strava API application at: https://www.strava.com/settings/api

**Application Settings:**
- **Application Name**: Rundown (or your app name)
- **Website**: Your app's website URL
- **Authorization Callback Domain**: 
  - Development: `localhost`
  - Production: Your production domain (e.g., `rundown.app`)

**After creating the application, you'll receive:**
- **Client ID**: A numeric identifier for your app
- **Client Secret**: A secret key for server-side API calls

### 2. Mobile App Configuration

Create a `.env` file in your project root (copy from `.env.example`):

```bash
# Strava API Configuration
EXPO_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id_here
EXPO_PUBLIC_STRAVA_CLIENT_SECRET=your_strava_client_secret_here

# Backend Configuration  
EXPO_PUBLIC_BACKEND_URL=http://localhost:8080

# Development Settings
EXPO_PUBLIC_ENV=development
```

**Key Details:**
- `EXPO_PUBLIC_STRAVA_CLIENT_ID`: Your Strava app's Client ID
- `EXPO_PUBLIC_STRAVA_CLIENT_SECRET`: Your Strava app's Client Secret
- `EXPO_PUBLIC_BACKEND_URL`: URL of your Go backend service

### 3. Backend Configuration

Create a `.env` file in the `backend/` directory:

```bash
# Database
DATABASE_URL=postgres://localhost/rundown_dev?sslmode=disable

# Server
PORT=8080

# Strava API
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
```

### 4. Database Setup

The backend requires PostgreSQL. Create a database:

```bash
createdb rundown_dev
```

The backend will automatically create the required tables on startup.

## OAuth Flow Implementation

### Mobile App (React Native)
1. **Authentication Service** (`src/services/strava-auth.ts`):
   - Handles OAuth flow using `expo-auth-session`
   - Manages token storage and refresh
   - Communicates with backend

2. **Integration Points**:
   - `src/lib/mock-auth.ts`: Updated `connectStrava()` method
   - `src/screens/fitness-app-connect-screen.tsx`: UI for connection

### Backend (Go)
1. **Endpoints**:
   - `POST /api/auth/strava/connect`: Store user tokens after OAuth
   - `GET /api/auth/strava/user/:athlete_id`: Retrieve user data
   - `DELETE /api/auth/strava/disconnect/:athlete_id`: Remove connection
   - `GET /api/strava/activities/:athlete_id`: Fetch user activities
   - `POST /api/strava/refresh-token/:athlete_id`: Refresh expired tokens

2. **Database Schema**:
   - `strava_users` table stores tokens and athlete information

## Required Scopes

The app requests these Strava permissions:
- `read`: Access to public profile information
- `activity:read`: Access to activity data

## Security Considerations

1. **Client Secret**: Never expose in client-side code
2. **Token Storage**: Tokens are stored securely using AsyncStorage
3. **Token Refresh**: Automatic refresh when tokens expire
4. **HTTPS**: Use HTTPS in production for all API calls

## Testing the Integration

1. **Start Backend**:
   ```bash
   cd backend
   go run main.go
   ```

2. **Start Mobile App**:
   ```bash
   npm install
   npm run ios  # or npm run android
   ```

3. **Test Flow**:
   - Navigate to fitness app connection screen
   - Tap "Connect Strava"
   - Complete OAuth flow in browser
   - Verify connection in app

## Deployment Notes

### Production Environment Variables
- Update `EXPO_PUBLIC_BACKEND_URL` to your production backend URL
- Set production database URL in backend
- Configure Strava app's Authorization Callback Domain to your production domain

### App Store Requirements
- Update bundle identifiers in `app.config.js`
- Ensure proper app icons and splash screens are configured
- Test OAuth flow on physical devices

## Troubleshooting

### Common Issues:
1. **"Invalid redirect URI"**: Check Authorization Callback Domain in Strava settings
2. **Token expired**: Implement proper token refresh logic
3. **Database connection errors**: Verify PostgreSQL is running and accessible
4. **CORS issues**: Backend includes CORS middleware for development

### Debug Tools:
- Check network requests in React Native debugger
- Monitor backend logs for API call details
- Use Strava's API documentation for reference: https://developers.strava.com/docs/