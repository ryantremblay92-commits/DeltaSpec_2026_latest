# DeltaSpec Backend Architecture

This document outlines the architecture of the DeltaSpec backend system, which handles real-time data streaming, user authentication, and AI-powered trading analysis.

## System Overview

The backend is built using **Node.js** with **TypeScript** and **Express**. It acts as the central hub connecting the frontend client, the data collector (Python), the database (MongoDB), and the caching layer (Redis).

### Core Technologies
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (User data, LLM history)
- **Cache/Stream:** Redis (Real-time market data, Pub/Sub)
- **Real-time:** Socket.io (Frontend updates)
- **AI Integration:** OpenAI / Anthropic SDKs

---

## Architecture Components

### 1. API Server (`server/server.ts`)
The entry point of the application. It initializes:
- **Express App:** Handles HTTP requests.
- **Socket.io Server:** Manages real-time WebSocket connections with the frontend.
- **Database Connection:** Connects to MongoDB.
- **Redis Stream Service:** Consumes market data from Redis streams and broadcasts to Socket.io clients.

### 2. Services Layer (`server/services/`)
Contains the business logic of the application.

- **`redisStreamService.ts`**:
  - Connects to Redis.
  - Subscribes to Redis Streams populated by the Data Collector (`delta_trades`, `delta_tickers`, etc.).
  - Broadcasts new data to connected Socket.io clients.
  - Bridges the Python Data Collector and the React Frontend.

- **`llmService.ts`**:
  - Wraps interactions with external AI providers (OpenAI, Anthropic).
  - Handles API requests, retries, and error handling.
  - Provides a unified interface `sendLLMRequest` for other services.

- **`llmController.ts`**:
  - Orchestrates AI features.
  - Manages chat history and context.
  - Generates prompts for analysis and chat.
  - Parses AI responses into structured JSON for the frontend.
  - Implements fallback logic if AI providers are unavailable.

- **`userService.ts`**:
  - Manages user authentication, registration, and profile retrieval.

### 3. Data Flow

#### Real-time Market Data
1. **Source:** External Crypto Exchange (Delta Exchange).
2. **Ingestion:** Python Data Collector (`data-collector/redis_data_collector.py`) connects via WebSocket.
3. **Buffer:** Data Collector pushes normalized data to **Redis Streams** (`delta_trades`, `delta_tickers`, `delta_orderbook`, etc.).
4. **Consumption:** Backend `RedisStreamService` listens to these Redis Streams.
5. **Distribution:** Backend emits data via **Socket.io** to the Frontend.
6. **Visualization:** Frontend updates charts and order books in real-time.

#### AI Analysis Flow
1. **Request:** User requests guidance or sends a chat message via Frontend.
2. **API Call:** Frontend calls `/api/llm/*` endpoints.
3. **Controller:** `LLMController` retrieves context (history, market data) and constructs a prompt.
4. **LLM:** `LLMService` sends the prompt to OpenAI/Anthropic.
5. **Response:** The AI response is parsed, saved to MongoDB (for history), and sent back to the Frontend.

### 4. Database Schema (MongoDB)

- **User:** Authentication details, roles, preferences.
- **LLMConversation:** Stores chat history between users and the AI assistant.
  - Indexed by `userId` and `symbol`.
- **LLMGuidance:** Stores generated trading analysis and recommendations.
  - Structured data (sentiment, entry/exit prices, risks).

### 5. Authentication
- **JWT (JSON Web Tokens):** Used for stateless authentication.
- **Access Tokens:** Short-lived tokens for API access.
- **Refresh Tokens:** Long-lived tokens to obtain new access tokens.
- **Middleware:** `requireUser` middleware protects routes and injects user context.

---

## Directory Structure
```
server/
├── config/         # Database and app configuration
├── models/         # Mongoose schemas (User, LLMConversation, etc.)
├── routes/         # API Route definitions
│   ├── middlewares/ # Auth middleware
│   ├── authRoutes.ts
│   ├── dataRoutes.ts
│   └── llmRoutes.ts
├── services/       # Business logic (LLM, Redis, User)
├── utils/          # Helper functions
└── server.ts       # App entry point