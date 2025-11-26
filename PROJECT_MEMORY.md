# DeltaTradeHub - Complete Project Memory

**Last Updated**: November 26, 2025  
**Project**: Real-Time Crypto Order Flow Analysis Platform  
**Repository**: DeltaTradeHub-6517e37  
**Owner**: ryantremblay92-commits  
**Branch**: main

---

## Executive Summary

DeltaTradeHub is a comprehensive real-time cryptocurrency trading analysis platform built with a modern microservices architecture. It provides traders with advanced order flow metrics, delta analysis, AI-powered guidance, and professional-grade visualizations.

**Tech Stack**: React 18 (Frontend) + Node.js Express (Backend) + Python (Data Collector)  
**Databases**: MongoDB (persistence) + Redis (real-time streams)  
**Real-time**: Socket.io + WebSocket + Redis Streams  
**AI**: OpenAI/Anthropic LLM integration with MCP support

---

## Architecture Overview

```
Exchange (WebSocket)
    ↓
Python Data Collector (redis_data_collector.py)
    ↓ (WebSocket → normalization → analytics)
Redis Streams (6 channels)
    ↓ (RedisStreamService listens)
Node.js Backend (Express)
    ↓ (Socket.io)
React Frontend
    ↓
User Dashboard & Analysis Views
```

### Components

**Frontend** (`client/`)
- React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- 6 main trading views with real-time updates
- Socket.io client for live data
- JWT-based authentication
- Responsive dashboard with dark/light themes

**Backend** (`server/`)
- Express.js REST API
- MongoDB schemas (User, LLMConversation, LLMGuidance)
- Redis Stream consumer (RedisStreamService)
- LLM integration (OpenAI/Anthropic)
- JWT authentication middleware
- Socket.io server for real-time broadcasts

**Data Collector** (`data-collector/`)
- Python WebSocket client to Delta Exchange
- Real-time market data ingestion
- Analytics calculations (Footprint, CVD, Pressure)
- Redis Stream publisher
- SQLite for historical data

---

## Frontend - 6 Main Views

### 1. Live Data View
**Components**: Price overview, timeframe selector (1m-1d), chart placeholder, live trades feed  
**Features**: Real-time price updates, buy/sell color-coding, volume display  
**Data**: Current price, 24h change, trading volume, recent trades

### 2. Delta Analysis View
**Components**: 4 metric cards, control panel, progress bars, trend indicators  
**Metrics**: Cumulative Delta, Buy Volume, Sell Volume, Net Delta  
**Controls**: Lookback period, method selector, sensitivity adjustment

### 3. Footprint View
**Components**: Heatmap visualization, filter sliders, statistics panel  
**Filters**: Intensity (0-100), minimum volume threshold  
**Data**: Price levels, volume distribution, highest/average volumes  
**Export**: CSV/JSON download button

### 4. Volume Profile View
**Components**: Profile selector, 4 key level cards, horizontal bar chart  
**Levels**: POC (Point of Control), VAH (Value Area High), VAL (Value Area Low), VWAP  
**Controls**: Profile type, value area percentage adjustment  
**Styling**: Gradient backgrounds, color-coded cards

### 5. Signals View
**Components**: Filter system, performance metrics, active signals grid, history table  
**Filters**: Type (All/Buy/Sell/Warning), Sensitivity (Low/Medium/High)  
**Metrics**: Win rate %, avg gain, total signals, active now  
**Display**: 3-column grid for active signals, paginated history

### 6. Export Data View
**Components**: Data selector, format chooser, date picker, progress bar, history  
**Data Types**: Trades, Order Book, Delta, Signals  
**Formats**: CSV, JSON  
**Features**: Custom date range, previous exports list, download links

---

## Backend - API Endpoints

### Authentication (`/api/auth`)
```
GET  /api/auth/config              → Authentication strategy
POST /api/auth/login               → Login (email, password)
POST /api/auth/register            → Register (email, password)
POST /api/auth/logout              → Logout (invalidate tokens)
POST /api/auth/refresh             → Get new access token
GET  /api/auth/me                  → Current user profile
POST /api/auth/oauth/exchange      → OAuth code exchange
```

### LLM/AI (`/api/llm`)
```
POST /api/llm/chat                 → Send message to AI (message, symbol)
GET  /api/llm/guidance?symbol=X    → Get trading guidance
GET  /api/llm/insights?symbol=X    → Get quick market insights
GET  /api/llm/history?limit=50     → Get chat history
```

### Data (`/api/data`)
```
GET /api/data/trades               → Recent trades from Redis
GET /api/data/tickers              → Ticker updates
```

### Basic
```
GET /                               → Welcome message
GET /ping                           → Health check
```

---

## Redis Streams (Real-Time Channels)

Data Collector publishes to these streams; Backend subscribes and broadcasts via Socket.io:

1. `delta_trades` - Individual trade executions
2. `delta_tickers` - Price and volume updates
3. `delta_orderbook` - Level 2 order book (bid/ask levels)
4. `delta_orderbook_pressure` - Aggregated bid/ask imbalance
5. `delta_footprint` - Price-level volume aggregation
6. `delta_cumulative_delta` - CVD metrics

**Update Frequency**: ~300-500ms

---

## LLM Integration

### Models
- **LLMConversation** - Stores chat messages (userId, symbol, messages, metadata)
- **LLMGuidance** - Stores trading analysis (symbol, analysis, recommendations, risks)

### Services
- **llmController.ts** - Business logic:
  - `sendChatMessage()` - Handle user chat
  - `generateGuidance()` - Full trading analysis
  - `getChatHistory()` - Retrieve conversations
  - `generateQuickInsights()` - Market insights
  - Includes fallback for API failures

- **llmService.ts** - Provider integration:
  - Supports OpenAI GPT and Anthropic Claude
  - Retry logic with exponential backoff
  - Error handling and logging

### Configuration
```
# OpenAI
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=xxx

# Anthropic
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-sonnet-20240229
ANTHROPIC_API_KEY=xxx
```

**Note**: System works without API keys using intelligent fallback responses

---

## MCP Server Configuration

**File**: `.roo/mcp.json`

```json
{
  "mcpServers": {
    "redis": {
      "command": "uvx",
      "args": [
        "mcp-server-redis",
        "--url",
        "redis://localhost:315"
      ]
    }
  }
}
```

**Server**: mcp-server-redis  
**Execution**: uvx (astral-sh/uv)  
**Redis URL**: redis://localhost:315  
**Purpose**: Provides Model Context Protocol interface for AI/LLM integrations

---

## File Structure

### Frontend (`client/src/`)
```
api/                              # API integration
├── auth.ts, data.ts, llmGuidance.ts, etc.

components/
├── DeltaSpec/
│   ├── Dashboard.tsx             # Main container
│   ├── Header.tsx                # Logo, instrument selector, settings
│   ├── Sidebar.tsx               # 6-tab navigation, quick stats
│   ├── RightPanels.tsx           # Order book, alerts
│   ├── SettingsModal.tsx         # Settings dialog
│   └── Views/                    # 6 main view components
├── ui/                           # shadcn/ui components
└── Layout.tsx, Header.tsx, Footer.tsx

contexts/
├── AuthContext.tsx               # User auth, JWT tokens
└── MarketDataContext.tsx         # Real-time market data

hooks/
├── useMarketData.ts
├── useToast.ts
└── useMobile.ts

pages/
├── Login.tsx
├── Register.tsx
└── BlankPage.tsx
```

### Backend (`server/`)
```
config/
└── database.ts                   # MongoDB connection

models/
├── User.ts                       # User schema
├── LLMConversation.ts            # Chat history
└── LLMGuidance.ts                # Trading analysis

routes/
├── authRoutes.ts                 # Auth endpoints
├── dataRoutes.ts                 # Data endpoints
├── llmRoutes.ts                  # LLM endpoints
└── middlewares/
    └── auth.ts                   # JWT middleware

services/
├── redisStreamService.ts         # Real-time consumer
├── llmService.ts                 # LLM API wrapper
├── llmController.ts              # LLM logic
└── userService.ts                # User management

utils/
├── auth.ts                       # JWT helpers
└── password.ts                   # Bcrypt hashing

server.ts                         # Main app entry
```

### Data Collector (`data-collector/`)
```
redis_data_collector.py           # Main WebSocket consumer

analytics/
├── footprint.py                  # Price-level aggregation
└── cumulative_delta.py           # CVD calculation

utils/
├── config.py                     # Configuration
└── __init__.py

delta_data.db                     # SQLite history database
```

---

## State Management

### React Context
1. **AuthContext** - User profile, JWT tokens, login/logout
2. **MarketDataContext** - Real-time prices, order book, trades

### Data Persistence
- **localStorage** - User preferences, theme
- **MongoDB** - User profiles, LLM history
- **Redis Streams** - Real-time market data
- **SQLite** - Historical analysis data

---

## Authentication System

### JWT Strategy
- **Access Token**: Short-lived (API requests)
- **Refresh Token**: Long-lived (obtain new access tokens)
- **Middleware**: `requireUser()` protects routes
- **Storage**: Browser localStorage/cookies

### Default Strategy
- Email/password authentication
- Optional OAuth2 (Pythagora)
- User roles: user, admin

---

## Prerequisites & Installation

### Requirements
- Node.js 18+
- Python 3.8+
- Redis Server 6+
- MongoDB 5.0+

### Quick Setup
```bash
# Backend
cd server
npm install
cp .env.example .env  # Edit configuration
npm run dev

# Frontend
cd client
npm install
npm run dev

# Data Collector
cd data-collector
pip install -r requirements.txt
python redis_data_collector.py
```

### Service Startup Order
1. Redis (`redis-server`)
2. MongoDB (`mongod`)
3. Backend (`npm run dev`)
4. Data Collector (`python redis_data_collector.py`)
5. Frontend (`npm run dev`)

### Access Points
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health: http://localhost:3000/ping

---

## Environment Configuration

### Backend (`server/.env`)
```
DATABASE_URL=mongodb://localhost:27017/deltaspec
REDIS_HOST=localhost
REDIS_PORT=6379
ACCESS_TOKEN_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=xxx
PORT=3000
```

### Data Collector (`data-collector/utils/config.py`)
```python
CONFIG = {
    "redis_host": "localhost",
    "redis_port": 6379,
    "sqlite_path": "./delta_data.db",
    "footprint_min_trades": 120,
    "footprint_min_seconds": 5,
}
```

---

## Key Technologies & Libraries

### Frontend
- react@18, react-router-dom
- typescript, vite
- tailwindcss, shadcn/ui components
- axios (HTTP client)
- socket.io-client (Real-time)
- recharts (charting library)

### Backend
- express.js
- mongoose (MongoDB ODM)
- redis (Cache/Streams)
- jsonwebtoken, bcrypt
- @anthropic-ai/sdk, openai
- socket.io (Real-time)

### Data Collector
- websocket-client
- redis (Python client)
- requests (HTTP)
- sqlite3
- numpy (calculations)

---

## Performance & Optimization

### Code Splitting
- Dynamic imports for views
- Route-based code splitting
- Tree shaking

### React Optimizations
- React.memo for expensive components
- useMemo/useCallback for calculations
- Virtual scrolling ready

### Data Management
- Debouncing for inputs
- Real-time data buffering
- Smart WebSocket reconnection

---

## Analytics Modules

### Footprint Charts
- Aggregates trades by price level
- Calculates bid/ask volume per level
- Delta (Ask - Bid) imbalance
- Snapshots every ~5 seconds or 120 trades

### Cumulative Volume Delta (CVD)
- Running total of buy vs. sell volume
- Identifies divergence between price and order flow
- Used for trend confirmation

### Order Book Pressure
- Total bid size vs. total ask size imbalance
- Predicts short-term price direction
- Published to `delta_orderbook_pressure` stream

---

## Design System

### Styling
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Accessible pre-built components
- **Dark Theme** - Default with light mode toggle
- **Responsive** - Mobile-first design

### Color Coding
- Green - Buy/positive/bullish
- Red - Sell/negative/bearish
- Blue - Neutral/info
- Orange - Warning

### Visual Effects
- Frosted glass (backdrop blur)
- Subtle gradients
- Smooth transitions
- Pulsing indicators

---

## Status & Completion

✅ **Complete**:
- Frontend: All 6 views, responsive design, dark/light themes
- Backend: Express API, JWT auth, database schemas
- Data Collector: WebSocket, Redis, analytics
- LLM Integration: Models, services, real API calls
- MCP Configuration: Redis MCP server

⚠️ **In Progress**:
- Recharts integration for advanced charting
- Advanced filtering and sorting

🔄 **Future**:
- Mobile app (React Native)
- TradingView integration
- Push notifications
- Advanced risk tools

---

## Critical Notes

1. **Port Configuration**: Frontend (5173), Backend (3000), Redis (6379)
2. **Data Flow**: Exchange → Collector → Redis → Backend → Socket.io → Frontend
3. **Authentication**: Required for all endpoints except auth/login and auth/register
4. **Real-time Updates**: Socket.io broadcasts every 300-500ms
5. **Database Indexing**: MongoDB indexes on userId, symbol
6. **Fallback Logic**: LLM has intelligent fallback if API fails
7. **Token Refresh**: Frontend automatically refreshes expired tokens

---

## Quick Reference Commands

```bash
# Development
npm run dev                       # All services (root)
cd client && npm run dev         # Frontend only
cd server && npm run dev         # Backend only
cd data-collector && python redis_data_collector.py  # Collector

# Production
npm run build                    # Build all
cd client && npm run build       # Frontend build
cd server && npm run build       # Backend build

# Testing
npm test                         # All tests
cd client && npm test           # Frontend tests
cd server && npm test           # Backend tests

# Linting
npm run lint                     # Lint all
```

---

**For detailed information about specific components, see the documentation files:**
- BACKEND_ARCHITECTURE.md
- FRONTEND_ARCHITECTURE.md
- API_DOCUMENTATION.md
- DATA_COLLECTOR_DOCS.md
- IMPLEMENTATION_GUIDE.md
- LLM_INTEGRATION_INSTRUCTIONS.md
