# DeltaSpec API Documentation

This document provides a comprehensive overview of the DeltaSpec API endpoints.

## Base URL
All API endpoints are prefixed with `/api` unless otherwise noted.

## Authentication
Most endpoints require authentication using a Bearer Token.
Header: `Authorization: Bearer <access_token>`

## 1. Authentication Routes (`/api/auth`)

### Get Auth Configuration
- **Endpoint:** `GET /api/auth/config`
- **Description:** Returns the current authentication strategy and configuration.
- **Auth Required:** No
- **Response:**
  ```json
  {
    "strategy": "email" | "pythagora_oauth",
    "oauth": { ... } // Optional, if strategy is oauth
  }
  ```

### Login
- **Endpoint:** `POST /api/auth/login`
- **Description:** Authenticate a user with email and password.
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "_id": "...",
    "email": "...",
    "role": "user",
    "accessToken": "...",
    "refreshToken": "..."
  }
  ```

### Register
- **Endpoint:** `POST /api/auth/register`
- **Description:** Register a new user.
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:** Returns the created user object with tokens (same as login).

### Logout
- **Endpoint:** `POST /api/auth/logout`
- **Description:** Logs out the current user and invalidates the refresh token.
- **Auth Required:** Yes
- **Response:**
  ```json
  {
    "message": "User logged out successfully."
  }
  ```

### Refresh Token
- **Endpoint:** `POST /api/auth/refresh`
- **Description:** Get a new access token using a refresh token.
- **Auth Required:** No (uses refresh token in body)
- **Request Body:**
  ```json
  {
    "refreshToken": "..."
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "...",
      "refreshToken": "...",
      ...userFields
    }
  }
  ```

### Get Current User
- **Endpoint:** `GET /api/auth/me`
- **Description:** Get details of the currently authenticated user.
- **Auth Required:** Yes
- **Response:** User object.

### OAuth Exchange (If enabled)
- **Endpoint:** `POST /api/auth/oauth/exchange`
- **Description:** Exchange an OAuth code for tokens.
- **Request Body:** `{ "code": "...", "redirectUri": "..." }`

---

## 2. LLM / AI Routes (`/api/llm`)

### Send Chat Message
- **Endpoint:** `POST /api/llm/chat`
- **Description:** Send a message to the AI trading assistant.
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "message": "Should I buy BTC?",
    "symbol": "BTCUSDT" // Optional
  }
  ```
- **Response:**
  ```json
  {
    "message": {
      "id": "...",
      "role": "assistant",
      "content": "...",
      "metadata": { ... }
    }
  }
  ```

### Get Trading Guidance
- **Endpoint:** `GET /api/llm/guidance`
- **Description:** Get comprehensive AI-generated trading guidance for a symbol.
- **Auth Required:** Yes
- **Query Params:** `symbol` (e.g., `?symbol=BTCUSDT`)
- **Response:**
  ```json
  {
    "guidance": {
      "analysis": { ... },
      "recommendations": { ... },
      "risks": { ... }
    }
  }
  ```

### Get Market Insights
- **Endpoint:** `GET /api/llm/insights`
- **Description:** Get quick AI-generated market insights.
- **Auth Required:** Yes
- **Query Params:** `symbol` (optional), `limit` (default: 4)
- **Response:**
  ```json
  {
    "insights": [
      { "type": "sentiment", "title": "...", ... }
    ]
  }
  ```

### Get Chat History
- **Endpoint:** `GET /api/llm/history`
- **Description:** Get the conversation history with the AI assistant.
- **Auth Required:** Yes
- **Query Params:** `limit` (default: 50)
- **Response:**
  ```json
  {
    "messages": [ ... ]
  }
  ```

---

## 3. Data Routes (`/api/data`)

### Get Recent Trades
- **Endpoint:** `GET /api/data/trades`
- **Description:** Fetch recent trades from Redis stream `delta_trades`.
- **Auth Required:** Yes
- **Response:** Array of trade objects.

### Get Tickers
- **Endpoint:** `GET /api/data/tickers`
- **Description:** Fetch ticker updates from Redis stream `delta_tickers`.
- **Auth Required:** Yes
- **Response:** Array of ticker objects.

---

## 4. Basic Routes

### Root
- **Endpoint:** `GET /`
- **Description:** Health check / Welcome message.
- **Response:** "Welcome to Your Website!"

### Ping
- **Endpoint:** `GET /ping`
- **Description:** Simple health check.
- **Response:** "pong"