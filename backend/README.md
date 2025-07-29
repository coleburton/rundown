# Rundown Backend

Go backend service for handling Strava OAuth authentication and API integration.

## Setup

1. Install Go dependencies:
```bash
cd backend
go mod tidy
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `STRAVA_CLIENT_ID`: Your Strava application's client ID
- `STRAVA_CLIENT_SECRET`: Your Strava application's client secret

4. Set up PostgreSQL database:
```bash
createdb rundown_dev
```

5. Run the server:
```bash
go run main.go
```

The server will start on port 8080 by default.

## API Endpoints

### Authentication
- `POST /api/auth/strava/connect` - Connect Strava account
- `GET /api/auth/strava/user/:athlete_id` - Get Strava user info
- `DELETE /api/auth/strava/disconnect/:athlete_id` - Disconnect Strava account

### Strava Integration
- `GET /api/strava/activities/:athlete_id` - Get user activities
- `POST /api/strava/refresh-token/:athlete_id` - Refresh access token

### Health Check
- `GET /health` - Server health status