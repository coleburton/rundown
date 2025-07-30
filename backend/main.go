package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type StravaTokenRequest struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
	Athlete      struct {
		ID        int    `json:"id"`
		Username  string `json:"username"`
		Firstname string `json:"firstname"`
		Lastname  string `json:"lastname"`
		Profile   string `json:"profile_medium"`
	} `json:"athlete"`
}

type StravaUser struct {
	ID           int       `json:"id"`
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	AthleteID    int       `json:"athlete_id"`
	Username     string    `json:"username"`
	Firstname    string    `json:"firstname"`
	Lastname     string    `json:"lastname"`
	Profile      string    `json:"profile"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type StravaWebhookEvent struct {
	ObjectType   string                 `json:"object_type"`
	ObjectID     int64                  `json:"object_id"`
	AspectType   string                 `json:"aspect_type"`
	Updates      map[string]interface{} `json:"updates"`
	OwnerID      int                    `json:"owner_id"`
	EventTime    int64                  `json:"event_time"`
}

type StravaWebhookSubscription struct {
	ID          int    `json:"id"`
	CallbackURL string `json:"callback_url"`
	VerifyToken string `json:"verify_token"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type Server struct {
	db *sql.DB
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Database connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://localhost/rundown_dev?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Printf("Warning: Database connection failed: %v", err)
		log.Println("Running in no-database mode for testing...")
	}

	server := &Server{db: db}

	// Initialize database tables
	if err := server.initDB(); err != nil {
		log.Printf("Warning: Failed to initialize database: %v", err)
		log.Println("Database operations will be disabled...")
	}

	// Initialize Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Routes
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/strava/connect", server.handleStravaConnect)
			auth.GET("/strava/user/:athlete_id", server.handleGetStravaUser)
			auth.DELETE("/strava/disconnect/:athlete_id", server.handleStravaDisconnect)
		}
		
		strava := api.Group("/strava")
		{
			strava.GET("/activities/:athlete_id", server.handleGetActivities)
			strava.POST("/refresh-token/:athlete_id", server.handleRefreshToken)
		}

		webhooks := api.Group("/webhooks")
		{
			webhooks.GET("/strava", server.handleStravaWebhookValidation)
			webhooks.POST("/strava", server.handleStravaWebhookEvent)
			webhooks.POST("/strava/subscribe", server.handleStravaWebhookSubscribe)
			webhooks.DELETE("/strava/unsubscribe", server.handleStravaWebhookUnsubscribe)
		}
	}

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func (s *Server) initDB() error {
	query := `
	CREATE TABLE IF NOT EXISTS strava_users (
		id SERIAL PRIMARY KEY,
		access_token TEXT NOT NULL,
		refresh_token TEXT NOT NULL,
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
		athlete_id INTEGER UNIQUE NOT NULL,
		username VARCHAR(255),
		firstname VARCHAR(255),
		lastname VARCHAR(255),
		profile TEXT,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_strava_users_athlete_id ON strava_users(athlete_id);

	CREATE TABLE IF NOT EXISTS strava_webhook_events (
		id SERIAL PRIMARY KEY,
		object_type VARCHAR(50) NOT NULL,
		object_id BIGINT NOT NULL,
		aspect_type VARCHAR(50) NOT NULL,
		updates JSONB,
		owner_id INTEGER NOT NULL,
		event_time TIMESTAMP WITH TIME ZONE NOT NULL,
		processed BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_strava_webhook_events_owner_id ON strava_webhook_events(owner_id);
	CREATE INDEX IF NOT EXISTS idx_strava_webhook_events_processed ON strava_webhook_events(processed);
	`

	_, err := s.db.Exec(query)
	return err
}

func (s *Server) handleStravaConnect(c *gin.Context) {
	var req StravaTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Convert Unix timestamp to time.Time
	expiresAt := time.Unix(req.ExpiresAt, 0)

	// Insert or update user in database
	query := `
	INSERT INTO strava_users (access_token, refresh_token, expires_at, athlete_id, username, firstname, lastname, profile, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
	ON CONFLICT (athlete_id) 
	DO UPDATE SET 
		access_token = EXCLUDED.access_token,
		refresh_token = EXCLUDED.refresh_token,
		expires_at = EXCLUDED.expires_at,
		username = EXCLUDED.username,
		firstname = EXCLUDED.firstname,
		lastname = EXCLUDED.lastname,
		profile = EXCLUDED.profile,
		updated_at = NOW()
	RETURNING id, created_at, updated_at
	`

	var id int
	var createdAt, updatedAt time.Time
	err := s.db.QueryRow(query,
		req.AccessToken,
		req.RefreshToken,
		expiresAt,
		req.Athlete.ID,
		req.Athlete.Username,
		req.Athlete.Firstname,
		req.Athlete.Lastname,
		req.Athlete.Profile,
	).Scan(&id, &createdAt, &updatedAt)

	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user data"})
		return
	}

	user := StravaUser{
		ID:           id,
		AccessToken:  req.AccessToken,
		RefreshToken: req.RefreshToken,
		ExpiresAt:    expiresAt,
		AthleteID:    req.Athlete.ID,
		Username:     req.Athlete.Username,
		Firstname:    req.Athlete.Firstname,
		Lastname:     req.Athlete.Lastname,
		Profile:      req.Athlete.Profile,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully connected to Strava",
		"user":    user,
	})
}

func (s *Server) handleGetStravaUser(c *gin.Context) {
	athleteIDStr := c.Param("athlete_id")
	athleteID, err := strconv.Atoi(athleteIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid athlete ID"})
		return
	}

	query := `
	SELECT id, access_token, refresh_token, expires_at, athlete_id, username, firstname, lastname, profile, created_at, updated_at
	FROM strava_users WHERE athlete_id = $1
	`

	var user StravaUser
	err = s.db.QueryRow(query, athleteID).Scan(
		&user.ID,
		&user.AccessToken,
		&user.RefreshToken,
		&user.ExpiresAt,
		&user.AthleteID,
		&user.Username,
		&user.Firstname,
		&user.Lastname,
		&user.Profile,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	} else if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user data"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (s *Server) handleStravaDisconnect(c *gin.Context) {
	athleteIDStr := c.Param("athlete_id")
	athleteID, err := strconv.Atoi(athleteIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid athlete ID"})
		return
	}

	query := `DELETE FROM strava_users WHERE athlete_id = $1`
	result, err := s.db.Exec(query, athleteID)
	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disconnect user"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully disconnected from Strava"})
}

func (s *Server) handleGetActivities(c *gin.Context) {
	athleteIDStr := c.Param("athlete_id")
	athleteID, err := strconv.Atoi(athleteIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid athlete ID"})
		return
	}

	// Get user's access token
	var accessToken string
	var expiresAt time.Time
	query := `SELECT access_token, expires_at FROM strava_users WHERE athlete_id = $1`
	err = s.db.QueryRow(query, athleteID).Scan(&accessToken, &expiresAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	} else if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user data"})
		return
	}

	// Check if token is expired and refresh if needed
	if time.Now().After(expiresAt) {
		// Token refresh logic would go here
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired, please refresh"})
		return
	}

	// Fetch activities from Strava API
	client := &http.Client{}
	req, err := http.NewRequest("GET", "https://www.strava.com/api/v3/athlete/activities", nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activities"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(resp.StatusCode, gin.H{"error": "Failed to fetch activities from Strava"})
		return
	}

	var activities []interface{}
	if err := json.NewDecoder(resp.Body).Decode(&activities); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode activities"})
		return
	}

	c.JSON(http.StatusOK, activities)
}

func (s *Server) handleRefreshToken(c *gin.Context) {
	athleteIDStr := c.Param("athlete_id")
	athleteID, err := strconv.Atoi(athleteIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid athlete ID"})
		return
	}

	// Get user's refresh token
	var refreshToken string
	query := `SELECT refresh_token FROM strava_users WHERE athlete_id = $1`
	err = s.db.QueryRow(query, athleteID).Scan(&refreshToken)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	} else if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user data"})
		return
	}

	// Refresh token with Strava
	client := &http.Client{}
	refreshReq := map[string]interface{}{
		"client_id":     os.Getenv("STRAVA_CLIENT_ID"),
		"client_secret": os.Getenv("STRAVA_CLIENT_SECRET"),
		"refresh_token": refreshToken,
		"grant_type":    "refresh_token",
	}

	reqBody, _ := json.Marshal(refreshReq)
	req, err := http.NewRequest("POST", "https://www.strava.com/oauth/token", 
		bytes.NewBuffer(reqBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create refresh request"})
		return
	}

	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to refresh token"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(resp.StatusCode, gin.H{"error": "Failed to refresh token with Strava"})
		return
	}

	var tokenResp struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresAt    int64  `json:"expires_at"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode token response"})
		return
	}

	// Update tokens in database
	expiresAt := time.Unix(tokenResp.ExpiresAt, 0)
	updateQuery := `
	UPDATE strava_users 
	SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW()
	WHERE athlete_id = $4
	`

	_, err = s.db.Exec(updateQuery, tokenResp.AccessToken, tokenResp.RefreshToken, expiresAt, athleteID)
	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tokens"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Token refreshed successfully",
		"access_token": tokenResp.AccessToken,
		"expires_at":   tokenResp.ExpiresAt,
	})
}

func (s *Server) handleStravaWebhookValidation(c *gin.Context) {
	hubMode := c.Query("hub.mode")
	hubChallenge := c.Query("hub.challenge")
	hubVerifyToken := c.Query("hub.verify_token")

	expectedVerifyToken := os.Getenv("STRAVA_WEBHOOK_VERIFY_TOKEN")
	if expectedVerifyToken == "" {
		expectedVerifyToken = "rundown_strava_webhook_2024"
	}

	if hubMode == "subscribe" && hubVerifyToken == expectedVerifyToken {
		log.Printf("Webhook validation successful for challenge: %s", hubChallenge)
		c.JSON(http.StatusOK, gin.H{"hub.challenge": hubChallenge})
		return
	}

	log.Printf("Webhook validation failed - mode: %s, verify_token: %s", hubMode, hubVerifyToken)
	c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
}

func (s *Server) handleStravaWebhookEvent(c *gin.Context) {
	var event StravaWebhookEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		log.Printf("Invalid webhook payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook payload"})
		return
	}

	log.Printf("Received Strava webhook event: %+v", event)

	updatesJSON, _ := json.Marshal(event.Updates)
	eventTime := time.Unix(event.EventTime, 0)

	query := `
	INSERT INTO strava_webhook_events (object_type, object_id, aspect_type, updates, owner_id, event_time)
	VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := s.db.Exec(query,
		event.ObjectType,
		event.ObjectID,
		event.AspectType,
		string(updatesJSON),
		event.OwnerID,
		eventTime,
	)

	if err != nil {
		log.Printf("Failed to store webhook event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store event"})
		return
	}

	go s.processWebhookEvent(event)

	c.JSON(http.StatusOK, gin.H{"message": "Event received"})
}

func (s *Server) processWebhookEvent(event StravaWebhookEvent) {
	log.Printf("Processing webhook event: %s %s for owner %d", event.ObjectType, event.AspectType, event.OwnerID)

	switch event.ObjectType {
	case "activity":
		s.processActivityEvent(event)
	case "athlete":
		s.processAthleteEvent(event)
	default:
		log.Printf("Unknown object type: %s", event.ObjectType)
	}
}

func (s *Server) processActivityEvent(event StravaWebhookEvent) {
	switch event.AspectType {
	case "create":
		log.Printf("New activity created: %d for athlete %d", event.ObjectID, event.OwnerID)
	case "update":
		log.Printf("Activity updated: %d for athlete %d, updates: %+v", event.ObjectID, event.OwnerID, event.Updates)
	case "delete":
		log.Printf("Activity deleted: %d for athlete %d", event.ObjectID, event.OwnerID)
	}
}

func (s *Server) processAthleteEvent(event StravaWebhookEvent) {
	switch event.AspectType {
	case "update":
		if event.Updates["authorized"] == "false" {
			log.Printf("Athlete %d deauthorized the app", event.OwnerID)
			query := `DELETE FROM strava_users WHERE athlete_id = $1`
			_, err := s.db.Exec(query, event.OwnerID)
			if err != nil {
				log.Printf("Failed to remove deauthorized athlete: %v", err)
			} else {
				log.Printf("Removed deauthorized athlete %d from database", event.OwnerID)
			}
		}
	}
}

func (s *Server) handleStravaWebhookSubscribe(c *gin.Context) {
	callbackURL := c.Query("callback_url")
	if callbackURL == "" {
		callbackURL = os.Getenv("WEBHOOK_CALLBACK_URL")
		if callbackURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "callback_url is required"})
			return
		}
	}

	verifyToken := os.Getenv("STRAVA_WEBHOOK_VERIFY_TOKEN")
	if verifyToken == "" {
		verifyToken = "rundown_strava_webhook_2024"
	}

	client := &http.Client{}
	subscribeReq := map[string]interface{}{
		"client_id":     os.Getenv("STRAVA_CLIENT_ID"),
		"client_secret": os.Getenv("STRAVA_CLIENT_SECRET"),
		"callback_url":  callbackURL,
		"verify_token":  verifyToken,
	}

	reqBody, _ := json.Marshal(subscribeReq)
	req, err := http.NewRequest("POST", "https://www.strava.com/api/v3/push_subscriptions",
		bytes.NewBuffer(reqBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subscription request"})
		return
	}

	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subscription"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := json.Marshal(resp.Body)
		log.Printf("Subscription failed with status %d: %s", resp.StatusCode, string(body))
		c.JSON(resp.StatusCode, gin.H{"error": "Failed to create subscription with Strava"})
		return
	}

	var subscription StravaWebhookSubscription
	if err := json.NewDecoder(resp.Body).Decode(&subscription); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode subscription response"})
		return
	}

	log.Printf("Successfully created Strava webhook subscription: %+v", subscription)
	c.JSON(http.StatusOK, gin.H{
		"message":      "Webhook subscription created successfully",
		"subscription": subscription,
	})
}

func (s *Server) handleStravaWebhookUnsubscribe(c *gin.Context) {
	subscriptionID := c.Query("subscription_id")
	if subscriptionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "subscription_id is required"})
		return
	}

	client := &http.Client{}
	req, err := http.NewRequest("DELETE",
		"https://www.strava.com/api/v3/push_subscriptions/"+subscriptionID,
		nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create unsubscribe request"})
		return
	}

	q := req.URL.Query()
	q.Add("client_id", os.Getenv("STRAVA_CLIENT_ID"))
	q.Add("client_secret", os.Getenv("STRAVA_CLIENT_SECRET"))
	req.URL.RawQuery = q.Encode()

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unsubscribe"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		c.JSON(resp.StatusCode, gin.H{"error": "Failed to unsubscribe from Strava"})
		return
	}

	log.Printf("Successfully unsubscribed from Strava webhook subscription: %s", subscriptionID)
	c.JSON(http.StatusOK, gin.H{"message": "Successfully unsubscribed from webhook"})
}